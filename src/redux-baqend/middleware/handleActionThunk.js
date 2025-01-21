'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _util = require('../util');

var handleActionThunk = function handleActionThunk(_ref) {
  var dispatch = _ref.dispatch,
      getState = _ref.getState,
      next = _ref.next,
      action = _ref.action,
      db = _ref.db;

  // monkeypatch the redux dispatch function
  var baqendDispatch = function baqendDispatch(obj, options) {
    return dispatch({
      'BAQEND_DISPATCH': _extends({}, obj, {
        options: options
      })
    });
  };

  var func = void 0;
  var args = [];
  if (Array.isArray(action)) {
    action.forEach(function (item) {
      if (typeof item === 'function') {
        func = item;
      } else {
        args.push((0, _util.getReference)(db, item));
      }
    });
  } else {
    func = action;
  }
  return func.apply(undefined, [{
    dispatch: baqendDispatch,
    getState: getState,
    db: db
  }].concat(args));
};

exports.default = handleActionThunk;