import React, { Component } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import hash from 'object-hash'

import { flatten } from 'helper/flatten'

import './Carousel.css'

export class Carousel extends Component {
  interval = null
  pageKeys = null
  duration = 550
  durationOffset = 150

  constructor(props) {
    super(props)

    this.state = {
      show: true,
      initial: true,
      page: 0,
      pages: []
    }
  }

  getNextPage(current, pages) {
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

  static getDerivedStateFromProps(nextProps, prevState) {
    return null
  }

  updatePages() {
    const pages = flatten((Array.isArray(this.props.children) && this.props.children.filter((child) => child)) || [ this.props.children ])
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
    }
  }

  componentDidUpdate() {
    this.updatePages()
  }

  componentDidMount() {
    this.updatePages()
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    /* eslint-disable */
    // const { message } = this.props
    return (
      <TransitionGroup>
        {this.state.pages.map((item, j) => {
          if (item.props) {
            let elements = []
            if (item.props.showMessage && this.props.message) {
              elements = [ ...item.props.children, this.props.message]
            } else {
              elements = item.props.children
            }
            return elements.map((child, i) => {
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
            })
          }
        })}
      </TransitionGroup>
    )
  }

}

export class CarouselPage extends Component {
  render() {
    return this.props.children
  }
}
