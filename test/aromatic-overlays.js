#!/usr/bin/env node

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');
const { collectRingDiagnostics } = require('../debug/ring-diagnostics.js');

const FIGURE_S2_SMILES = 'C[C@H]1C[C@@]23C(=O)/C(=C\\4/C=C/C(=C/[C@@H](C/C=C/C(=C/[C@]2(C=C1C)C)/C)O)/CO4)/C(=O)O3';

function buildDiagnostics(smiles) {
  const preprocessor = new MolecularPreprocessor({});
  const tree = Parser.parse(smiles, {});
  preprocessor.initDraw(tree, 'light', false, []);
  preprocessor.processGraph();
  return collectRingDiagnostics(preprocessor);
}

function uniqueMemberSets(rings) {
  return new Set(rings.map((ring) => JSON.stringify((ring.members || []).slice().sort((a, b) => a - b))));
}

describe('Aromatic overlay rendering', () => {
  it('draws exactly the canonical aromatic ring for benzene', () => {
    const diagnostics = buildDiagnostics('c1ccccc1');
    assert.equal(diagnostics.ringCount, 1, 'benzene should have one canonical ring');
    assert.equal(diagnostics.aromaticRings.length, 1, 'should expose one aromatic overlay');
    const memberSets = uniqueMemberSets(diagnostics.aromaticRings);
    assert.equal(memberSets.size, diagnostics.aromaticRings.length, 'overlay sets should be unique');
  });

  it('never duplicates aromatic overlays beyond the inventory', () => {
    const diagnostics = buildDiagnostics('c1ccc2ccccc2c1'); // naphthalene
    assert(diagnostics.aromaticRings.length > 0, 'should detect aromatic overlays');
    const inventorySets = new Set((diagnostics.cycleInventory || []).map((cycle) => JSON.stringify(cycle.slice().sort((a, b) => a - b))));
    for (const ring of diagnostics.aromaticRings) {
      const key = JSON.stringify((ring.members || []).slice().sort((a, b) => a - b));
      assert(inventorySets.has(key), 'overlay must correspond to a Johnson inventory cycle');
    }
  });
});
