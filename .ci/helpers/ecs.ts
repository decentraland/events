import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { env } from "dcl-ops-lib/domain"
import withCache from "dcl-ops-lib/withCache"

export const getCluster = withCache(async () => {
  const cluster = `${env}-main`
  return new awsx.ecs.Cluster(cluster + "-ref", {
    cluster: aws.ecs.Cluster.get(cluster + "-ref-2", cluster),
  })
})