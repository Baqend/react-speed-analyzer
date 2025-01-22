'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var resultToJSON = exports.resultToJSON = function resultToJSON(res) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  try {
    if (!res) return null;
    if (res.operation) return _extends({}, res, { data: res.data.toJSON(options) });
    if (res.length) {
      return res[0]._metadata ? res.map(function (o) {
        return o.toJSON(options);
      }) : res;
    } else {
      return res._metadata ? res.toJSON(options) : res;
    }
  } catch (e) {
    return res;
  }
};

var getReference = exports.getReference = function getReference(db, json, options) {
  try {
    var type = (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object' && options.type ? options.type : json.id.split('/')[2];
    return db[type] ? db[type].fromJSON(json) : null;
  } catch (e) {
    return null;
  }
};