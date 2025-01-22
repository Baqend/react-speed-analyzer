'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _redux = require('redux');

var _index = require('./index');

var createStoreWithBaqend = function createStoreWithBaqend(db, reducer, initialState, middleware) {
  var _createEnhancers = (0, _index.createEnhancers)(db),
      baqendConnect = _createEnhancers.baqendConnect,
      baqendMiddleware = _createEnhancers.baqendMiddleware;

  return (0, _redux.createStore)(reducer, initialState, (0, _redux.compose)(baqendConnect, (0, _redux.applyMiddleware)(baqendMiddleware), middleware));
};

exports.default = createStoreWithBaqend;
