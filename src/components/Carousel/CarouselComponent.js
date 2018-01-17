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

class CarouselComponent extends Component {
  render() {
    return (
      this.props.showFirstPool ?
        <Slider {...settings} className="pa3">
          <div className="slier-item">
            <img src={braunLogo} className="slider-img" alt="Braun logo"/>
            <span className="factorLabel">5.16 x Faster</span>
          </div>
          <div className="slier-item">
            <img src={netflixLogo} className="slider-img" alt="Netflix logo"/>
            <span className="factorLabel">3.19 x Faster</span>
          </div>
          <div className="slier-item">
            <img src={bookingLogo} className="slider-img" alt="Booking logo"/>
            <span className="factorLabel">2.05 x Faster</span>
          </div>
          <div className="slier-item">
            <img src={colaLogo} className="slider-img" alt="Cola logo"/>
            <span className="factorLabel">2.84 x Faster</span>
          </div>
          <div className="slier-item">
            <img src={spiegelLogo} className="slider-img" alt="Spiegel logo"/>
            <span className="factorLabel">1.95 x Faster</span>
          </div>
          <div className="slier-item">
            <img src={yelpLogo} className="slider-img" alt="Yelp logo"/>
            <span className="factorLabel">2.51 x Faster</span>
          </div>
        </Slider>
        : <Slider {...settings} className="pa3"></Slider>
    )
  }
}

export default CarouselComponent
