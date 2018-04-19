import { AnalyzeEvent } from '../Analyzer'

function count(resources: Iterable<Resource>): { [key: string]: number } {
  let requests = 0
  let size = 0
  let errors = 0
  let redirects = 0
  let successful = 0
  let compressed = 0
  let images = 0
  let scripts = 0
  let stylesheets = 0
  let fonts = 0
  let fromDiskCache = 0
  let fromServiceWorker = 0
  for (const resource of resources) {
    const {
      status,
      type,
      size: resourceSize = 0,
      fromDiskCache: isFromDiskCache,
      fromServiceWorker: isFromServiceWorker,
      compressed: isCompressed,
    } = resource
    requests += 1
    size += resourceSize
    if (type === 'Stylesheet') {
      stylesheets += 1
    } else if (type === 'Image') {
      images += 1
    } else if (type === 'Script') {
      scripts += 1
    } else if (type === 'Font') {
      fonts += 1
    }
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

  return {
    requests,
    size,
    errors,
    redirects,
    successful,
    compressed,
    images,
    scripts,
    stylesheets,
    fonts,
    fromDiskCache,
    fromServiceWorker,
  }
}

export function analyzeStats({ resources, domains }: AnalyzeEvent): Promise<{ [key: string]: number }> {
  return Promise.resolve(Object.assign(count(resources), { domains: domains.size }))
}
