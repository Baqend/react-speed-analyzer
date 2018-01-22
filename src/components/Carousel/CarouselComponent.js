import React, { Component } from 'react'

import './Carousel.css'
import Slider from 'react-slick'

import braunLogo from '../../img/braun.png'
import netflixLogo from '../../img/netflix.png'
import bookingLogo from '../../img/booking.png'
import colaLogo from '../../img/cola.png'
import spiegelLogo from '../../img/spiegel.png'
import yelpLogo from '../../img/yelp.png'

const settings = {
  centerMode: true,
  //autoplay: true,
  arrows: false,
  slidesToShow: 4,
  responsive: [{
    breakpoint: 1024,
    settings: {
      slidesToShow: 3,
      slidesToScroll: 3,
      infinite: true,
    }
  }, {
    breakpoint: 600,
    settings: {
      slidesToShow: 2,
      slidesToScroll: 2,
      initialSlide: 2
    }
  }, {
    breakpoint: 480,
    settings: {
      slidesToShow: 1,
      slidesToScroll: 1
    }
  }]
}

// return (
//   this.props.showFirstPool ?
//   <Slider {...settings} className="pa3">
//   <div className="treadmill-item">
//   <img src={braunLogo} className="treadmill-img" alt="Braun logo"/>
//   <span className="factorLabel">5.16 x Faster</span>
//   </div>
//   <div className="treadmill-item">
//   <img src={netflixLogo} className="treadmill-img" alt="Netflix logo"/>
//   <span className="factorLabel">3.19 x Faster</span>
//   </div>
//   <div className="treadmill-item">
//   <img src={bookingLogo} className="treadmill-img" alt="Booking logo"/>
//   <span className="factorLabel">2.05 x Faster</span>
//   </div>
//   <div className="treadmill-item">
//   <img src={colaLogo} className="treadmill-img" alt="Cola logo"/>
//   <span className="factorLabel">2.84 x Faster</span>
//   </div>
//   <div className="treadmill-item">
//   <img src={spiegelLogo} className="treadmill-img" alt="Spiegel logo"/>
//   <span className="factorLabel">1.95 x Faster</span>
//   </div>
//   <div className="treadmill-item">
//   <img src={yelpLogo} className="treadmill-img" alt="Yelp logo"/>
//   <span className="factorLabel">2.51 x Faster</span>
//   </div>
//   </Slider>
//   : <Slider {...settings} className="pa3"></Slider>
// )
class CarouselComponent extends Component {
  render() {
    return (
      <div className="treadmill">
        <div className="first" style={{ animationDuration: this.props.animationDuration, animationDelay: this.props.animationDelay }}>
          <div className="treadmill-item">
            <img src={braunLogo} className="treadmill-img" alt="Braun logo"/>
            <span className="factorLabel">5.16 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={netflixLogo} className="treadmill-img" alt="Netflix logo"/>
            <span className="factorLabel">3.19 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={bookingLogo} className="treadmill-img" alt="Booking logo"/>
            <span className="factorLabel">2.05 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={colaLogo} className="treadmill-img" alt="Cola logo"/>
            <span className="factorLabel">2.84 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={spiegelLogo} className="treadmill-img" alt="Spiegel logo"/>
            <span className="factorLabel">1.95 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={yelpLogo} className="treadmill-img" alt="Yelp logo"/>
            <span className="factorLabel">2.51 x Faster</span>
          </div>
        </div>
        <div className="second" style={{ animationDuration: this.props.animationDuration, animationDelay: this.props.animationDelay  }}>
          <div className="treadmill-item">
            <img src={braunLogo} className="treadmill-img" alt="Braun logo"/>
            <span className="factorLabel">5.16 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={netflixLogo} className="treadmill-img" alt="Netflix logo"/>
            <span className="factorLabel">3.19 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={bookingLogo} className="treadmill-img" alt="Booking logo"/>
            <span className="factorLabel">2.05 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={colaLogo} className="treadmill-img" alt="Cola logo"/>
            <span className="factorLabel">2.84 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={spiegelLogo} className="treadmill-img" alt="Spiegel logo"/>
            <span className="factorLabel">1.95 x Faster</span>
          </div>
          <div className="treadmill-item">
            <img src={yelpLogo} className="treadmill-img" alt="Yelp logo"/>
            <span className="factorLabel">2.51 x Faster</span>
          </div>
        </div>
      </div>
    )
  }
}

export default CarouselComponent
