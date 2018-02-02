import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { shuffle } from '../../../helper/utils'

import { Carousel, CarouselPage } from './Carousel'

export const renderDefaultPage = () => (
  <CarouselPage key="default">
    <h2 className="text__headline">We will run a series of tests against your site</h2>
    <div className="text__details">See how fast your current backend stack delivers your site to users. We will compare the results to a version of your site using Baqend Speed Kit</div>
  </CarouselPage>
)

export const renderIsInQueuePage = (statusText) => (
  <CarouselPage key="queue">
    <h2 className="text__headline">
      {statusText.replace('...', '')}
      <span className="loader">
        <span className="loader__dot">.</span>
        <span className="loader__dot">.</span>
        <span className="loader__dot">.</span>
      </span>
    </h2>
    <div className="text__details">See how fast your current backend stack delivers your site to users. We will compare the results to a version of your site using Baqend Speed Kit</div>
  </CarouselPage>
)

export const renderHasStartedPage = () => (
  <CarouselPage key="started">
    <h2 className="text__headline">Your Test has been started</h2>
    <div className="text__details">Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui.</div>
  </CarouselPage>
)

export const renderFactsPages = shuffle([
  <CarouselPage key="fact_1">
    <h2 className="text__headline">1&1 Internet</h2>
    <div className="text__details"><strong>42%</strong> of men and <strong>35%</strong> of women have decided not to use a company's services again as a result of experiencing a slow website.</div>
  </CarouselPage>,
  <CarouselPage key="fact_2">
    <h2 className="text__headline">1&1 Internet</h2>
    <div className="text__details"><strong>71%</strong> of people surveyed feel regularly inconvenienced by slow websites.</div>
  </CarouselPage>,
  <CarouselPage key="fact_3">
    <h2 className="text__headline">Microsoft</h2>
    <div className="text__details"><strong>250 ms</strong>, either slower or faster, is close to the magic number for competitive advantage on the Web.</div>
  </CarouselPage>,
  <CarouselPage key="fact_4">
    <h2 className="text__headline">Equation Research</h2>
    <div className="text__details">For mobile, <strong>74%</strong> of users say that 5 seconds is the maximum amount of time they’ll wait before abandoning a page.</div>
  </CarouselPage>,
  <CarouselPage key="fact_5">
    <h2 className="text__headline">Walmart</h2>
    <div className="text__details">Every full second of load time improvement equals a <strong>2%</strong> conversion rate increase for Walmart.com.</div>
  </CarouselPage>,
  <CarouselPage key="fact_6">
    <h2 className="text__headline">Staples</h2>
    <div className="text__details">By improving page load time by 1 second, Staples.com increased conversions by <strong>10%</strong>.</div>
  </CarouselPage>,
  <CarouselPage key="fact_7">
    <h2 className="text__headline">Autoanything</h2>
    <div className="text__details">By cutting the page load time in half, Autoanything.com increased its conversion rate by <strong>9%</strong>.</div>
  </CarouselPage>,
  <CarouselPage key="fact_8">
    <h2 className="text__headline">Firefox</h2>
    <div className="text__details">Firefox downloads increased by <strong>15.4%</strong> when the page loaded <strong>2.2</strong> seconds faster.</div>
  </CarouselPage>,
  <CarouselPage key="fact_9">
    <h2 className="text__headline">GQ</h2>
    <div className="text__details">GQ saw a permanent traffic increase of <strong>83%</strong> when they improved page load time by <strong>5</strong> seconds.</div>
  </CarouselPage>,
  <CarouselPage key="fact_10">
    <h2 className="text__headline">Washington Post</h2>
    <div className="text__details">Turning the Washington Post into a progressive web app (PWA), increased the monthly user interactions by <strong>4</strong> million.</div>
  </CarouselPage>,
  <CarouselPage key="fact_11">
    <h2 className="text__headline">Financial Times</h2>
    <div className="text__details">At the Financial Times, page slowdowns correlate to up to <strong>11%</strong> decrease in engagement.</div>
  </CarouselPage>,
  <CarouselPage key="fact_12">
    <h2 className="text__headline">BBC</h2>
    <div className="text__details">BBC loses <strong>10%</strong> of users for every additional second it takes for their site to load.</div>
  </CarouselPage>,
  <CarouselPage key="fact_13">
    <h2 className="text__headline">AliExpress</h2>
    <div className="text__details">AliExpress reduced load time by <strong>36%</strong> and saw a <strong>10.5%</strong> increase in orders and a <strong>27%</strong> increase in conversions.</div>
  </CarouselPage>,
  <CarouselPage key="fact_14">
    <h2 className="text__headline">DoubleClick</h2>
    <div className="text__details"><strong>53%</strong> of visits to mobile sites are abandoned after <strong>3</strong> seconds.</div>
  </CarouselPage>,
  <CarouselPage key="fact_15">
    <h2 className="text__headline">Aberdeen Group</h2>
    <div className="text__details">A <strong>1-second</strong> delay results in <strong>11%</strong> fewer page views, <strong>16%</strong> less customer satisfaction, and a <strong>7%</strong> loss in conversions.</div>
  </CarouselPage>,
  <CarouselPage key="fact_16">
    <h2 className="text__headline">Google</h2>
    <div className="text__details">Pages that need more than <strong>2</strong> seconds for download are crawled less often.</div>
  </CarouselPage>,
  <CarouselPage key="fact_17">
    <h2 className="text__headline">DoubleClick</h2>
    <div className="text__details">Sites that load in <strong>5</strong> seconds vs. <strong>19</strong> seconds have a <strong>25%</strong> higher ad viewability, <strong>70%</strong> longer sessions, and <strong>35%</strong> lower bounce rates.</div>
  </CarouselPage>,
  <CarouselPage key="fact_18">
    <h2 className="text__headline">DoubleClick</h2>
    <div className="text__details">Publishers whose mobile sites load in <strong>5</strong> seconds earn <strong>2x</strong> more mobile ad revenue than those whose sites load in <strong>19</strong> seconds.</div>
  </CarouselPage>,
  <CarouselPage key="fact_19">
    <h2 className="text__headline">Facebook</h2>
    <div className="text__details">According to Facebook, <strong>40%</strong> of users abandon a page if it takes more than <strong>3</strong> seconds to load.</div>
  </CarouselPage>,
  <CarouselPage key="fact_20">
    <h2 className="text__headline">Zitmaxx Wonen</h2>
    <div className="text__details">Furniture retailer Zitmaxx Wonen reduced their load time to <strong>3</strong> seconds and saw a conversion jump of <strong>50.2%</strong>.</div>
  </CarouselPage>,
  <CarouselPage key="fact_21">
    <h2 className="text__headline">Financial Times</h2>
    <div className="text__details">After a performance relaunch, users of the Financial Times were <strong>30%</strong> more engaged.</div>
  </CarouselPage>,
  <CarouselPage key="fact_22">
    <h2 className="text__headline">Ancestory</h2>
    <div className="text__details">Ancestory.com saw a <strong>7%</strong> increase in conversions after improving load time by <strong>64%</strong>.</div>
  </CarouselPage>,
  <CarouselPage key="fact_23">
    <h2 className="text__headline">Trainline</h2>
    <div className="text__details">The Trainline reduced latency by <strong>0.3</strong> seconds and customers spent an extra <strong>$11.5</strong> million a year.</div>
  </CarouselPage>,
  <CarouselPage key="fact_24">
    <h2 className="text__headline">Instagram</h2>
    <div className="text__details">Instagram increased impressions by <strong>0.7%</strong> when they decreased the response size of the JSON for comments.</div>
  </CarouselPage>,
  <CarouselPage key="fact_25">
    <h2 className="text__headline">Amazon</h2>
    <div className="text__details">With every <strong>100ms</strong> of additional page load time, revenue decreases by <strong>1%</strong>.</div>
  </CarouselPage>,
  <CarouselPage key="fact_26">
    <h2 className="text__headline">Yahoo</h2>
    <div className="text__details"><strong>400ms</strong> of additional page load time results in <strong>9%</strong> less visitors.</div>
  </CarouselPage>,
  <CarouselPage key="fact_27">
    <h2 className="text__headline">Google</h2>
    <div className="text__details">When increasing loading times of search results by <strong>500 ms</strong>, traffic decreases by <strong>20%</strong>.</div>
  </CarouselPage>,
  <CarouselPage key="fact_28">
    <h2 className="text__headline">Obama for America</h2>
    <div className="text__details">The "Obama for America" site improved performance by <strong>60%</strong> and saw <strong>14%</strong> more donations in response.</div>
  </CarouselPage>,
  <CarouselPage key="fact_29">
    <h2 className="text__headline">AOL</h2>
    <div className="text__details">Visitors in the top <strong>10%</strong> of site speed view <strong>50%</strong> more pages than visitors in the bottom <strong>10%</strong>.</div>
  </CarouselPage>,
  <CarouselPage key="fact_30">
    <h2 className="text__headline">Bing</h2>
    <div className="text__details">A <strong>1-second</strong> delay in Bing results in a <strong>2.8%</strong> drop in revenue. </div>
  </CarouselPage>,
  <CarouselPage key="fact_31">
    <h2 className="text__headline">Shopzilla</h2>
    <div className="text__details">A reduction in loading time from <strong>7</strong> to <strong>2</strong> seconds increases sales by <strong>10%</strong> and the number of visitors by <strong>25%</strong>.</div>
  </CarouselPage>,
  <CarouselPage key="fact_32">
    <h2 className="text__headline">Akamai</h2>
    <div className="text__details"><strong>30%</strong>-<strong>50%</strong> of all requests that take longer than <strong>4</strong> seconds are canceled.</div>
  </CarouselPage>,
  <CarouselPage key="fact_33">
    <h2 className="text__headline">Otto</h2>
    <div className="text__details"><strong>37%</strong> of all smartphone users complain about slow loading times.</div>
  </CarouselPage>,
  <CarouselPage key="fact_32">
    <h2 className="text__headline">Google</h2>
    <div className="text__details"><strong>21%</strong> of all users do not buy online due to long loading times.</div>
  </CarouselPage>
])
