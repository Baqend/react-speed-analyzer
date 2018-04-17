export function analyzeStats(resourceSet: Set<Resource>, domainSet: Set<string>) {
  const requests = resourceSet.size
  const domains = domainSet.size

  const resources = [...resourceSet]
  const errors = resources.filter(resource => resource.status >= 400).length
  const redirects = resources.filter(resource => resource.status >= 300 && resource.status < 400).length
  const successful = resources.filter(resource => resource.status < 300).length
  const fromDiskCache = resources.filter(resource => resource.fromDiskCache).length
  const fromServiceWorker = resources.filter(resource => resource.fromServiceWorker).length

  const stats = {
    requests,
    domains,
    errors,
    redirects,
    successful,
    fromDiskCache,
    fromServiceWorker,
  }

  return { stats }
}
