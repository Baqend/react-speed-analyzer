import React, { Component } from 'react'

import './Footer.css'


class Footer extends Component {
  render() {
    return (
      <footer>
        © 2017 Baqend -
        <a href="https://dashboard.baqend.com/privacy?_ga=2.257821122.814441134.1502188455-97915681.1502188455">Privacy
            Policy</a> -
        <a href="https://dashboard.baqend.com/terms">Terms of Service</a> -
        <a href="https://dashboard.baqend.com/imprint">Imprint</a> -
        <a href="/?examples=true">Examples</a>
      </footer>
    )
  }
}

export default Footer
