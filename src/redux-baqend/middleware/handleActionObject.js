'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _util = require('../util');

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var handleActionObject = function handleActionObject(_ref) {
  var dispatch = _ref.dispatch,
      getState = _ref.getState,
      next = _ref.next,
      action = _ref.action,
      db = _ref.db;
  var payload = action.payload,
      options = action.options;

  var actionTypes = getActionTypes(action);
  var PENDING = actionTypes.PENDING;


  if (PENDING) {
    if (typeof PENDING === 'string') {
      next({ type: PENDING });
    } else {
      next(PENDING);
    }
  }

  return db.then(function (db) {
    var processedPayload = processPayload(db, payload, options);
    if (isObservable(processedPayload)) {
      return handleObservable({ processedPayload: processedPayload, next: next, dispatch: dispatch, actionTypes: actionTypes, options: options });
    } else if (isPromise(processedPayload)) {
      return handlePromise({ processedPayload: processedPayload, next: next, dispatch: dispatch, actionTypes: actionTypes, options: options });
    }
  });
};

var getActionTypes = function getActionTypes(action) {
  var type = action.type,
      types = action.types;

  var PENDING = types && types[0] ? types[0] : undefined;
  var SUCCESS = types && types[1] ? types[1] : type;
  var FAILURE = types && types[2] ? types[2] : undefined;
  return { PENDING: PENDING, SUCCESS: SUCCESS, FAILURE: FAILURE };
};

var processPayload = function processPayload(db, payload, options) {
  var ref = void 0,
      func = void 0;
  if (Array.isArray(payload)) {
    ref = _typeof(payload[0]) === 'object' ? (0, _util.getReference)(db, payload[0], options) : null;
    func = payload[1];
  } else {
    func = payload;
  }
  return func(db, ref);
};

var isObservable = function isObservable(payload) {
  return payload && payload.subscribe;
};

var isPromise = function isPromise(payload) {
  return payload && payload.then;
};

var handleObservable = function handleObservable(_ref2) {
  var processedPayload = _ref2.processedPayload,
      next = _ref2.next,
      dispatch = _ref2.dispatch,
      actionTypes = _ref2.actionTypes,
      options = _ref2.options;
  var SUCCESS = actionTypes.SUCCESS;

  var callback = function callback(r) {
    var res = void 0;
    var action = void 0;
    if (Array.isArray(r)) {
      res = (0, _util.resultToJSON)(r, options);
    } else {
      res = {
        date: r.date,
        data: (0, _util.resultToJSON)(r.data, options),
        matchType: r.matchType,
        operation: r.operation
      };
    }
    action = {
      type: SUCCESS,
      payload: res
    };
    next(action);
  };

  var subscription = processedPayload.subscribe(callback);
  dispatch({
    type: SUCCESS + '_SUBSCRIPTION',
    payload: subscription
  });
  return subscription;
};

var handlePromise = function handlePromise(_ref3) {
  var processedPayload = _ref3.processedPayload,
      next = _ref3.next,
      dispatch = _ref3.dispatch,
      actionTypes = _ref3.actionTypes,
      options = _ref3.options;
  var SUCCESS = actionTypes.SUCCESS,
      FAILURE = actionTypes.FAILURE;

  var handleSuccess = function handleSuccess(r) {
    var action = void 0;
    var res = (0, _util.resultToJSON)(r, options);
    if (typeof SUCCESS === 'string') {
      action = {
        type: SUCCESS,
        payload: res
      };
    } else {
      var type = SUCCESS.type,
          payload = SUCCESS.payload,
          rest = _objectWithoutProperties(SUCCESS, ['type', 'payload']);

      action = _extends({
        type: type,
        payload: payload && payload(res) || res
      }, rest);
    }
    next(action);
  };
  var handleFailure = function handleFailure(e) {
    var action = void 0;
    if (typeof FAILURE === 'string') {
      action = {
        type: FAILURE,
        payload: e
      };
    } else {
      var type = FAILURE.type,
          payload = FAILURE.payload,
          rest = _objectWithoutProperties(FAILURE, ['type', 'payload']);

      action = _extends({
        type: type,
        payload: payload && payload(e) || e
      }, rest);
    }
    next(action);
  };
  return new Promise(function (resolve, reject) {
    return processedPayload.then(function (r) {
      handleSuccess(r);
      resolve(r);
    }, function (e) {
      FAILURE && handleFailure(e);
      reject(e);
    });
  });
};

exports.default = handleActionObject;