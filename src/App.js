/* @flow */
import React, { Component } from 'react'

import { Route, Switch } from 'react-router'
import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import logo from './logo.svg'
import './App.css'

import createStore from './store/store'

import StartingScreen from './components/StartingScreen/StartingScreen'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import ResultScreen from './components/ResultScreen/ResultScreen'

const store = createStore()

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h1 className="App-title">Welcome to React</h1>
          </header>
          <BrowserRouter>
            <div className="App">
              <Switch>
                <Route exact path="/" component={StartingScreen} />
                <Route exact path="/loading" component={LoadingScreen} />
                <Route exact path="/result" component={ResultScreen} />
              </Switch>
            </div>
          </BrowserRouter>
        </div>
      </Provider>
    )
  }
}

export default App
