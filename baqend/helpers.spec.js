/* global describe it */
const { expect } = require('chai');
const {
  meanValue,
  finites,
  mergeConcat,
  aggregateFields,
} = require('./helpers');

describe('helpers', () => {
  it('meanValue', () => {
    expect(meanValue([1, 2, 3])).to.eql(2);
    expect(meanValue([1])).to.eql(1);
  });

  it('finites', () => {
    expect(finites([1, null, 'string', '12', NaN, 2, 3, Infinity, -Infinity, 0])).to.eql([1, 2, 3, 0]);
  });

  it('mergeConcat', () => {
    expect(mergeConcat([{ a: 1 }, { a: 2 }, { a: 3 }])).to.eql({ a: [1, 2, 3] });
    expect(mergeConcat([{ a: 1 }])).to.eql({ a: [1] });
  });

  it('aggregateFields', () => {
    expect(aggregateFields([{ a: 1 }, { a: 2, b: 4 }, { a: null }, { a: 3, c: 1 }, null], ['a', 'c'])).to.eql({ a: 2, c: 1 });
    expect(aggregateFields([{ a: 1 }], ['a'])).to.eql({ a: 1 });
  });
});
