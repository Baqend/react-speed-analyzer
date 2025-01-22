'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEnhancers = exports.createStoreWithBaqend = exports.baqendReducer = exports.baqendMiddleware = exports.baqendConnect = exports.BAQEND_CONNECTED = exports.BAQEND_CONNECTING = undefined;

var _constants = require('./constants');

var _connect = require('./connect');

var _connect2 = _interopRequireDefault(_connect);

var _createMiddleware = require('./middleware/createMiddleware');

var _createMiddleware2 = _interopRequireDefault(_createMiddleware);

var _reducer = require('./reducer');

var _reducer2 = _interopRequireDefault(_reducer);

var _createStore = require('./createStore');

var _createStore2 = _interopRequireDefault(_createStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createEnhancers = function createEnhancers(db) {
  return { baqendConnect: (0, _connect2.default)(db), baqendMiddleware: (0, _createMiddleware2.default)(db) };
};

exports.BAQEND_CONNECTING = _constants.BAQEND_CONNECTING;
exports.BAQEND_CONNECTED = _constants.BAQEND_CONNECTED;
exports.baqendConnect = _connect2.default;
exports.baqendMiddleware = _createMiddleware2.default;
exports.baqendReducer = _reducer2.default;
exports.createStoreWithBaqend = _createStore2.default;
exports.createEnhancers = createEnhancers;