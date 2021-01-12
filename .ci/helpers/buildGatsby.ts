import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";

import { env } from "dcl-ops-lib/domain";
import { getCertificateFor } from "dcl-ops-lib/certificate";
import { acceptAlbSecurityGroupId } from "dcl-ops-lib/acceptAlb";
import { acceptBastionSecurityGroupId } from "dcl-ops-lib/acceptBastion";
import { acceptDbSecurityGroupId } from "dcl-ops-lib/acceptDb";
import withCache from "dcl-ops-lib/withCache";

import { variable } from "./env"
import { getAlb } from "dcl-ops-lib/alb";
import { getDomain } from "./getDomain";
import { getDomainAndSubdomain } from "dcl-ops-lib/getDomainAndSubdomain";
import { DEFAULT_TLD } from "./getTLD";

const pkg = require('../../package.json')

export type GatsbyWebsite = {
  name: string;
  domain?: string;
  environment?: awsx.ecs.KeyValuePair[];
  vpc?: awsx.ec2.Vpc;
  tld?: Partial<typeof DEFAULT_TLD>
  certificateArn?: string;
  additionalDomains?: string[];
  defaultPath?: string;
  memoryReservation?: number
};

const healthCheck = {
  path: "/api/status",
  matcher: "200-399",
  interval: 10,
  unhealthyThreshold: 5,
  healthyThreshold: 5,
};

const getCluster = withCache(async () => {
  const cluster = `${env}-name`
  return new awsx.ecs.Cluster(cluster + "-ref", {
    cluster: aws.ecs.Cluster.get(cluster + "-ref-2", cluster),
  })
})

const defaultLogs = (serviceName: string) =>
  ({
    logDriver: "awslogs",
    options: {
      "awslogs-group": serviceName,
      "awslogs-region": "us-east-1",
      "awslogs-stream-prefix": serviceName,
    },
  } as any);

const extraOpts = {
  customTimeouts: {
    create: "5m",
    update: "5m",
    delete: "5m",
  },
};

export async function buildGatsby(config: GatsbyWebsite) {
  // Load the Pulumi program configuration. These act as the "parameters" to the Pulumi program,
  // so that different Pulumi Stacks can be brought up using the same code.
  const domain = config.domain || getDomain(config.name, config.tld || {})
  const certificateArn = config.certificateArn || getCertificateFor(domain);
  const additionalDomains = config.additionalDomains || [];
  const slug = config.name.replace(/\./g, "-");
  const memoryReservation = config.memoryReservation || 512
  const proxy = pkg.server?.proxy || [ '/api/*' ]
  const bucket = pkg.server?.bucket || []
  const email = pkg.server?.email || false
  const port = 4000

  // const db = setupDatabasePermissions(config.name)
  const image = [process.env['CI_REGISTRY_IMAGE'], process.env['CI_COMMIT_SHA']].join(':')
  const { alb, listener, dns } = await getAlb();

  const securityGroups = await Promise.all([
    acceptAlbSecurityGroupId(),
    acceptBastionSecurityGroupId(),
    acceptDbSecurityGroupId(),
  ])

  const vpc = config.vpc ? config.vpc : awsx.ec2.Vpc.getDefault()
  const targetGroup = alb.createTargetGroup(("targ-" + slug).slice(-32), {
    protocol: "HTTP",
    port,
    healthCheck,
    vpc,
  });

  // const userAndBucket = createBucketWithUser(`builder-assetpacks-${env}`)
  // contentBucket is the S3 bucket that the website's contents will be stored in.
  const contentBucket = new aws.s3.Bucket(slug + "-website", {
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


  const serviceListenerRule = new aws.alb.ListenerRule(`listenr-${slug}-back`, {
    listenerArn: listener.arn,
    conditions: [
      { hostHeader: { values: [domain] } }
    ],
    actions: [
      {
        type: "forward",
        targetGroupArn: targetGroup.targetGroup.arn,
      },
    ],
  })

  const domainParts = getDomainAndSubdomain(domain);
  const hostedZoneId = aws.route53
    .getZone({ name: domainParts.parentDomain }, { async: true })
    .then((zone: { zoneId: string }) => zone.zoneId);

  const cluster = await getCluster()

  const service = new awsx.ecs.FargateService(
    config.name + "-" + env,
    {
      cluster,
      securityGroups,
      desiredCount: 1,
      taskDefinitionArgs: {
        containers: {
          service: {
            environment: [
              variable('IMAGE', image),
              variable('SITE_URL', `https://${getDomain(config.name, config.tld)}`),
              variable('GATSBY_SITE_URL', `https://${getDomain(config.name, config.tld)}`),
              variable('PORT', `${port}`),
              ...(config.environment || [])
            ],
            portMappings: [targetGroup],
            logConfiguration: defaultLogs(config.name),
            image: image,
            essential: true,
            memoryReservation,
          },
        },
      },
    },
    extraOpts
  );

  // logsBucket is an S3 bucket that will contain the CDN's request logs.
  const logs = new aws.s3.Bucket(slug + "-logs", { acl: "private" });

  const cdn = new aws.cloudfront.Distribution(slug + "-cdn", {
    enabled: true,
    // Alternate aliases the CloudFront distribution can be reached at, in addition to https://xxxx.cloudfront.net.
    // Required if you want to access the distribution via config.targetDomain as well.
    aliases: [
      domain,
      ...additionalDomains
    ],
    // We only specify one origin for this distribution, the S3 content bucket.
    origins: [
      {
        // originId: elb.elbArn, //alb.loadBalancer.arn,
        // domainName: elb.dns,
        originId: alb.loadBalancer.id, //alb.loadBalancer.arn,
        domainName: alb.loadBalancer.dnsName,
        customOriginConfig: {
          originProtocolPolicy: "https-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        }
      },
      {
        originId: contentBucket.arn,
        domainName: contentBucket.websiteEndpoint,
        customOriginConfig: {
          // Amazon S3 doesn't support HTTPS connections when using an S3 bucket configured as a website endpoint.
          // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginProtocolPolicy
          originProtocolPolicy: "http-only",
          httpPort: 80,
          httpsPort: 443,
          originSslProtocols: ["TLSv1.2"],
        },
      },
    ],
    defaultRootObject: "index.html",
    // A CloudFront distribution can configure different cache behaviors based on the request path.
    // Here we just specify a single, default cache behavior which is just read-only requests to S3.
    defaultCacheBehavior: {
      targetOriginId: contentBucket.arn,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      forwardedValues: {
        cookies: { forward: "none" },
        queryString: false,
      },
      compress: true,
      minTtl: 0,
      defaultTtl: 600,
      maxTtl: 600,
    },
    orderedCacheBehaviors: proxy.map(pathPattern => ({
      compress: true,
      pathPattern,
      targetOriginId: alb.loadBalancer.id,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["HEAD", "OPTIONS", "GET", "POST", "DELETE", "PUT", "PATCH"],
      cachedMethods: ["HEAD", "OPTIONS", "GET"],
      forwardedValues: {
        headers: ["*"],
        queryString: true,
        queryStringCacheKeys: [],
        cookies: { forward: "none" },
      },
      minTtl: 0,
      defaultTtl: 0,
      maxTtl: 0,
    })),
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
      acmCertificateArn: certificateArn,
      sslSupportMethod: "sni-only",
    },

    loggingConfig: {
      bucket: logs.bucketDomainName,
      includeCookies: false,
      prefix: `${domain}/`,
    },
  });


  const aRecord = new aws.route53.Record(domain, {
    name: domainParts.subdomain,
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
  return {
    domain,
    bucketName: contentBucket.bucket,
    contentBucket: contentBucket.bucket,
    cloudfrontDistribution: cdn.id,
    contentBucketUri: pulumi.interpolate`s3://${contentBucket.bucket}`,
    contentBucketWebsiteEndpoint: contentBucket.websiteEndpoint,
    cloudFrontDomain: cdn.domainName,
    targetDomainEndpoint: `https://${domain}/`,
    aRecord,
    cdn,
    service,
    serviceListenerRule,
    listener,
    alb,
    dns,
  }
}
