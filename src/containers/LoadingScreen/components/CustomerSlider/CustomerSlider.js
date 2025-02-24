import React, { Component } from "react";
import Slider from "react-slick";
import parse from "html-react-parser";
import { Customers } from "./Customers";

import "./CustomSlider.css";

export default class CustomerSlider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      randomCustomers: [],
    };
  }

  componentDidMount() {
    this.state.randomCustomers = this.randomizeCustomers();
    this.interval = setInterval(() => this.slider.slickNext(), 5000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  randomizeCustomers() {
    const randomCustomers = this.shuffle(Customers).slice(0, 6);

    return randomCustomers;
  }

  shuffle(customers) {
      let array = Array.from(customers)
      for (let i = array.length - 1; i >= 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
      return array
  }

  render() {
    const settings = {
      dots: true,
      arrows: false,
      autoplay: false,
      speed: 1500,
      slidesToShow: 1,
      slidesToScroll: 1,
    };
    return (
      <Slider ref={(slider) => (this.slider = slider)} {...settings}>
        {this.state.randomCustomers.map(function (customer) {
          return (
            <div key={customer.name}>
              <div className="flex text-center justify-center">
                <div className={`item-img customer ${customer.logo}`} />
              </div>
              <p className="item-header">
                {customer.name} - {customer.title}
              </p>
              <p className="item-text">{parse(customer.copy)}</p>
            </div>
          );
        })}
      </Slider>
    );
  }
}
