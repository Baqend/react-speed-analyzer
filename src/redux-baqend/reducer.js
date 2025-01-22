'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var initalState = {
  connecting: false,
  connected: false
};

function baqendReducer() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initalState;
  var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  switch (action.type) {
    case 'BAQEND_CONNECTING':
      return _extends({}, state, { connecting: true });
    case 'BAQEND_CONNECTED':
      return _extends({}, state, { connecting: false, connected: true });
    default:
      return state;
  }
}

exports.default = baqendReducer;