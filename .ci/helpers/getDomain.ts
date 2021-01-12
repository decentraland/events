import { DEFAULT_TLD, getTLD } from "./getTLD";

export function getDomain(projectName: string, tld: Partial<typeof DEFAULT_TLD> = {}) {
  return [projectName, 'decentraland', getTLD(tld)].join('.')
}