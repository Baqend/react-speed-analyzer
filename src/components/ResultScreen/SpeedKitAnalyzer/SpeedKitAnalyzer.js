import React, { Component } from 'react'

import './SpeedKitAnalyzer.css'

class SpeedKitBanner extends Component {
  render() {
    return (
      <div className="ph7 pv6" style={{fontWeight: 400}}>
        <div className="text-center">
          <h1>About the Page Speed Analyzer</h1>
        </div>
        <div>
          <p>
            The page speed analyzer gives you an impression of how Baqend Speed Kit influences the performance of your website. To this end, the analyzer runs a series of tests against your website and reports how your current backend stack delivers your website compared to a version using Speed Kit. {/*The result on the right simply shows measurements for your site with an embedded <a href="https://developer.mozilla.org/en/docs/Web/API/Service_Worker_API" target="_blank" rel="noopener noreferrer">Service Worker</a> containing Speed Kit's caching logic.*/}
          </p>
          {/*<p>
            For comparison, the analyzer collects several metrics by using Google's <a href="https://developers.google.com/speed/docs/insights/v1/getting_started" target="_blank">PageSpeed Insights API</a> and private instances of <a href="https://sites.google.com/a/webpagetest.org/docs/private-instances" target="_blank">WebPagetest</a>. Additionally, the tool collects a <strong>performance video</strong> of both versions to give a visual impression. You can customize the analyzer to your desired test situation:
          </p>
          <ul>
            <li>
              <strong>Region:</strong> you can switch the location of the client
            </li>
            <li>
              <strong>Mobile:</strong> choose whether to measure the mobile or the desktop version
            </li>
            <li>
              <strong>Domains:</strong> provide a comma-separated list of domains to tell Speed Kit which requests it should handle. By default, Speed Kit handles up to three subdomains of the input domain. If you want to suppress this behavior, the domain must be formulated more specifically. For example, by entering <strong>subdomain.domain.com</strong>, only requests from this domain level or a higher level are served.
            </li>
          </ul>

          <p>
            Speed Kit achieves its performance through <strong>browser and CDN caching</strong> with new algorithms for cache coherence. Watch our <a href="https://www.youtube.com/watch?v=lPGSFpiKBpg" target="_blank">podcast</a> to get more details on how Speed Kit works.
          </p>
          */}
        </div>
      </div>
    )
  }
}

export default SpeedKitBanner
