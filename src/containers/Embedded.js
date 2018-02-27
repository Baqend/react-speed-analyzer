import React, { Component } from 'react'

import { Route, Switch } from 'react-router'
import { HashRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import '../styles/index.css'

import store from '../store/store_modules'

import StartingScreen from './StartingScreen/scenes/embedded'
import LoadingScreen from './LoadingScreen/scenes/embedded'
import ResultScreen from './ResultScreen/scenes/embedded'

import ToastContainer from '../components/Toasts/ToastContainer'

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="wrapper">
          <div id="main">
            <HashRouter hashType="noslash">
              <Route render={({ location }) => {
                location.pathname = location.pathname.replace(/%2F/g, '/')
                return (
                  <Switch>
                    <Route exact path="/" render={props => (
                      <div className="content">
                        <StartingScreen { ...props } { ...this.props } />
                      </div>
                    )}/>
                    <Route exact path="/test/:testId" render={props => (
                      <div className="content">
                        <LoadingScreen { ...props } />
                      </div>
                    )}/>
                    <Route exact path="/test/:testId/result" render={props => (
                      <div className="content">
                        <ResultScreen { ...props } { ...this.props } showInput={true} />
                      </div>
                    )}/>
                  </Switch>
                )
              }}/>
            </HashRouter>
          </div>
          <ToastContainer />
        </div>
      </Provider>
    )
  }
}

export default App
