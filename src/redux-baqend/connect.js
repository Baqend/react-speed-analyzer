'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var baqendConnect = function baqendConnect(db) {
  return function (next) {
    return function (reducer, initialState, middleware) {
      var store = next(reducer, initialState, middleware);
      var dispatch = store.dispatch;


      dispatch({ type: 'BAQEND_CONNECTING' });
      db.then(function (db) {
        dispatch({
          type: 'BAQEND_CONNECTED',
          user: db.User.me && db.User.me.toJSON() || null
        });
      });

      return store;
    };
  };
};

exports.default = baqendConnect;