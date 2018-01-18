import React, { Component } from 'react'
import './ResultWorthiness.css'
import { calculateFactor, calculateServedRequests } from '../../../helper/resultHelper'

import doubleClickLogo from '../../../img/doubleClick.png'
import amazonLogo from '../../../img/amazon.png'

class ResultWorthinessComponent extends Component {
  render() {
    const competitorData = this.props.competitorTest.firstView
    const speedKitData = this.props.speedKitTest.firstView

    const factor = calculateFactor(competitorData[this.props.mainMetric], speedKitData[this.props.mainMetric])
    const servedRate = calculateServedRequests(speedKitData)

    const publisherRevenue =
      Math.round(((competitorData[this.props.mainMetric] - speedKitData[this.props.mainMetric]) / (19000 - 5000)) * 100)

    const eCommerceRevenue =
      Math.round((competitorData[this.props.mainMetric]  - speedKitData[this.props.mainMetric]) * 0.01)

    return (
      <div>
        <div className="flex">
          <div className="w-100 text-center">
            <h3>Speed Kit served {servedRate}% of your requests. How much is this {factor}x performance boost worth?</h3>
            <p>
              Here is what Google and Amazon have found for publishers and e-commerce.
            </p>
          </div>
        </div>
        <div className="flex items-center text-center">
          <div className="w-50 pr6 pl6" style={{ padding: '64px 32px', margin: '16px', background: '#f6f6f6' }}>
            <div>Publishers and Ad-driven Businesses</div>
            <div className="pa1"><span className="lightGreen">{publisherRevenue}%</span> Revenue</div>
            <div>(PLT Original - PLT Speed Kit) / (19000 - 5000)</div>
            <div className="pa1">
              <a href="https://storage.googleapis.com/doubleclick-prod/documents/The_Need_for_Mobile_Speed_-_FINAL.pdf#page=3"
                target="_blank">DoubleClick study (p. 3)
              </a>
              "The Need for Mobile Speed" based on 4,500 real websites
            </div>
            <div className="img-container pa1">
              <img src={doubleClickLogo} alt="DoubleClick logo" style={{ maxWidth: '150px'}}/>
            </div>
          </div>
          <div className="w-50 pr6 pl6" style={{ padding: '64px 32px', margin: '16px', background: '#f6f6f6' }}>
            <div>E-Commerce</div>
            <div className="pa1"><span className="lightGreen">{eCommerceRevenue}%</span> Revenue</div>
            <div>(PLT Original - PLT Speed Kit) * (1 / 100)</div>
            <div className="pa1">
              <a href="http://sites.google.com/site/glinden/Home/StanfordDataMining.2006-11-28.ppt?attredirects=0"
                target="_blank">Amazon study (p. 10)
              </a>
              "Make Data Useful" using A/B tests on the Amazon shop
            </div>
            <div className="img-container pa1">
              <img src={amazonLogo} alt="Amazon logo" style={{ maxWidth: '120px'}}/>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default ResultWorthinessComponent
