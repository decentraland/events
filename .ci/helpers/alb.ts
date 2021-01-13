import * as aws from "@pulumi/aws";

export type HostForwardOptions = {
  domains: string[],
  listener: aws.lb.GetListenerResult,
  targetGroup: aws.lb.TargetGroup
}

export function createHostForwardListenerRule(name: string, options: HostForwardOptions) {
  return new aws.alb.ListenerRule(name, {
    listenerArn: options.listener.arn,
    conditions: [
      {
        hostHeader: {
          values: options.domains
        }
      }
    ],
    actions: [
      {
        type: "forward",
        targetGroupArn: options.targetGroup.arn,
      },
    ],
  })
}