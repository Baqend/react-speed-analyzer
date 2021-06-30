/* eslint-disable */
'use strict';
import isRegexp from 'is-regexp';
import isObject from 'is-obj';
import getOwnEnumPropSymbols from 'get-own-enumerable-property-symbols'

export function stringifyObject(val, opts = {}, pad = '', seen = []) {
  opts.indent = opts.indent || '\t';

  let tokens;

  if (opts.inlineCharacterLimit === undefined) {
    tokens = {
      newLine: '\n',
      newLineOrSpace: '\n',
      pad,
      indent: pad + opts.indent
    };
  } else {
    tokens = {
      newLine: '@@__STRINGIFY_OBJECT_NEW_LINE__@@',
      newLineOrSpace: '@@__STRINGIFY_OBJECT_NEW_LINE_OR_SPACE__@@',
      pad: '@@__STRINGIFY_OBJECT_PAD__@@',
      indent: '@@__STRINGIFY_OBJECT_INDENT__@@'
    };
  }

  const expandWhiteSpace = string => {
    if (opts.inlineCharacterLimit === undefined) {
      return string;
    }

    const oneLined = string
      .replace(new RegExp(tokens.newLine, 'g'), '')
      .replace(new RegExp(tokens.newLineOrSpace, 'g'), ' ')
      .replace(new RegExp(tokens.pad + '|' + tokens.indent, 'g'), '');

    if (oneLined.length <= opts.inlineCharacterLimit) {
      return oneLined;
    }

    return string
      .replace(new RegExp(tokens.newLine + '|' + tokens.newLineOrSpace, 'g'), '\n')
      .replace(new RegExp(tokens.pad, 'g'), pad)
      .replace(new RegExp(tokens.indent, 'g'), pad + opts.indent);
  };

  if (seen.indexOf(val) !== -1) {
    return '"[Circular]"';
  }

  if (val === null ||
    val === undefined ||
    typeof val === 'number' ||
    typeof val === 'boolean' ||
    typeof val === 'function' ||
    typeof val === 'symbol' ||
    isRegexp(val)) {
    return String(val);
  }

  if (val instanceof Date) {
    return `new Date('${val.toISOString()}')`;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      return '[]';
    }

    seen.push(val);

    const ret = '[' + tokens.newLine + val.map((el, i) => {
      const eol = val.length - 1 === i ? tokens.newLine : ',' + tokens.newLineOrSpace;
      let value = stringifyObject(el, opts, pad + opts.indent, seen);
      if (opts.transform) {
        value = opts.transform(val, i, value);
      }
      return tokens.indent + value + eol;
    }).join('') + tokens.pad + ']';

    seen.pop(val);

    return expandWhiteSpace(ret);
  }

  if (isObject(val)) {
    let objKeys = Object.keys(val).concat(getOwnEnumPropSymbols(val));

    if (opts.filter) {
      objKeys = objKeys.filter(el => opts.filter(val, el));
    }

    if (objKeys.length === 0) {
      return '{}';
    }

    seen.push(val);

    const ret = '{' + tokens.newLine + objKeys.map((el, i) => {
      const eol = objKeys.length - 1 === i ? tokens.newLine : ',' + tokens.newLineOrSpace;
      const isSymbol = typeof el === 'symbol';
      const isClassic = !isSymbol && /^[a-z$_][a-z$_0-9]*$/i.test(el);
      const key = isSymbol || isClassic ? el : stringifyObject(el, opts, '', seen);
      let value = stringifyObject(val[el], opts, pad + opts.indent, seen);
      if (opts.transform) {
        value = opts.transform(val, el, value);
      }
      return tokens.indent + String(key) + ': ' + value + eol;
    }).join('') + tokens.pad + '}';

    seen.pop(val);

    return expandWhiteSpace(ret);
  }

  val = String(val).replace(/[\r\n]/g, x => x === '\n' ? '\\n' : '\\r');

  if (opts.singleQuotes === false) {
    val = val.replace(/"/g, '\\"');
    return `"${val}"`;
  }

  val = val.replace(/\\?'/g, '\\\'');
  return `'${val}'`;
}
