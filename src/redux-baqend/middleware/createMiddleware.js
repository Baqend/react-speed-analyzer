'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _handleActionObject = require('./handleActionObject');

var _handleActionObject2 = _interopRequireDefault(_handleActionObject);

var _handleActionThunk = require('./handleActionThunk');

var _handleActionThunk2 = _interopRequireDefault(_handleActionThunk);

var _util = require('../util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var shouldHandle = function shouldHandle(action) {
  var BAQEND = action.BAQEND,
      BAQEND_DISPATCH = action.BAQEND_DISPATCH;

  return BAQEND || BAQEND_DISPATCH;
};

var getActionObject = function getActionObject(action) {
  var BAQEND = action.BAQEND,
      BAQEND_DISPATCH = action.BAQEND_DISPATCH;

  return BAQEND_DISPATCH && (BAQEND_DISPATCH && BAQEND_DISPATCH.BAQEND || BAQEND_DISPATCH) || BAQEND;
};

var isBaqendActionObject = function isBaqendActionObject(actionObject) {
  if (actionObject.payload) {
    if (typeof actionObject.payload === 'function') {
      return true;
    } else if (Array.isArray(actionObject.payload)) {
      if (actionObject.payload[1] && typeof actionObject.payload[1] === 'function') {
        return true;
      }
    }
  }
  return false;
};

var isBaqendActionThunk = function isBaqendActionThunk(actionObject) {
  return typeof actionObject === 'function' || Array.isArray(actionObject);
};

var createBaqendMiddleware = function createBaqendMiddleware(db) {
  return function (_ref) {
    var dispatch = _ref.dispatch,
        getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (shouldHandle(action)) {
          // console.log("should Handle")
          var actionObject = getActionObject(action);
          return db.then(function (db) {
            if (isBaqendActionObject(actionObject)) {
              // console.log("object")
              return (0, _handleActionObject2.default)({ dispatch: dispatch, getState: getState, next: next, db: db, action: actionObject });
            } else if (isBaqendActionThunk(actionObject)) {
              // console.log("thunk")
              return (0, _handleActionThunk2.default)({ dispatch: dispatch, getState: getState, next: next, db: db, action: actionObject });
            } else {
              // console.log("else")
              var type = actionObject.type,
                  payload = actionObject.payload,
                  options = actionObject.options;

              return next({
                type: type,
                payload: (0, _util.resultToJSON)(payload, options)
              });
            }
          });
        }
        return next(action);
      };
    };
  };
};

// const baqendMiddleware = createBaqendMiddleware();
exports.default = createBaqendMiddleware;