import React, { Component } from 'react'

import { Route, Switch } from 'react-router'
import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import createStore from './store/store'

import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'

import './styles/index.css'
import HomeWrapper from './components/ScreenWrapper/ScreenWrapper'

const store = createStore()

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <div id="main">
          <Navbar />
          <BrowserRouter>
            <Switch>
              <Route exact path="/" component={HomeWrapper} />
            </Switch>
          </BrowserRouter>
          <Footer />
        </div>
      </Provider>
    )
  }
}

export default App
