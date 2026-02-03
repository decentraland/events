// Mock for @dcl/ui-env

export enum Env {
  DEVELOPMENT = "dev",
  STAGING = "stg",
  PRODUCTION = "prod",
}

// env.ts exports
export function getEnvList(): Env[] {
  return [Env.DEVELOPMENT, Env.STAGING, Env.PRODUCTION]
}

export function isEnv(value: string): value is Env {
  return Object.values(Env).includes(value as Env)
}

export function parseEnvVar(envVar: string): Env {
  if (isEnv(envVar)) {
    return envVar
  }
  throw new Error(`Invalid env: ${envVar}`)
}

export function getDefaultEnv(): Env {
  return Env.DEVELOPMENT
}

export function getEnv(): Env {
  return Env.DEVELOPMENT
}

// config.ts exports
export function createConfig<T>(config: Record<Env, T>): { get: () => T } {
  return {
    get: () => config[Env.DEVELOPMENT],
  }
}

// location.ts exports
export function getEnvFromTLD(_location: Location): Env | null {
  return null
}

export function getEnvFromQueryParam(_location: Location): Env | null {
  return null
}
