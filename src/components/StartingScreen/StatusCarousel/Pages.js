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
    <div className="text__details">
      Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.
    </div>
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
    <h2 className="text__headline">Fun Fact #1</h2>
    <div className="text__details">Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui.</div>
    <div className="text_details">Donec sed odio dui!</div>
  </CarouselPage>,
  <CarouselPage key="fact_2">
    <h2 className="text__headline">Fun Fact #2</h2>
    <div className="text__details">Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Cras justo odio, dapibus ac facilisis in, egestas eget quam.</div>
  </CarouselPage>,
  <CarouselPage key="fact_3">
    <h2 className="text__headline">Fun Fact #3</h2>
    <div className="text__details">Nulla vitae elit libero, a pharetra augue. Curabitur blandit tempus porttitor.</div>
  </CarouselPage>
])
