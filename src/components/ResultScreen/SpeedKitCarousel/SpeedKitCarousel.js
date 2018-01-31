import React, { Component } from 'react'
import './SpeedKitCarousel.css'

import Carousel from '../../Carousel/Carousel'

import braunLogo from './img/braun.png'
import netflixLogo from './img/netflix.png'
import bookingLogo from './img/booking.png'
import colaLogo from './img/cola.png'
import spiegelLogo from './img/spiegel.png'
import yelpLogo from './img/yelp.png'
import molsoncoorsLogo from './img/molsoncoors.png'
import kickerLogo from './img/kicker.png'
import wellsFargoLogo from './img/wells-fargo.png'
import computerBildLogo from './img/computerbild.png'
import aolLogo from './img/aol.png'
import alibabaLogo from './img/alibaba.png'

class SpeedKitBanner extends Component {
  render() {
    return (
      <div className="carousel">

        <Carousel showFirstPool={true} animationDuration={'180s'}>
          <a href="/result?testId=wulahsbookin" className="db">
            <img src={bookingLogo} className="treadmill-img" alt="Booking logo"/>
            <span className="factorLabel">2.05 x Faster</span>
          </a>
          <a href="/result?testId=fz8Srzbraun" className="db">
            <img src={braunLogo} className="treadmill-img" alt="Braun logo"/>
            <span className="factorLabel">5.16 x Faster</span>
          </a>
          <a href="/result?testId=VmjwUdyelp." className="db">
            <img src={yelpLogo} className="treadmill-img" alt="Yelp logo"/>
            <span className="factorLabel">2.51 x Faster</span>
          </a>
          <a href="/result?testId=eZ0Oswspiegel." className="db">
            <img src={spiegelLogo} className="treadmill-img" alt="Spiegel logo"/>
            <span className="factorLabel">1.95 x Faster</span>
          </a>
          <a href="/result?testId=PLnp8ccoca-cola." className="db">
            <img src={colaLogo} className="treadmill-img" alt="Coca Cola logo"/>
            <span className="factorLabel">2.84 x Faster</span>
          </a>
          <a href="/result?testId=mBhx8Ymolsoncoors." className="db">
            <img src={molsoncoorsLogo} className="treadmill-img" alt="Molson Coors logo"/>
            <span className="factorLabel">1.85 x Faster</span>
          </a>
        </Carousel>

        <Carousel showFirstPool={true} animationDuration={'250s'} animationDelay={'-77.5s'}>
          <a href="/result?testId=SQOP8Bnetflix." className="db">
            <img src={netflixLogo} className="treadmill-img" alt="Netflix logo"/>
            <span className="factorLabel">3.19 x Faster</span>
          </a>
          <a href="/result?testId=j3wo9uwellsfarg" className="db">
            <img src={wellsFargoLogo} className="treadmill-img" alt="Wells Fargo logo"/>
            <span className="factorLabel">2.09 x Faster</span>
          </a>
          <a href="/result?testId=MTl1skao" className="db">
            <img src={aolLogo} className="treadmill-img" alt="Aol logo"/>
            <span className="factorLabel">1.86 x Faster</span>
          </a>
          <a href="/result?testId=XiESylkicker." className="db">
            <img src={kickerLogo} className="treadmill-img" alt="Kicker logo"/>
            <span className="factorLabel">1.93 x Faster</span>
          </a>
          <a href="/result?testId=zUpDMfalibaba." className="db">
            <img src={alibabaLogo} className="treadmill-img" alt="Alibaba logo"/>
            <span className="factorLabel">2.15 x Faster</span>
          </a>
          <a href="/result?testId=cPMTV0computerbild." className="db">
            <img src={computerBildLogo} className="treadmill-img" alt="Computer Bild logo"/>
            <span className="factorLabel">1.60 x Faster</span>
          </a>
        </Carousel>

        <div className="text-center" style={{ fontSize: '12px' }}>
          Performance tests to illustrate Speed Kit's potential. Click to learn more
        </div>
      </div>
    )
  }
}

export default SpeedKitBanner
