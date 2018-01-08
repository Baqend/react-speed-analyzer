import React, { Component } from 'react'

import { Route, Switch } from 'react-router'
import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import createStore from './store/store'

import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'

import './styles/index.css'
import StartingScreen from './components/StartingScreen/StartingScreen'
import ResultScreen from './components/ResultScreen/ResultScreen'
const store = createStore()

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="wrapper">
          <BrowserRouter>
            <Switch>
              <Route exact path="/" render={props => (
                <div id="main">
                  <div className="content">
                    <StartingScreen { ...props } />
                  </div>
                </div>
              )}/>
              <Route exact path="/result" render={props => (
                <div id="main">
                  <Navbar />
                  <div className="content">
                    <ResultScreen { ...props } />
                  </div>
                </div>
              )}/>
            </Switch>
          </BrowserRouter>
          <Footer />
        </div>
      </Provider>
    )
  }
}

export default App
