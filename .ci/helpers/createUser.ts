import * as aws from "@pulumi/aws";
import { all } from "@pulumi/pulumi";
import { slug } from "./utils";

export type UserResource = {
  bucket?: string[] | boolean
  email?: string[] | boolean
}

function getUserName(service: string) {
  return `${service}-user`
}

export function createUser(service: string) {
  const name = getUserName(service)
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


export function addBucketResource(service: string, user: aws.iam.User, paths: string[]) {
  const name = getUserName(service)
  const bucket = new aws.s3.Bucket(name,
    paths.length === 0 ? { acl:  "private" } : {
      acl: "public-read",
      website: { indexDocument: 'index.html' },
      corsRules: [
        {
          allowedMethods: ["GET", "HEAD"],
          exposeHeaders: ["ETag"],
          allowedOrigins: ["*"],
          maxAgeSeconds: 3600
        }
      ]
    }
  )

  new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
    bucket: bucket.bucket,
    policy: all([ user.arn, bucket.bucket ]).apply(([ user, bucket]): aws.iam.PolicyDocument => ({
      "Version": "2012-10-17",
      "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject"
            ],
            "Resource": [
                `arn:aws:s3:::${bucket}/*`
            ]
        },
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

export function addEmailResource(service: string, user: aws.iam.User, domains: string[]) {
  for (const domain of domains) {
    const name = `${getUserName(service)}-${slug(domain)}`
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
