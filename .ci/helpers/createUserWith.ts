import * as aws from "@pulumi/aws";
import { interpolate } from "@pulumi/pulumi";

export type UserResource = {
  bucket?: boolean
  email?: boolean
}

export function createUserWith(name: string, resource: UserResource = {}) {
  const user = new aws.iam.User(name, { name });
  const creds = new aws.iam.AccessKey(name + "-key", { user: user.name });
  const role = new aws.iam.Role(`${name}-role`, {
    description: `Manage ${name} and make it publicly available`,
    assumeRolePolicy: user.arn.apply((arn) => {
      return aws.iam.assumeRolePolicyForPrincipal({ AWS: arn });
    }),
  });


  const bucket = new aws.s3.Bucket(name)
  const bucketPolicy = new aws.s3.BucketPolicy(`${name}-read-policy`, {
    bucket: bucket.bucket,
    policy: {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": "*",
          "Action": ["s3:GetObject"],
          "Resource": [ interpolate`arn:aws:s3:::${bucket.bucket}/*`]
        },
        {
          "Effect": "Allow",
          "Action": ["s3:*"],
          "Principal": {
            "AWS": [ interpolate`${user.arn}`]
          },
          "Resource": [
            interpolate`arn:aws:s3:::${bucket.bucket}`,
            interpolate`arn:aws:s3:::${bucket.bucket}/*`
          ]
        }
      ]
    }
  })

  return {
    role,
    user,
    bucket,
    bucketPolicy,
    creds,
    // accessKeyId: creds.id,
    // secretAccessKey: creds.secret,
  };
}
