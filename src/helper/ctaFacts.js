import {formatFileSize} from "./utils"

/**
 * Categorizes how the TTFB can be improved by Speed Kit
 *
 * @param {number} competitorTtfb The TTFB of the competitor
 * @param {number} speedKitTtfb The TTFB when installing Speed Kit
 * @param {boolean} isSpeedKitComparison true, if the website has Speed Kit installed
 * @param {Array} applied The facts that are not in need of improvement
 * @param {Array} improvements The facts that are in need of improvement
 */
export function categorizeTtfbFact(competitorTtfb, speedKitTtfb, isSpeedKitComparison, applied, improvements) {
  const ttfbFact = ['Reduce Request Latency']

  if (competitorTtfb > speedKitTtfb) {
    const ttfbDiff = competitorTtfb - speedKitTtfb

    if (isSpeedKitComparison) {
      ttfbFact.push(`Speed Kit caches your HTML in a CDN and thereby reduce the <strong>time-to-first-byte</strong> (<i>TTFB</i>) from <strong>${competitorTtfb} ms</strong> to <strong>${speedKitTtfb} ms</strong>.`)
      applied.push(ttfbFact)

      return
    }

    // Threshold for whether improvement potential is reasonable
    if (ttfbDiff > 10) {
      ttfbFact.push(`Speed Kit will cache your HTML in a CDN and thereby reduce the <strong>time-to-first-byte</strong> (<i>TTFB</i>) from <strong>${competitorTtfb} ms</strong> to <strong>${speedKitTtfb} ms</strong>.`)
      improvements.push(ttfbFact)

      return
    }
  }

  ttfbFact.push(`Your website displays a low <strong>time-to-first-byte</strong> of <strong>${competitorTtfb} ms</strong>.`)
  applied.push(ttfbFact)
}

/**
 * Categorizes the image optimation potential
 *
 * @param {number} competitorContentSize The content size of the competitor
 * @param {number} speedKitContentSize The content size when installing Speed Kit
 * @param {boolean} isSpeedKitComparison true, if the website has Speed Kit installed
 * @param {Array} applied The facts that are not in need of improvement
 * @param {Array} improvements The facts that are in need of improvement
 */
export function categorizeIOFact(competitorContentSize, speedKitContentSize, isSpeedKitComparison, applied, improvements) {
  const imageOptFact = ['Optimize Images']

  if (competitorContentSize && speedKitContentSize) {
    const imageSizeDiff = speedKitContentSize.images
    if (isSpeedKitComparison && imageSizeDiff > 0) {
      imageOptFact.push(`By resizing (<i>responsiveness</i>) and encoding (<i>WebP</i> & <i>Progessive JPEG</i>) <strong>images</strong>, Speed Kit saves <strong>${formatFileSize(imageSizeDiff)}</strong> of data.`)
      applied.push(imageOptFact)

      return
    }

    // Threshold for whether improvement potential is reasonable
    if (imageSizeDiff > 50000) {
      imageOptFact.push(`By resizing (<i>responsiveness</i>) and encoding (<i>WebP</i> & <i>Progessive JPEG</i>) <strong>images</strong>, Speed Kit will save <strong>${formatFileSize(imageSizeDiff)}</strong> of data.`)
      improvements.push(imageOptFact)

      return
    }

    imageOptFact.push('Your website serves sufficiently compressed image files.')
    applied.push(imageOptFact)
  }
}

/**
 * Categorizes whether the website has HTTP/2
 *
 * @param {Object} puppeteer The puppeteer data
 * @param {boolean} isSpeedKitComparison true, if the website has Speed Kit installed
 * @param {Array} applied The facts that are not in need of improvement
 * @param {Array} improvements The facts that are in need of improvement
 */
export function categorizeSSLFact(puppeteer, isSpeedKitComparison, applied, improvements) {
  const sslFact = ['Use HTTP/2']

  if (puppeteer) {
    if (isSpeedKitComparison || puppeteer.protocol === 'h2') {
      sslFact.push(`Your website uses HTTP/2.`)
      applied.push(sslFact)
      return
    }
  }
  sslFact.push(`Your website is currently using <strong>HTTP/1.1</strong>. With Speed Kit, everything will be fetched over an encrypted <strong>HTTP/2</strong> connection.`)
  improvements.push(sslFact)
}

/**
 * Categorizes the compression potential
 *
 * @param {number} competitorContentSize The content size of the competitor
 * @param {number} speedKitContentSize The content size when installing Speed Kit
 * @param {boolean} isSpeedKitComparison true, if the website has Speed Kit installed
 * @param {Array} applied The facts that are not in need of improvement
 * @param {Array} improvements The facts that are in need of improvement
 */
export function categorizeCompressionFact(competitorContentSize, speedKitContentSize, isSpeedKitComparison, applied, improvements) {
  const compressionFact = ['Use Compression']

  if (competitorContentSize && speedKitContentSize) {
    const textSizeDiff = competitorContentSize.text - speedKitContentSize.text

    if (textSizeDiff > 0) {
      if (isSpeedKitComparison) {
        compressionFact.push(`By compressing text resources with Brotli, Speed Kit reduces page weight by <strong>${formatFileSize(textSizeDiff)}</strong>.`)
        applied.push(compressionFact)

        return
      }

      // Threshold for whether improvement potential is reasonable
      if (textSizeDiff > 5000) {
        compressionFact.push(`By compressing text resources with Brotli, Speed Kit will reduce page weight by <strong>${formatFileSize(textSizeDiff)}</strong>.`)
        improvements.push(compressionFact)

        return
      }
    }

    compressionFact.push('Text-based HTTP resources on your website are compressed.')
    applied.push(compressionFact)
  }
}

/**
 * Categorizes the HTTP Caching potential
 *
 * @param competitorData The data from the competitor
 * @param speedKitData The data from the website when installing Speed Kit
 * @param {boolean} isSpeedKitComparison true, if the website has Speed Kit installed
 * @param {Array} applied The facts that are not in need of improvement
 * @param {Array} improvements The facts that are in need of improvement
 */
export function categorizeHTTPCachingFact(competitorData, speedKitData, isSpeedKitComparison, applied, improvements) {
  const cachingFact = ['Optimize HTTP Caching']

  const competitorCaching = competitorData.hits ? competitorData.hits.withCaching : null
  const speedKitCaching = speedKitData.hits ? speedKitData.hits.withCaching : null

  const competitorAmount = competitorCaching ? Math.round((100 / competitorData.requests) * competitorCaching) : 0
  const speedKitAmount = speedKitCaching ? Math.round((100 / speedKitData.requests) * speedKitCaching) : 0
  const cachingDiff = speedKitAmount - competitorAmount

  if (isSpeedKitComparison && cachingDiff > 0) {
    cachingFact.push(`Speed Kit takes care of correct <strong>caching headers</strong>. In total, it caches <strong>${speedKitAmount}%</strong> and keeps the cache fresh.`)
    applied.push(cachingFact)

    return
  }

  // Threshold for whether improvement potential is reasonable
  if (cachingDiff >= 5) {
    cachingFact.push(`Currently, <strong>${competitorAmount}%</strong> of resources are served with correct <strong>caching headers</strong>. Speed Kit will cache <strong>${speedKitAmount}%</strong> and keep the cache fresh.`)
    improvements.push(cachingFact)

    return
  }

  const amount = isSpeedKitComparison ? speedKitAmount : competitorAmount
  if (amount > 0) {
    cachingFact.push(`Your website serves <strong>${amount}%</strong> of resources with correct <strong>caching headers</strong>.`)
    applied.push(cachingFact)
  }
}

/**
 * Categorizes whether the website has enabled Progressive Web App
 *
 * @param {boolean} isSpeedKitComparison true, if the website has Speed Kit installed
 * @param {Array} applied The facts that are not in need of improvement
 * @param {Array} improvements The facts that are in need of improvement
 */
export function categorizePWAFact(isSpeedKitComparison, applied, improvements) {
  const offlineFact = ['Enable as Progressive Web App']

  if (isSpeedKitComparison) {
    offlineFact.push(`Without Internet connection, users can open your website, and Speed Kit will show the last-seen version (<i>offline mode</i>).`)
    applied.push(offlineFact)
  } else {
    offlineFact.push(`Without Internet connection, users cannot open your website, whereas Speed Kit will show the last-seen version (<i>offline mode</i>).`)
    improvements.push(offlineFact)
  }
}

/**
 * Categorizes whether the website has enabled client caching
 *
 * @param {boolean} isSpeedKitComparison true, if the website has Speed Kit installed
 * @param {Array} applied The facts that are not in need of improvement
 * @param {Array} improvements The facts that are in need of improvement
 */
export function categorizeClientCachingFact(isSpeedKitComparison, applied, improvements) {
  const clientFact = ['Benefit from Unique Caching Technology']

  if (isSpeedKitComparison) {
    clientFact.push(`Speed Kit serves data from fast caches and <i>make sure you never see stale content</i>, even for dynamic and personalized content.`)
    applied.push(clientFact)
  } else {
    clientFact.push(`Speed Kit will serve data from fast caches and <i>make sure you never see stale content</i>, even for dynamic and personalized content.`)
    improvements.push(clientFact)
  }
}

/**
 * Categorizes whether the user would perceive a performance boost
 *
 * @param competitorData The data from the competitor
 * @param speedKitData The data from the website when installing Speed Kit
 * @param {boolean} isSpeedKitComparison true, if the website has Speed Kit installed
 * @param {Array} applied The facts that are not in need of improvement
 * @param {Array} improvements The facts that are in need of improvement
 */
export function categorizeUserPerceivedPerformanceFact(competitorData, speedKitData, isSpeedKitComparison, applied, improvements) {
  const performanceFact = ['Improve User-Perceived Performance']
  const siImprovement = Math.round((competitorData.speedIndex - speedKitData.speedIndex) / competitorData.speedIndex * 100)
  const fmpImprovement = Math.round((competitorData.firstMeaningfulPaint - speedKitData.firstMeaningfulPaint) / competitorData.firstMeaningfulPaint * 100)
  if (siImprovement > 0 && fmpImprovement > 0) {
    if (isSpeedKitComparison) {
      performanceFact.push(`Speed Kit improves <strong>Speed Index</strong> by <strong>${siImprovement}%</strong> and <strong>First Meaningful Paint</strong> by <strong>${fmpImprovement}%</strong>.`)
      applied.push(performanceFact)

      return
    }

    performanceFact.push(`Speed Kit will improve <strong>Speed Index</strong> by <strong>${siImprovement}%</strong> and <strong>First Meaningful Paint</strong> by <strong>${fmpImprovement}%</strong>.`)
    improvements.push(performanceFact)
  }
}
