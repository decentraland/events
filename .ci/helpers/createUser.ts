import * as aws from "@pulumi/aws";
import { all } from "@pulumi/pulumi";
import { slug } from "./utils";

export type UserResource = {
  bucket?: string[] | boolean
  email?: string[] | boolean
}

export function createUser(name: string) {
  const user = new aws.iam.User(name, { name });
  const creds = new aws.iam.AccessKey(name + "-key", { user: user.name });
  const role = new aws.iam.Role(`${name}-role`, {
    description: `Manage ${name} and make it publicly available`,
    assumeRolePolicy: user.arn.apply((arn) => {
      return aws.iam.assumeRolePolicyForPrincipal({ AWS: arn });
    }),
  });

  return {
    user,
    creds,
    role,
    // accessKeyId: creds.id,
    // secretAccessKey: creds.secret,
  };
}

export function addBucketResource(user: aws.iam.User, paths: string[]) {
  const name = user.name.get()
  const bucket = new aws.s3.Bucket(name)
  new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
    bucket: bucket.bucket,
    policy: all([ user.arn, bucket.bucket ]).apply(([ user, bucket]): aws.iam.PolicyDocument => ({
      "Version": "2012-10-17",
      "Statement": [
        ...paths.map(path => (
          {
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": [`arn:aws:s3:::${bucket}${path}`]
          } as aws.iam.PolicyStatement)),
        {
          "Effect": "Allow",
          "Action": ["s3:*"],
          "Principal": {
            "AWS": [user]
          },
          "Resource": [
            `arn:aws:s3:::${bucket}`,
            `arn:aws:s3:::${bucket}/*`
          ]
        }
      ]
    }))
  })

  return bucket
}

export function addEmailResource(user: aws.iam.User, domains: string[]) {
  for (const domain of domains) {
    const name = user.name.apply(name => `${name}-${slug(domain)}`).get()

    const domainIdentity = new aws.ses.DomainIdentity(`${name}-identity`, { domain })

    const policyDocument = all([user.arn, domainIdentity.arn]).apply(([user, domain]) => aws.iam.getPolicyDocument({
      version: '2012-10-17',
      statements: [
        {
          effect: 'Allow',
          actions: ['ses:*'],
          resources: [domain],
          principals: [{
            identifiers: [user],
            type: "AWS",
        }]
        }
      ]
    }))

    new aws.ses.IdentityPolicy(`${name}-identity-policy`, {
      identity: domainIdentity.arn,
      policy: policyDocument.json
    })
  }

  return true
}
