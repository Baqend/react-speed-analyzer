import React, { Component } from 'react'

import { Route, Switch, Redirect } from 'react-router'
import { MemoryRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import '../styles/index.css'

import store from '../store/store_modules'

import LoadingScreen from './LoadingScreen/scenes/embedded'
import ResultScreen from './ResultScreen/scenes/embedded'

import ToastContainer from '../components/Toasts/ToastContainer'

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="wrapper">
          <div id="main">
            <MemoryRouter>
              <Route render={({ location, ...rest }) => {
                const { testId, onAfterFinish, isPlesk } = this.props
                return (
                  <Switch>
                    <Redirect exact from="/" to={`/test/${testId}`} />
                    <Route exact path="/test/:testId" render={props => (
                      <div className="content">
                        <LoadingScreen { ...props } />
                      </div>
                    )}/>
                    <Route exact path="/test/:testId/result" render={props => (
                      <div className="content">
                        <ResultScreen { ...props } isPlesk={isPlesk} onAfterFinish={onAfterFinish} />
                      </div>
                    )}/>
                  </Switch>
                )
              }}/>
            </MemoryRouter>
          </div>
          <ToastContainer />
        </div>
      </Provider>
    )
  }
}

export default App
