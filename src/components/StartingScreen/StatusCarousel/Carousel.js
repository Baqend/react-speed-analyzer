import React, { Component } from 'react'
import PropTypes from 'prop-types'
import hash from 'object-hash'

import { TransitionGroup, CSSTransition } from 'react-transition-group'

import './Carousel.css'

const flatten = arr => arr.reduce(
  (acc, val) => acc.concat(
    Array.isArray(val) ? flatten(val) : val
  ), []
)

export class Carousel extends Component {
  constructor(props) {
    super(props)
    this.interval = null
    this.pageKeys = null

    this.delayFactor = 0
    this.duration = 550
    this.durationOffset = 150

    this.state = {
      show: true,
      initial: true,
      page: 0,
      pages: []
    }
  }

  getNextPage = (current, pages) => {
    if (current >= pages.length - 1) {
      return 0
    }
    return current + 1
  }

  createInterval = () => {
    this.interval = setInterval(() => {
      const page = this.getNextPage(this.state.page, this.state.pages)
      this.setState({ page })
    }, 10000)
  }

  updatePages = (props) => {
    const pages = flatten((Array.isArray(props.children) && props.children.filter((child) => child)) || [ props.children ])
    const pageKeys = hash(pages.map(child => child.key))
    if (pageKeys !== this.pageKeys) {
      clearInterval(this.interval)
      this.pageKeys = pageKeys
      this.setState({
        page: this.getNextPage(this.state.page, pages),
        pages: [],
        initial: true
      }, () => setTimeout(() => {
        this.setState({
          pages: [ ...pages ]
        }, () => {
          this.setState({ initial: false })
          if (this.state.pages.length > 1) {
            this.createInterval()
          }
        })
      }, this.duration))
    } else {
      this.setState({ pages, initial: true }, () => {
        this.setState({ initial: false })
      })
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
      <TransitionGroup>
        {this.state.pages.map((item, j) => item.props && item.props.children.map((child, i) => {
          if (this.state.page === j || this.state.pages.length === 1) {
            return (
              <CSSTransition
                key={i}
                timeout={{ enter: this.duration * 2, exit: this.duration }}
                classNames="text"
                onEnter={(node) => {
                  const delayFactor = this.state.initial ? 0 : 1
                  node.style.animationDuration = `0.1ms`
                  node.style.animationDelay = `${delayFactor * this.duration}ms`
                  node.firstChild.style.animationDuration = `${this.duration}ms`
                  node.firstChild.style.animationDelay = `${(delayFactor * this.duration) + 100 + i * this.durationOffset}ms`
                  setTimeout(() => {
                    node.style.overflow = 'visible'
                  }, delayFactor * this.duration)
                }}
                onExit={(node) => {
                  node.style.animationDuration = `${this.duration}ms`
                  node.style.animationDelay = '0ms'
                }}
              >
                <div>{child}</div>
              </CSSTransition>
            )
          }
        }))}
      </TransitionGroup>
    )
  }

}

export class CarouselPage extends Component {
  render() {
    return this.props.children
  }
}
