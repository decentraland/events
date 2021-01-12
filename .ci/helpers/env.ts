import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export function variable(
  name: string,
  value: pulumi.Input<string> = config.get(name) || process.env[name] || ''
): awsx.ecs.KeyValuePair {
  return { name, value }
}

export function secret(name: string, secretKey: string = name) {
  return variable(name, config.requireSecret(secretKey))
}
