import React, { Component } from 'react'

import { Provider } from 'react-redux'

import '../styles/index_modules.css'

import createStore from '../store/store_modules'

import ResultScreen from './ResultScreen/scenes/embedded'

const store = createStore()

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="wrapper">
          <div id="main">
            <div className="content">
              <ResultScreen { ...this.props } />
            </div>
          </div>
        </div>
      </Provider>
    )
  }
}

export default App
