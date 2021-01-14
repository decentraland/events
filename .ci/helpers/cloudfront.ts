import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export function albOrigin(alb: awsx.elasticloadbalancingv2.ApplicationLoadBalancer): aws.types.input.cloudfront.DistributionOrigin {
  return {
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
  }
}

export function bucketOrigin(bucket: aws.s3.Bucket): aws.types.input.cloudfront.DistributionOrigin {
  return {
    originId: bucket.arn,
    domainName: bucket.websiteEndpoint,
    customOriginConfig: {
      // Amazon S3 doesn't support HTTPS connections when using an S3 bucket configured as a website endpoint.
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginProtocolPolicy
      originProtocolPolicy: "http-only",
      httpPort: 80,
      httpsPort: 443,
      originSslProtocols: ["TLSv1.2"],
    },
  }
}

export function defaultStaticContentBehavior(bucket: aws.s3.Bucket): aws.types.input.cloudfront.DistributionDefaultCacheBehavior {
  const { pathPattern, ...behavior } = staticContentBehavior(bucket, '/*')
  return behavior
}

export function staticContentBehavior(bucket: aws.s3.Bucket, pathPattern: string): aws.types.input.cloudfront.DistributionOrderedCacheBehavior {
  return {
    targetOriginId: bucket.arn,
    pathPattern,
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
  }
}

export function immutableContentBehavior(bucket: aws.s3.Bucket, pathPattern: string): aws.types.input.cloudfront.DistributionOrderedCacheBehavior {
  return {
    targetOriginId: bucket.arn,
    pathPattern,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD", "OPTIONS"],
    forwardedValues: {
      cookies: { forward: "none" },
      queryString: false,
    },
    compress: true,
    minTtl: 1,
    defaultTtl: 86400,
    maxTtl: 31536000,
  }
}

export function apiBehavior(alb: awsx.elasticloadbalancingv2.ApplicationLoadBalancer, pathPattern: string): aws.types.input.cloudfront.DistributionOrderedCacheBehavior {
  return {
    compress: true,
    pathPattern,
    targetOriginId: alb.loadBalancer.id,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["HEAD", "OPTIONS", "GET", "POST", "DELETE", "PUT", "PATCH"],
    cachedMethods: ["HEAD", "OPTIONS", "GET"],
    forwardedValues: {
      headers: ["*"],
      queryString: true,
      cookies: { forward: "none" },
    },
    minTtl: 0,
    defaultTtl: 0,
    maxTtl: 0
  }
}
