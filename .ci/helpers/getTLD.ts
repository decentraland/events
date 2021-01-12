import { env } from 'dcl-ops-lib/domain'

export const DEFAULT_TLD = {
  prd: "co",
  stg: "net",
  dev: "io",
}

export function getTLD(options: Partial<typeof DEFAULT_TLD> = {}): string {
  return (options as any)[env] || (DEFAULT_TLD as any)[env] || DEFAULT_TLD.dev
}
