import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import { allConfig } from "@pulumi/pulumi/runtime/config";

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

export function configurationEnvironment() {
  const settings = allConfig()
  return Object.keys(settings)
    .map(key => {
      if (key.startsWith('aws:') && settings[key] !== '[secret]') {
        const name = key.replace(/\W+/gi, '_').toUpperCase()
        const value = settings[key]
        return { name, value }

      } else if (key.startsWith(config.name + ':') ) {
        const name = key.slice(config.name.length + 1)
        const value = settings[key] === '[secret]' ? config.requireSecret(name) : settings[key]
        return { name, value }
      }
    })
    .filter(Boolean)
}
