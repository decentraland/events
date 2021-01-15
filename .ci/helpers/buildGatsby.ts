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
import { createHostForwardListenerRule } from "./alb";
import { GatsbyOptions } from "./types";
import { getCluster } from "./ecs";
import { getServiceVersion, slug, debug } from "./utils";

export async function buildGatsby(config: GatsbyOptions) {
  const serviceName = slug(config.name);
  const serviceVersion = getServiceVersion()
  const decentralandDomain = config.usePublicTLD ? publicDomain : envDomain
  const serviceTLD = config.usePublicTLD ? publicTLD : envTLD
  const serviceDomain = `${serviceName}.${decentralandDomain}`
  const emailDomains = []
  const domains = [ serviceDomain, ...(config.additionalDomains || []) ]
  const port = config.servicePort || 4000

  // cloudfront mapping
  let environment: awsx.ecs.KeyValuePair[] = []
  let serviceOrigins: aws.types.input.cloudfront.DistributionOrigin[] = []
  let serviceOrderedCacheBehaviors: aws.types.input.cloudfront.DistributionOrderedCacheBehavior[] = []

  if (config.serviceImage) {
    const portMappings: awsx.ecs.ContainerPortMappingProvider[] = []
    environment = [
      ...environment,
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
      environment = [
        ...environment,
        variable('SERVICE_TLD', serviceTLD),
        variable('SERVICE_DOMAIN', serviceDomain),
        variable('SERVICE_URL', `https://${serviceDomain}`),
        variable('PORT', `${port}`)
      ]

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
      serviceOrigins = [
        ...serviceOrigins,
        albOrigin(alb)
      ]

      // map paths to load balancer
      const servicePaths = config.servicePaths || [ '/api/*' ]
      serviceOrderedCacheBehaviors = [
        ...serviceOrderedCacheBehaviors,
        ...servicePaths.map(servicePath => apiBehavior(alb, servicePath))
      ]
    }

    // attach AWS resources
    if (config.useBucket || config.useEmail) {
      const access = createUser(serviceName)

      if (config.useBucket) {
        // create bucket and grant acccess
        const useBucket = config.useBucket === true ? [] : config.useBucket
        const bucket = addBucketResource(serviceName, access.user, useBucket)
        environment = [ ...environment, variable('AWS_BUCKET_NAME', bucket.bucket) ]

        // attach paths to cloudfront
        if (useBucket.length > 0) {
          serviceOrigins = [
            ...serviceOrigins,
            bucketOrigin(bucket)
          ]

          serviceOrderedCacheBehaviors = [
            ...serviceOrderedCacheBehaviors,
            ...useBucket.map(path => immutableContentBehavior(bucket, path))
          ]
        }
      }

      if (config.useEmail) {
        // grant access to email service
        const useEmail = config.useEmail === true ? [ decentralandDomain ] : config.useEmail

        if (useEmail[0]) {
          addEmailResource(serviceName, access.user, useEmail)
          environment = [ ...environment, variable('AWS_EMAIL_DOMAIN', useEmail[0]) ]

          for (const email of useEmail) {
            emailDomains.push(email)
          }
        }
      }

      environment = [
        ...environment,
        variable('AWS_ACCESS_KEY', access.creds.id),
        variable('AWS_ACCESS_SECRET', access.creds.secret),
      ]
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
    // From this field, you can enable or disable the selected distribution.
    enabled: true,

    // (Optional) Specify the maximum HTTP version that you want viewers to use to communicate with CloudFront.
    // The default value for new web distributions is http1.1. For viewers and CloudFront to use HTTP/2,
    // viewers must support TLS 1.2 or later, and must support server name identification (SNI).
    // In general, configuring CloudFront to communicate with viewers using HTTP/2 reduces latency.
    // You can improve performance by optimizing for HTTP/2. (values: http1.1 | http2)
    httpVersion: 'http2',

    // Alternate aliases the CloudFront distribution can be reached at, in addition to https://xxxx.cloudfront.net.
    // Required if you want to access the distribution via config.targetDomain as well.
    aliases: domains,

    // We only specify one origin for this distribution, the S3 content bucket.
    defaultRootObject: "index.html",
    origins: [
      bucketOrigin(contentBucket),
      // ...serviceOrigins
    ],

    // A CloudFront distribution can configure different cache behaviors based on the request path.
    // Here we just specify a single, default cache behavior which is just read-only requests to S3.
    defaultCacheBehavior: defaultStaticContentBehavior(contentBucket),
    orderedCacheBehaviors: [
      // ...serviceOrderedCacheBehaviors
    ],

    // "All" is the most broad distribution, and also the most expensive.
    // "100" is the least broad, and also the least expensive.
    // (values: PriceClass_100 | PriceClass_200 | PriceClass_All)
    priceClass: "PriceClass_100",

    // You can customize error responses. When CloudFront recieves an error from the origin (e.g. S3 or some other
    // web service) it can return a different error code, and return the response for a different resource.
    customErrorResponses: [
      { errorCode: 404, responseCode: 404, responsePagePath: "/404.html" }
    ],

    // A complex type that identifies ways in which you want to restrict distribution of your content.
    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },

    // A complex type that determines the distribution’s SSL/TLS configuration for communicating with viewers.
    viewerCertificate: {
      acmCertificateArn: getCertificateFor(serviceDomain),
      sslSupportMethod: "sni-only",
    },

    // A complex type that controls whether access logs are written for the distribution.
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
    logsBuckt: logs.bucket,
    contentBucket: contentBucket.bucket,
    cloudfrontDistribution: cdn.id,
    cloudfrontDistributionBehaviors: {
      '*': cdn.defaultCacheBehavior.targetOriginId
    },
  }

  for (const behavior of serviceOrderedCacheBehaviors) {
    output.cloudfrontDistributionBehaviors[behavior.pathPattern.toString()] = behavior.targetOriginId
  }

  if (emailDomains.length > 0) {
    output.emailFromDomains = emailDomains
  }

  if (environment.length > 0) {
    output.environment = {}

    for (const env of environment) {
      output.environment[env.name.toString()] = env.value
    }
  }

  return output
}
