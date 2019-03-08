import React, { Component } from 'react'
import Slider from "react-slick"
import Parser from 'html-react-parser'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import './SpeedKitCarousel.css'

class SpeedKitCarousel extends Component {
  render() {
    const settings = {
      centerMode: true,
      speed: 250,
      arrows: true,
      autoplay: false,
      centerPadding: "60px",
      variableWidth: true,
      responsive: [
        {
          breakpoint: 769,
          settings: {
            variableWidth: false,
            dots: true
          }
        },
        {
          breakpoint: 480,
          settings: {
            centerMode: false,
            variableWidth: false,
            dots: true
          }
        }
      ]
    }
    return (
      <div className="testimonials box">
        <div className="container">
          <Slider className="slick-testimonials" {...settings}>
            {this.props.examples.map(example => (
              <div className="cite" key={example.id} >
                <div className="logo">
                  <Link key={example.id} to={`/test/${example.id}/result`}>
                    <img src={example.logo} alt={`${example.name} Logo`}/>
                  </Link>
                  <div>
                    <div>{example.author}</div>
                    <div className="position">{example.position}</div>
                  </div>
                </div>
                <blockquote>
                  {Parser(example.blockquote)}
                </blockquote>
              </div>
            ))}
          </Slider>
          <div className="text-center faded" style={{ fontSize: '13px', marginTop: '25px' }}>
            Example performance tests of popular websites. Click logo to learn more.
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    examples: state.examples,
  }
}
export default connect(mapStateToProps, null)(SpeedKitCarousel)
