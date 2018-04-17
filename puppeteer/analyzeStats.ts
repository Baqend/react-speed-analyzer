function count(resourceSet: Set<Resource>) {
  let requests = 0
  let errors = 0
  let redirects = 0
  let successful = 0
  let fromDiskCache = 0
  let fromServiceWorker = 0
  for (const { status, fromDiskCache: isFromDiskCache, fromServiceWorker: isFromServiceWorker } of resourceSet) {
    requests += 1
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

  return { requests, errors, redirects, successful, fromDiskCache, fromServiceWorker }
}

export function analyzeStats(resourceSet: Set<Resource>, domainSet: Set<string>) {
  const domains = domainSet.size
  const stats = Object.assign(count(resourceSet), { domains })

  return { stats }
}
