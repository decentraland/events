export function slug (value: string) {
  return value.replace(/\W/g, "-").replace(/^\-+/, '').replace(/\-+$/, '');
}

export function truthy<T>(values: (T | undefined | null | false)[]): T[] {
  return values.filter(Boolean) as T[]
}

export function getServiceVersion() {
  return process.env['CI_COMMIT_TAG'] ||
    (process.env['CI_COMMIT_SHA'] && process.env['CI_COMMIT_SHA'].slice(0, 6)) ||
    process.env['CI_COMMIT_BRANCH'] || 'current'
}
