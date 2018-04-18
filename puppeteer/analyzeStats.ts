function count(resources: Iterable<Resource>) {
  let requests = 0
  let size = 0
  let errors = 0
  let redirects = 0
  let successful = 0
  let compressed = 0
  let fromDiskCache = 0
  let fromServiceWorker = 0
  for (const resource of resources) {
    const {
      status,
      size: resourceSize = 0,
      fromDiskCache: isFromDiskCache,
      fromServiceWorker: isFromServiceWorker,
      compressed: isCompressed,
    } = resource
    requests += 1
    size += resourceSize
    if (isCompressed) {
      compressed += 1
    }
    if (isFromDiskCache) {
      fromDiskCache += 1
    }
    if (isFromServiceWorker) {
      fromServiceWorker += 1
    }
    if (status >= 400) {
      errors += 1
    } else if (status >= 300) {
      redirects += 1
    } else {
      successful += 1
    }
  }

  return { requests, size, errors, redirects, successful, compressed, fromDiskCache, fromServiceWorker }
}

export function analyzeStats(resourceSet: Iterable<Resource>, domainSet: Set<string>) {
  const domains = domainSet.size
  const stats = Object.assign(count(resourceSet), { domains })

  return { stats }
}
