import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import { env, domain as envDomain, publicDomain, publicTLD, envTLD } from "dcl-ops-lib/domain";
import { getCertificateFor } from "dcl-ops-lib/certificate";
import { acceptAlbSecurityGroupId } from "dcl-ops-lib/acceptAlb";
import { acceptBastionSecurityGroupId } from "dcl-ops-lib/acceptBastion";
import { acceptDbSecurityGroupId } from "dcl-ops-lib/acceptDb";
import { accessTheInternetSecurityGroupId } from "dcl-ops-lib/accessTheInternet";
import { getAlb } from "dcl-ops-lib/alb";

import { variable, configurationEnvironment } from "./env"
import { albOrigin, apiBehavior, bucketOrigin, defaultStaticContentBehavior, immutableContentBehavior } from "./cloudfront";
import { addBucketResource, addEmailResource, createUser } from "./createUser";
import { getServiceVersion, slug } from "./utils";
import { GatsbyOptions } from "./types";
import { createHostForwardListenerRule } from "./alb";
import { getCluster } from "./ecs";

export async function buildGatsby(config: GatsbyOptions) {
  console.log(`Creating gatsby service with:`, JSON.stringify(config, null, 2))

  const serviceName = slug(config.name);
  const serviceVersion = getServiceVersion()
  const decentralandDomain = config.usePublicTLD ? publicDomain : envDomain
  const serviceTLD = config.usePublicTLD ? publicTLD : envTLD
  const serviceDomain = `${serviceName}.${decentralandDomain}`
  const emailDomains = []
  const domains = [ serviceDomain, ...(config.additionalDomains || []) ]
  const port = config.servicePort || 4000

  // cloudfront mapping
  const origins: aws.types.input.cloudfront.DistributionOrigin[] = []
  const orderedCacheBehaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[] = []

  if (config.serviceImage) {
    const portMappings: awsx.ecs.ContainerPortMappingProvider[] = []
    const environment = [
      variable('IMAGE', config.serviceImage),
      variable('SERVICE_NAME', serviceName),
      variable('SERVICE_VERSION', serviceVersion),
      ...configurationEnvironment(),
      ...(config.serviceEnvironment || []),
    ]

    const cluster = await getCluster()
    const securityGroups = await Promise.all([
      acceptBastionSecurityGroupId(),
      acceptDbSecurityGroupId(),
      accessTheInternetSecurityGroupId()
    ])

    // if config.servicePaths !== false service will ve public
    if (config.servicePaths !== false) {
      // iniject public service environment
      environment.push(variable('SERVICE_TLD', serviceTLD))
      environment.push(variable('SERVICE_DOMAIN', serviceDomain))
      environment.push(variable('SERVICE_URL', `https://${serviceDomain}`))
      environment.push(variable('PORT', `${port}`))

      // grant access to load banlancer
      securityGroups.push(await acceptAlbSecurityGroupId())

      // create target group
      const { alb, listener } = await getAlb();
      const targetGroup = alb.createTargetGroup(("tg-" + serviceName).slice(-32), {
        port,
        protocol: "HTTP",
        vpc: cluster.vpc,
        healthCheck: {
          path: config.serviceHealthCheck || "/api/status",
          matcher: "200",
          interval: 10,
          unhealthyThreshold: 5,
          healthyThreshold: 5,
        },
      });

      // attach target group to service
      portMappings.push(targetGroup)

      // attach target group to load balancer
      createHostForwardListenerRule(`${env}-ls-${serviceName}`, {
        domains,
        listener,
        targetGroup: targetGroup.targetGroup,
      })

      // add load balancer to origin list
      origins.push(albOrigin(alb))

      // map paths to load balancer
      const servicePaths = config.servicePaths || [ '/api/*' ]
      for (const servicePath of servicePaths) {
        orderedCacheBehaviors.push(apiBehavior(alb, servicePath))
      }
    }

    // attach AWS resources
    if (config.useBucket || config.useEmail) {
      const access = createUser(serviceName)

      if (config.useBucket) {
        // create bucket and grant acccess
        const useBucket = config.useBucket === true ? [] : config.useBucket
        const bucket = addBucketResource(serviceName, access.user, useBucket)
        environment.push(variable('AWS_BUCKET_NAME', bucket.bucket))

        // attach paths to cloudfront
        if (useBucket.length > 0) {
          origins.push(bucketOrigin(bucket))
          for (const path of useBucket) {
            orderedCacheBehaviors.push(immutableContentBehavior(bucket, path))
          }
        }
      }

      if (config.useEmail) {
        // grant access to email service
        const useEmail = config.useEmail === true ? [ decentralandDomain ] : config.useEmail

        if (useEmail[0]) {
          addEmailResource(serviceName, access.user, useEmail)
          environment.push(variable('AWS_EMAIL_DOMAIN', useEmail[0]))

          for (const email of useEmail) {
            emailDomains.push(email)
          }
        }
      }

      environment.push(variable('AWS_ACCESS_KEY', access.creds.id))
      environment.push(variable('AWS_ACCESS_SECRET', access.creds.secret))
    }

    // create Fargate service
    new awsx.ecs.FargateService(
      `${serviceName}-${serviceVersion}`,
      {
        cluster,
        securityGroups,
        desiredCount: config.serviceDesiredCount || 1,
        taskDefinitionArgs: {
          containers: {
            service: {
              image: config.serviceImage,
              memoryReservation: config.serviceMemory || 256,
              repositoryCredentials: {
                credentialsParameter: 'arn:aws:secretsmanager:us-east-1:564327678575:secret:dev/docker/authorization-xr3Rh8'
              },
              essential: true,
              environment,
              portMappings,
              logConfiguration: {
                logDriver: "awslogs",
                options: {
                  "awslogs-group": serviceName,
                  "awslogs-region": "us-east-1",
                  "awslogs-stream-prefix": serviceName,
                },
              },
            },
          },
        },
      },
      {
        customTimeouts: {
          create: "5m",
          update: "5m",
          delete: "5m",
        },
      }
    );

  }

  // const userAndBucket = createBucketWithUser(`builder-assetpacks-${env}`)
  // contentBucket is the S3 bucket that the website's contents will be stored in.
  const contentBucket = new aws.s3.Bucket(serviceName + "-website", {
    acl: "public-read",
    // Configure S3 to serve bucket contents as a website. This way S3 will automatically convert
    // requests for "foo/" to "foo/index.html".

    website: {
      indexDocument: "index.html",
      errorDocument: "404.html",
    },
    corsRules: [
      {
        allowedMethods: ["GET", "HEAD"],
        allowedOrigins: ["*"],
        maxAgeSeconds: 3600
      }
    ]
  });


  // logsBucket is an S3 bucket that will contain the CDN's request logs.
  const logs = new aws.s3.Bucket(serviceName + "-logs", { acl: "private" });

  const cdn = new aws.cloudfront.Distribution(serviceName + "-cdn", {

    enabled: true,

    // Alternate aliases the CloudFront distribution can be reached at, in addition to https://xxxx.cloudfront.net.
    // Required if you want to access the distribution via config.targetDomain as well.
    aliases: domains,

    // We only specify one origin for this distribution, the S3 content bucket.
    defaultRootObject: "index.html",
    origins,

    // A CloudFront distribution can configure different cache behaviors based on the request path.
    // Here we just specify a single, default cache behavior which is just read-only requests to S3.
    defaultCacheBehavior: defaultStaticContentBehavior(contentBucket),
    orderedCacheBehaviors,

    // "All" is the most broad distribution, and also the most expensive.
    // "100" is the least broad, and also the least expensive.
    priceClass: "PriceClass_100",

    // You can customize error responses. When CloudFront recieves an error from the origin (e.g. S3 or some other
    // web service) it can return a different error code, and return the response for a different resource.
    customErrorResponses: [
      { errorCode: 404, responseCode: 404, responsePagePath: "/404.html" }
    ],

    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },

    viewerCertificate: {
      acmCertificateArn: getCertificateFor(serviceDomain),
      sslSupportMethod: "sni-only",
    },

    loggingConfig: {
      bucket: logs.bucketDomainName,
      includeCookies: false,
      prefix: `${serviceDomain}/`,
    },
  });

  const hostedZoneId = aws.route53
    .getZone({ name: decentralandDomain }, { async: true })
    .then((zone: { zoneId: string }) => zone.zoneId);


  new aws.route53.Record(serviceDomain, {
    name: serviceName,
    zoneId: hostedZoneId,
    type: "A",
    aliases: [
      {
        name: cdn.domainName,
        zoneId: cdn.hostedZoneId,
        evaluateTargetHealth: false,
      },
    ],
  });

  // Export properties from this stack. This prints them at the end of `pulumi up` and
  // makes them easier to access from the pulumi.com.
  const output: Record<string, any> = {
    contentBucket: contentBucket.bucket,
    cloudfrontDistribution: cdn.id,
    cloudfrontDistributionBehaviors: {
      '*': cdn.defaultCacheBehavior.targetOriginId
    }
  }

  for (const behavior of orderedCacheBehaviors) {
    output.cloudfrontDistributionBehaviors[behavior.pathPattern.toString()] = behavior.targetOriginId
  }

  if (emailDomains.length > 0) {
    output.emailFromDomains = emailDomains
  }

  return output
}
