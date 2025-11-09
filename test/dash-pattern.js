#!/usr/bin/env node

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { computeSnappedLength } = require('../src/utils/DashPatternHelper.js');

describe('dash pattern helper', () => {
  it('returns zero delta when already aligned', () => {
    const { delta, target } = computeSnappedLength(28);
    assert.ok(Math.abs(delta) < 1e-6, 'no adjustment should be needed for aligned length');
    assert.equal(target, 28, 'target should equal original when already valid');
  });

  it('computes delta to the nearest valid multiple', () => {
    const length = 12;
    const { target, delta } = computeSnappedLength(length);
    const expectedCycles = Math.floor((length + 2) / 5);
    const expectedTarget = expectedCycles > 0 ? expectedCycles * 5 - 2 : length;
    assert.equal(target, expectedTarget, 'target length should be nearest lower valid length');
    assert.ok(delta >= 0, 'delta should never lengthen the line');
    if (expectedCycles > 0) {
      assert.ok(Math.abs((length - delta) - target) < 1e-6, 'delta should convert input length to target');
    }
  });

  it('leaves very short lines unchanged', () => {
    const length = 2;
    const { target, delta } = computeSnappedLength(length);
    assert.equal(target, length, 'length below first dash should remain unchanged');
    assert.equal(delta, 0, 'delta should be zero for sub-dash lengths');
  });
});
