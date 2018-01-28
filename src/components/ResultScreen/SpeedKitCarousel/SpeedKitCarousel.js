import React, { Component } from 'react'
import './SpeedKitCarousel.css'

import Carousel from '../../Carousel/Carousel'

import braunLogo from './img/braun.png'
import netflixLogo from './img/netflix.png'
import bookingLogo from './img/booking.png'
import colaLogo from './img/cola.png'
import spiegelLogo from './img/spiegel.png'
import yelpLogo from './img/yelp.png'

class SpeedKitBanner extends Component {
  render() {
    return (
      <div className="carousel">

        <Carousel showFirstPool={true} animationDuration={'180s'}>
          <div>
            <img src={braunLogo} className="treadmill-img" alt="Braun logo"/>
            <span className="factorLabel">5.16 x Faster</span>
          </div>
          <div>
            <img src={netflixLogo} className="treadmill-img" alt="Netflix logo"/>
            <span className="factorLabel">3.19 x Faster</span>
          </div>
          <div>
            <img src={bookingLogo} className="treadmill-img" alt="Booking logo"/>
            <span className="factorLabel">2.05 x Faster</span>
          </div>
          <div>
            <img src={colaLogo} className="treadmill-img" alt="Cola logo"/>
            <span className="factorLabel">2.84 x Faster</span>
          </div>
          <div>
            <img src={spiegelLogo} className="treadmill-img" alt="Spiegel logo"/>
            <span className="factorLabel">1.95 x Faster</span>
          </div>
          <div>
            <img src={yelpLogo} className="treadmill-img" alt="Yelp logo"/>
            <span className="factorLabel">2.51 x Faster</span>
          </div>
        </Carousel>

        <Carousel showFirstPool={true} animationDuration={'250s'} animationDelay={'-77.5s'}>
          <div>
            <img src={braunLogo} className="treadmill-img" alt="Braun logo"/>
            <span className="factorLabel">5.16 x Faster</span>
          </div>
          <div>
            <img src={netflixLogo} className="treadmill-img" alt="Netflix logo"/>
            <span className="factorLabel">3.19 x Faster</span>
          </div>
          <div>
            <img src={bookingLogo} className="treadmill-img" alt="Booking logo"/>
            <span className="factorLabel">2.05 x Faster</span>
          </div>
          <div>
            <img src={colaLogo} className="treadmill-img" alt="Cola logo"/>
            <span className="factorLabel">2.84 x Faster</span>
          </div>
          <div>
            <img src={spiegelLogo} className="treadmill-img" alt="Spiegel logo"/>
            <span className="factorLabel">1.95 x Faster</span>
          </div>
          <div>
            <img src={yelpLogo} className="treadmill-img" alt="Yelp logo"/>
            <span className="factorLabel">2.51 x Faster</span>
          </div>
        </Carousel>

        <div className="text-center" style={{ fontSize: '12px' }}>
          Performance tests to illustrate Speed Kit's potential. Click to learn more
        </div>
      </div>
    )
  }
}

export default SpeedKitBanner
