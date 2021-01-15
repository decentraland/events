import { all, Output } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export function albOrigin(alb: awsx.elasticloadbalancingv2.ApplicationLoadBalancer): Output<aws.types.input.cloudfront.DistributionOrigin> {
  return all([alb.loadBalancer.arn, alb.loadBalancer.dnsName]).apply(([originId, domainName]) => ({
    // originId: elb.elbArn, //alb.loadBalancer.arn,
    // domainName: elb.dns,
    // originId: alb.loadBalancer.id, //alb.loadBalancer.arn,
    // domainName: alb.loadBalancer.dnsName,
    originId,
    domainName,
    customOriginConfig: {
      originProtocolPolicy: "https-only",
      httpPort: 80,
      httpsPort: 443,
      originSslProtocols: ["TLSv1.2"],
    }
  }))
}

export function bucketOrigin(bucket: aws.s3.Bucket): Output<aws.types.input.cloudfront.DistributionOrigin> {
  return all([ bucket.arn, bucket.websiteEndpoint ]).apply(([originId, domainName]) => ({
    originId,
    domainName,
    customOriginConfig: {
      // Amazon S3 doesn't support HTTPS connections when using an S3 bucket configured as a website endpoint.
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html#DownloadDistValuesOriginProtocolPolicy
      originProtocolPolicy: "http-only",
      httpPort: 80,
      httpsPort: 443,
      originSslProtocols: ["TLSv1.2"],
    },
  }))
}

export function defaultStaticContentBehavior(bucket: aws.s3.Bucket): Output<aws.types.input.cloudfront.DistributionDefaultCacheBehavior> {
  return staticContentBehavior(bucket, '/*').apply(({ pathPattern, ...behavior }) => behavior)
}

export function staticContentBehavior(bucket: aws.s3.Bucket, pathPattern: string): Output<aws.types.input.cloudfront.DistributionOrderedCacheBehavior> {
  return all([bucket.arn]).apply(([targetOriginId]) => ({
    compress: true,
    targetOriginId,
    pathPattern,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD", "OPTIONS"],
    forwardedValues: {
      headers: ["*"],
      cookies: { forward: "none" },
      queryString: false,
    },
    minTtl: 0,
    defaultTtl: 600,
    maxTtl: 600,
  }))
}

export function immutableContentBehavior(bucket: aws.s3.Bucket, pathPattern: string): Output<aws.types.input.cloudfront.DistributionOrderedCacheBehavior> {
  return all([bucket.arn]).apply(([targetOriginId]) => ({
    compress: true,
    targetOriginId,
    pathPattern,
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD", "OPTIONS"],
    forwardedValues: {
      headers: ["*"],
      cookies: { forward: "none" },
      queryString: false,
    },
    minTtl: 1,
    defaultTtl: 86400,
    maxTtl: 31536000,
  }))
}

export function apiBehavior(alb: awsx.elasticloadbalancingv2.ApplicationLoadBalancer, pathPattern: string): Output<aws.types.input.cloudfront.DistributionOrderedCacheBehavior> {
  return all([alb.loadBalancer.arn]).apply(([targetOriginId]) => ({
    compress: true,
    pathPattern,
    targetOriginId,
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
    maxTtl: 0
  }))
}
