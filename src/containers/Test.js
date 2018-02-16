import React, { Component } from 'react'
import { Provider } from 'react-redux'

import '../styles/index_modules.css'

import store from '../store/store_modules'
import Spinner from './StartingScreen/scenes/spinner'

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="wrapper">
          <div id="main">
            <div className="content">
              <Spinner { ...this.props } />
            </div>
          </div>
        </div>
      </Provider>
    )
  }
}

export default App
