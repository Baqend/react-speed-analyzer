import React, { Component } from 'react'

import { Route, Switch } from 'react-router'
import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import './styles/App.css'

import createStore from './store/store'

import StartingScreen from './components/StartingScreen/StartingScreen'
import LoadingScreen from './components/LoadingScreen/LoadingScreen'
import ResultScreen from './components/ResultScreen/ResultScreen'

const store = createStore()

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="main">
          <BrowserRouter>
            <Switch>
              <Route exact path="/" component={StartingScreen} />
              <Route exact path="/loading" component={LoadingScreen} />
              <Route exact path="/result" component={ResultScreen} />
            </Switch>
          </BrowserRouter>
        </div>
      </Provider>
    )
  }
}

export default App
