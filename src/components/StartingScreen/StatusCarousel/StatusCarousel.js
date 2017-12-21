import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { TransitionGroup, CSSTransition } from 'react-transition-group'

import './StatusCarousel.css'

class StatusCarousel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      show: false,
      items: []
    }
  }

  componentWillMount() {
    this.setState({ items: this.props.items })
  }

  componentWillReceiveProps(nextProps) {
    // console.log(this.props, nextProps)
    this.setState({ items: nextProps.items })
  }
  // componentDidMount() {
  //   this.setState({ items: this.props.items })
  //   setInterval(() => {
  //     if (!this.state.items.length) {
  //       this.setState({ items: this.props.items })
  //     } else {
  //       this.setState({ items: [] })
  //     }
  //   }, 5000)
  // }

  render() {
    return (
      <div>
        <div>{this.state.show ? 'true' : 'false'}</div>
        <TransitionGroup>
          {this.state.items.map((child, i) => (
            <CSSTransition key={i} timeout={600} classNames="text">
              {child}
            </CSSTransition>
          ))}
        </TransitionGroup>
      </div>
    )
  }
}

// ConfigForm.propTypes = {
//   config: PropTypes.object.isRequired,
//   onSubmit: PropTypes.func.isRequired,
//   actions: PropTypes.object.isRequired,
// }

export default StatusCarousel
