#!/usr/bin/env node

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');
const { collectRingDiagnostics } = require('../debug/ring-diagnostics.js');

const FIGURE_S2_SMILES = 'C[C@H]1C[C@@]23C(=O)/C(=C\\4/C=C/C(=C/[C@@H](C/C=C/C(=C/[C@]2(C=C1C)C)/C)O)/CO4)/C(=O)O3';
const KEKULIZED_BENZENE = 'C1=CC=CC=C1';

function analyzeSmiles(smiles) {
  const preprocessor = new MolecularPreprocessor({});
  const tree = Parser.parse(smiles, {});
  preprocessor.initDraw(tree, 'light', false, []);
  preprocessor.processGraph();
  return {
    preprocessor,
    diagnostics: collectRingDiagnostics(preprocessor),
  };
}

function uniqueMemberSets(rings) {
  return new Set(rings.map((ring) => JSON.stringify((ring.members || []).slice().sort((a, b) => a - b))));
}

describe('Aromatic overlay rendering', () => {
  it('draws exactly the canonical aromatic ring for benzene', () => {
    const { diagnostics } = analyzeSmiles('c1ccccc1');
    assert.equal(diagnostics.ringCount, 1, 'benzene should have one canonical ring');
    assert.equal(diagnostics.aromaticRings.length, 1, 'should expose one aromatic overlay');
    const memberSets = uniqueMemberSets(diagnostics.aromaticRings);
    assert.equal(memberSets.size, diagnostics.aromaticRings.length, 'overlay sets should be unique');
  });

  it('detects aromatic overlays for kekulised benzene', () => {
    const { diagnostics } = analyzeSmiles(KEKULIZED_BENZENE);
    assert.equal(diagnostics.ringCount, 1, 'kekulised benzene should still have one canonical ring');
    assert.equal(diagnostics.aromaticRings.length, 1, 'overlay count should remain one for kekulised input');
  });

  it('never duplicates aromatic overlays beyond the inventory', () => {
    const { diagnostics } = analyzeSmiles('c1ccc2ccccc2c1'); // naphthalene
    assert(diagnostics.aromaticRings.length > 0, 'should detect aromatic overlays');
    const inventorySets = new Set((diagnostics.cycleInventory || []).map((cycle) => JSON.stringify(cycle.slice().sort((a, b) => a - b))));
    for (const ring of diagnostics.aromaticRings) {
      const key = JSON.stringify((ring.members || []).slice().sort((a, b) => a - b));
      assert(inventorySets.has(key), 'overlay must correspond to a Johnson inventory cycle');
    }
  });

  it('does not mark macrocycle rings aromatic when Pikachu would reject them', () => {
    const { diagnostics } = analyzeSmiles(FIGURE_S2_SMILES);
    assert.equal(diagnostics.aromaticRings.length, 0, 'macrocycle should not report aromatic overlays');
  });

  it('flags aromatic bonds for dashed rendering without drawing circles', () => {
    const { preprocessor } = analyzeSmiles('c1ccccc1');
    const aromaticEdges = preprocessor.graph.edges.filter((edge) => edge.isAromatic);
    assert.equal(aromaticEdges.length, preprocessor.graph.edges.length, 'all benzene bonds should retain aromatic intent');

    const aromaticRings = preprocessor.getAromaticRings();
    assert(aromaticRings.length > 0, 'benzene should expose aromatic rings');
    for (const ring of aromaticRings) {
      assert.equal(preprocessor.shouldDrawAromaticCircle(ring), false, 'rings should never request circle overlays');
    }
  });

  it('clears aromatic flags for kekulised input', () => {
    const { preprocessor } = analyzeSmiles(KEKULIZED_BENZENE);
    const aromaticEdges = preprocessor.graph.edges.filter((edge) => edge.isAromatic);
    assert.equal(aromaticEdges.length, 0, 'kekulised benzene should not carry aromatic bond flags');
  });
});
