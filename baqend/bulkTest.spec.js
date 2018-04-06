const { expect } = require('chai');
// const { aggregate } = require('./bulkTest');

const fields = ['speedIndex', 'firstMeaningfulPaint', 'ttfb', 'domLoaded', 'fullyLoaded', 'lastVisualChange'];

function aggregate(runs) {
  const divideBy = runs.length;
  const meanValues = runs.reduce((prev, run) => {
    const result = prev;
    for (const field of fields) {
      result[field] = (prev[field] || 0) + (run[field] / divideBy);
    }

    return result;
  }, {});

  return meanValues;
}

describe('bulkTest', () => {
  it('aggregates mean values correctly', () => {
    const mean1 =  [
      {
        "loadTime": 660,
        "ttfb": 318,
        "domLoaded": 569,
        "load": 657,
        "fullyLoaded": 660,
        "firstPaint": 544,
        "startRender": 593,
        "speedIndex": 604,
        "firstMeaningfulPaint": 544,
        "lastVisualChange": 793,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9991,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15099,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112791,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195599,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 600,
          "p90": 600,
          "p95": 600,
          "p99": 800,
          "p100": 800
        },
        "hits": {
          "other": 11
        }
      },
      {
        "loadTime": 754,
        "ttfb": 421,
        "domLoaded": 674,
        "load": 760,
        "fullyLoaded": 754,
        "firstPaint": 653,
        "startRender": 694,
        "speedIndex": 704,
        "firstMeaningfulPaint": 653,
        "lastVisualChange": 893,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9992,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15099,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112789,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195597,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 700,
          "p90": 700,
          "p95": 700,
          "p99": 900,
          "p100": 900
        },
        "hits": {
          "other": 11
        }
      },
      {
        "loadTime": 633,
        "ttfb": 323,
        "domLoaded": 555,
        "load": 632,
        "fullyLoaded": 633,
        "firstPaint": 493,
        "startRender": 494,
        "speedIndex": 504,
        "firstMeaningfulPaint": 540,
        "lastVisualChange": 693,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9991,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15099,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112788,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195596,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 500,
          "p90": 500,
          "p95": 500,
          "p99": 700,
          "p100": 700
        },
        "hits": {
          "other": 11
        }
      },
      {
        "loadTime": 648,
        "ttfb": 339,
        "domLoaded": 566,
        "load": 645,
        "fullyLoaded": 648,
        "firstPaint": 505,
        "startRender": 593,
        "speedIndex": 600,
        "firstMeaningfulPaint": 547,
        "lastVisualChange": 593,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9991,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15099,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112788,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195595,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 600,
          "p90": 600,
          "p95": 600,
          "p99": 600,
          "p100": 600
        },
        "hits": {
          "other": 11
        }
      },
      {
        "loadTime": 674,
        "ttfb": 367,
        "domLoaded": 604,
        "load": 679,
        "fullyLoaded": 674,
        "firstPaint": 542,
        "startRender": 594,
        "speedIndex": 600,
        "firstMeaningfulPaint": 589,
        "lastVisualChange": 594,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9991,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15098,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112787,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195595,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 600,
          "p90": 600,
          "p95": 600,
          "p99": 600,
          "p100": 600
        },
        "hits": {
          "other": 11
        }
      }
    ];
    expect(aggregate(mean1)).to.eql({ speedIndex: 602.4000000000001, firstMeaningfulPaint: 574.5999999999999,
      "ttfb": 353.6,
      "domLoaded": 593.6,
      "fullyLoaded": 673.8,
      "lastVisualChange": 713.1999999999999  });
    const mean2 =  [
      {
        "loadTime": 660,
        "ttfb": 318,
        "domLoaded": 569,
        "load": 657,
        "fullyLoaded": 660,
        "firstPaint": 544,
        "startRender": 593,
        "speedIndex": 604,
        "firstMeaningfulPaint": 544,
        "lastVisualChange": 793,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9991,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15099,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112791,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195599,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 600,
          "p90": 600,
          "p95": 600,
          "p99": 800,
          "p100": 800
        },
        "hits": {
          "other": 11
        }
      },
      {
        "loadTime": 754,
        "ttfb": 421,
        "domLoaded": 674,
        "load": 760,
        "fullyLoaded": 754,
        "firstPaint": 653,
        "startRender": 694,
        "speedIndex": 704,
        "firstMeaningfulPaint": 653,
        "lastVisualChange": 893,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9992,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15099,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112789,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195597,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 700,
          "p90": 700,
          "p95": 700,
          "p99": 900,
          "p100": 900
        },
        "hits": {
          "other": 11
        }
      },
      {
        "loadTime": 633,
        "ttfb": 323,
        "domLoaded": 555,
        "load": 632,
        "fullyLoaded": 633,
        "firstPaint": 493,
        "startRender": 494,
        "speedIndex": 504,
        "firstMeaningfulPaint": 540,
        "lastVisualChange": 693,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9991,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15099,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112788,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195596,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 500,
          "p90": 500,
          "p95": 500,
          "p99": 700,
          "p100": 700
        },
        "hits": {
          "other": 11
        }
      },
      {
        "loadTime": 648,
        "ttfb": 339,
        "domLoaded": 566,
        "load": 645,
        "fullyLoaded": 648,
        "firstPaint": 505,
        "startRender": 593,
        "speedIndex": 600,
        "firstMeaningfulPaint": 547,
        "lastVisualChange": 593,
        "requests": 11,
        "failedRequests": 0,
        "domains": [
          {
            "bytes": 9991,
            "requests": 1,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": false,
            "url": "fonts.gstatic.com"
          },
          {
            "bytes": 15099,
            "requests": 2,
            "cdn_provider": "Google",
            "connections": 1,
            "isAdDomain": true,
            "url": "www.google-analytics.com"
          },
          {
            "bytes": 35309,
            "requests": 1,
            "cdn_provider": "NetDNA",
            "connections": 1,
            "isAdDomain": false,
            "url": "code.jquery.com"
          },
          {
            "bytes": 112788,
            "requests": 7,
            "connections": 1,
            "isAdDomain": false,
            "url": "moellers.systems"
          }
        ],
        "bytes": 195595,
        "domElements": 597,
        "basePageCDN": "",
        "visualCompleteness": {
          "p85": 600,
          "p90": 600,
          "p95": 600,
          "p99": 600,
          "p100": 600
        },
        "hits": {
          "other": 11
        }
      },
      {
        "loadTime": 674,
        "ttfb": 367,
        "domLoaded": 604,
        "load": 679,
        "fullyLoaded": 674,
        "firstPaint": 542,
        "startRender": 594,
        "speedIndex": null,
        "firstMeaningfulPaint": 589,
        "lastVisualChange": 594,
        "requests": 11,
        "failedRequests": 0
      }
    ];
    expect(aggregate(mean2)).to.eql({ speedIndex: 602.4000000000001, firstMeaningfulPaint: 574.5999999999999,
      "ttfb": 353.6,
      "domLoaded": 593.6,
      "fullyLoaded": 673.8,
      "lastVisualChange": 713.1999999999999  });
  });
});
