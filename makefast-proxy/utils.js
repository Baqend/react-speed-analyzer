/* eslint-disable no-restricted-syntax */

/**
 * @param {number} number
 * @param {string} pad
 * @return {string}
 */
function padLeft(number, pad = '            ') {
  const str = `${number}`;
  return pad.substring(0, pad.length - str.length) + str;
}

/**
 * @param {number} number
 * @param {string} pad
 * @return {string}
 */
function padRight(number, pad = '      ') {
  const str = `${number}`;
  return str + pad.substring(0, pad.length - str.length);
}

/**
 * @param {number} micros
 * @return {string}
 */
function formatMicro(micros) {
  return `${micros.toFixed(6)}s`;
}


/**
 * @param {*} objs
 * @return {{}}
 */
function aggregateObjs(objs) {
  if (!objs.length) return {};
  const keys = Object.keys(objs[0]);
  const initial = {};
  for (const key of keys) {
    initial[key] = 0;
  }
  const reduced = objs.reduce((a, b) => {
    const result = {};
    for (const key of keys) {
      result[key] = a[key] + b[key];
    }

    return result;
  }, initial);
  for (const key of keys) {
    reduced[key] /= objs.length;
  }

  return reduced;
}

exports.padLeft = padLeft;
exports.padRight = padRight;
exports.formatMicro = formatMicro;
exports.aggregateObjs = aggregateObjs;
