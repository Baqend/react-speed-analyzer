import React, { Component } from 'react'

import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import './SpeedKitCarousel.css'

import Carousel from 'components/Carousel/Carousel'

class SpeedKitCarousel extends Component {
  render() {
    return (
      <div className="carousel">
        <Carousel showFirstPool={true} animationDuration={'180s'}>
          {this.props.examples.slice(0,6).map(example => (
            <Link key={example.id} to={`/test/${example.id}/result`} className="db">
              <img src={example.logo} className="treadmill-img" alt={`${example.name} Logo`}/>
              <span className="factorLabel">{example.speedup}</span>
            </Link>
          ))}
        </Carousel>

        <Carousel showFirstPool={true} animationDuration={'250s'} animationDelay={'-77.5s'}>
          {this.props.examples.slice(6,12).map(example => (
            <Link key={example.id} to={`/test/${example.id}/result`} className="db">
              <img src={example.logo} className="treadmill-img" alt={`${example.name} Logo`}/>
              <span className="factorLabel">{example.speedup}</span>
            </Link>
          ))}
        </Carousel>

        <div className="text-center" style={{ fontSize: '13px' }}>
          Example performance tests of popular websites. Click to learn more.
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
