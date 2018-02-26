import React, { Component } from 'react'

import { Route, Switch, Redirect } from 'react-router'
import { HashRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import '../styles/index.css'

import store from '../store/store_modules'

import StartingScreen from './StartingScreen'
import LoadingScreen from './LoadingScreen/scenes/embedded'
import ResultScreen from './ResultScreen/scenes/embedded'

import ToastContainer from '../components/Toasts/ToastContainer'

class App extends Component {
  render() {
    debugger
    return (
      <Provider store={store}>
        <div id="wrapper">
          <div id="main">
            <HashRouter>
              <Switch>
                <Route exact path="/" render={props => (
                  <div className="content">
                    <StartingScreen { ...props } />
                  </div>
                )}/>
                <Redirect from='/test/' to='/' exact />
                <Route exact path="/test/:testId" render={props => (
                  <div className="content">
                    <LoadingScreen { ...props } />
                  </div>
                )}/>
                <Route exact path="/test/:testId/result" render={props => (
                  <div className="content">
                    <ResultScreen { ...props } />
                  </div>
                )}/>
              </Switch>
            </HashRouter>
          </div>
          <ToastContainer />
        </div>
      </Provider>
    )
  }
}

export default App
