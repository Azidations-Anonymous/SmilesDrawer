#!/usr/bin/env node

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');

function buildPreprocessor(smiles) {
  const preprocessor = new MolecularPreprocessor({});
  const tree = Parser.parse(smiles, {});
  preprocessor.initDraw(tree, 'light', false, []);
  preprocessor.processGraph();
  return preprocessor;
}

function cycleLengths(cycles) {
  return cycles.map((cycle) => cycle.length).sort((a, b) => a - b);
}

describe('Johnson cycle enumeration', () => {
  it('finds a single cycle for benzene', () => {
    const preprocessor = buildPreprocessor('c1ccccc1');
    const graphCycles = preprocessor.graph.getAllCycles();

    assert.equal(graphCycles.length, 1);
    assert.deepEqual(cycleLengths(graphCycles), [6]);
  });

  it('detects fused ring cycles in decalin', () => {
    const preprocessor = buildPreprocessor('C1CCC2CC1CCC2');
    const graphCycles = preprocessor.graph.getAllCycles();

    assert.equal(graphCycles.length, 2);
    assert.deepEqual(cycleLengths(graphCycles), [6, 6]);
  });

  it('enumerates all simple cycles in naphthalene', () => {
    const preprocessor = buildPreprocessor('c1ccc2cccc2c1');
    const graphCycles = preprocessor.graph.getAllCycles();

    assert.equal(graphCycles.length, 3);
    assert.deepEqual(cycleLengths(graphCycles), [6, 6, 10]);
  });
});
