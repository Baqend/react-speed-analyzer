import React, { Component } from 'react'
import PropTypes from 'prop-types'
import hash from 'object-hash'

import { TransitionGroup, CSSTransition } from 'react-transition-group'

import './StatusCarousel.css'

const flatten = arr => arr.reduce(
  (acc, val) => acc.concat(
    Array.isArray(val) ? flatten(val) : val
  ), []
)

export class StatusCarousel extends Component {
  constructor(props) {
    super(props)
    this.interval = null
    this.pageKeys = null

    this.delayFactor = 0
    this.duration = 550
    this.durationOffset = 150

    this.state = {
      initial: true,
      page: 0,
      pages: []
    }
  }

  updatePages = (props) => {
    const pages = flatten((Array.isArray(props.children) && props.children.filter((child) => child)) || [ props.children ])
    const pageKeys = hash(pages.map(child => child.key))
    if (pageKeys !== this.pageKeys) {
      this.pageKeys = pageKeys

      this.setState({
        pages: [],
        initial: true
      }, () => setTimeout(() => {
        clearInterval(this.interval)
        this.setState({ page: 0, pages: [ ...pages ] }, () => {
          this.setState({ initial: false })
          if (this.state.pages.length > 1) {
            this.interval = setInterval(() => {
              if (this.state.page === this.state.pages.length - 1) {
                this.setState({ page: 0,  })
              } else {
                this.setState({ page: this.state.page + 1 })
              }
            }, 6000)
          }
        })
      }, this.duration))
    }
  }

  componentWillMount() {
    this.updatePages(this.props)
  }

  componentWillReceiveProps(nextProps) {
    this.updatePages(nextProps)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    return (
      <div>
        <TransitionGroup>
          {this.state.pages.map((item, j) => item.props && item.props.children.map((child, i) => {
            if (this.state.page === j) {
              return (
                <CSSTransition
                  key={i}
                  timeout={{ enter: this.duration * 2, exit: this.duration }}
                  classNames="text"
                  onEnter={(node) => {
                    const delayFactor = this.state.initial ? 0 : 1
                    node.style.animationDuration = `0ms, ${this.duration}ms`
                    node.style.animationDelay = `${delayFactor * this.duration}ms, ${(delayFactor * this.duration) + 50 + i * this.durationOffset}ms`
                  }}
                  onExit={(node) => {
                    node.style.animationDuration = `${this.duration}ms`
                    node.style.animationDelay = '0ms'
                  }}
                >
                  {child}
                </CSSTransition>
              )
            }
          }))}
        </TransitionGroup>
      </div>
    )
  }

}

export class StatusPage extends Component {
  render() {
    return this.props.children
  }
}
