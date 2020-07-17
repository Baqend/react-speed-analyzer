import React, { Component } from 'react'
import Slider from 'react-slick'
import Parser from 'html-react-parser'
import { Customers } from './Customers'

import './CustomSlider.css'

export default class CustomerSlider extends Component {
  componentDidMount(): void {
    this.interval = setInterval(() => this.slider.slickNext(), 5000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    const settings = {
      dots: true,
      arrows: false,
      autoplay: false,
      speed: 1500,
      slidesToShow: 1,
      slidesToScroll: 1
    }
    return (
      <Slider ref={slider => (this.slider = slider)} {...settings}>
        {Customers.map(function(customer) {
          return (
            <div key={customer.name}>
              <div className="flex text-center justify-center">
                <div className={`item-img ${customer.className}`} />
              </div>
              <p className="item-header">{customer.name} - {customer.title}</p>
              <p className="item-text">{Parser(customer.copy)}</p>
            </div>
          )
        })}
      </Slider>
    )
  }
}
