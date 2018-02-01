import React, { Component } from 'react'
import { connect } from 'react-redux'

import './SpeedKitCarousel.css'

import Carousel from '../../Carousel/Carousel'

class SpeedKitCarousel extends Component {
  render() {
    return (
      <div className="carousel">
        <Carousel showFirstPool={true} animationDuration={'180s'}>
          {this.props.examples.slice(0,6).map(example => (
            <a key={example.id} href={`/result?testId=${example.id}`} className="db">
              <img src={example.logo} className="treadmill-img" alt={`${example.name} Logo`}/>
              <span className="factorLabel">{example.speedup}</span>
            </a>
          ))}
        </Carousel>

        <Carousel showFirstPool={true} animationDuration={'250s'} animationDelay={'-77.5s'}>
          {this.props.examples.slice(6,12).map(example => (
            <a key={example.id} href={`/result?testId=${example.id}`} className="db">
              <img src={example.logo} className="treadmill-img" alt={`${example.name} Logo`}/>
              <span className="factorLabel">{example.speedup}</span>
            </a>
          ))}
        </Carousel>

        <div className="text-center" style={{ fontSize: '12px' }}>
          Performance tests to illustrate Speed Kit's potential. Click to learn more
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
