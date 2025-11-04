#!/usr/bin/env node

/**
 * @file Structural ring detection tests focused on SSSR behaviour.
 * @description
 * Test suite that validates the Smallest Set of Smallest Rings implementation
 * against fused-ring examples using Node's built-in test runner.
 *
 * Run via: npm run test:sssr
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');
const SSSR = require('../src/algorithms/SSSR.js');

const TPPP_SMILES = 'C=9C=CC(C7=C1C=CC(=N1)C(C=2C=CC=CC=2)=C3C=CC(N3)=C(C=4C=CC=CC=4)C=5C=CC(N=5)=C(C=6C=CC=CC=6)C8=CC=C7N8)=CC=9';

/**
 * Convenience helper – parse SMILES, build the graph, and return the rings.
 * @param {string} smiles
 * @returns {number[][]} ring membership expressed as vertex id arrays
 */
function detectRings(smiles) {
    const parseTree = Parser.parse(smiles, {});
    const preprocessor = new MolecularPreprocessor({});
    preprocessor.initDraw(parseTree, 'light', false, []);
    const rings = SSSR.getRings(preprocessor.graph, false);
    return rings ?? [];
}

/**
 * Run the molecular preprocessor pipeline to access ring metadata.
 * @param {string} smiles
 * @returns {MolecularPreprocessor}
 */
function prepareMolecule(smiles) {
    const parseTree = Parser.parse(smiles, {});
    const preprocessor = new MolecularPreprocessor({});
    preprocessor.initDraw(parseTree, 'light', false, []);
    return preprocessor;
}

describe('SSSR ring detection', () => {
    it('should detect single ring in cyclohexane', () => {
        const rings = detectRings('C1CCCCC1');
        assert.equal(rings.length, 1, 'Cyclohexane should have exactly 1 ring');
    });

    it('should detect single aromatic ring in benzene', () => {
        const rings = detectRings('c1ccccc1');
        assert.equal(rings.length, 1, 'Benzene should have exactly 1 aromatic ring');
    });

    it('should detect 2 rings in decalin (fused cyclohexanes)', () => {
        const rings = detectRings('C1CCCC2CC1CCCC2');
        assert.equal(rings.length, 2, 'Decalin should have exactly 2 rings');
    });

    it('should detect 2 rings in naphthalene (fused aromatic rings)', () => {
        const rings = detectRings('c1ccc2cccc2c1');
        assert.equal(rings.length, 2, 'Naphthalene should have exactly 2 fused aromatic rings');
    });

    it('should detect no fused rings in TPPP', () => {
        const preprocessor = prepareMolecule(TPPP_SMILES);
        const fused = preprocessor.getFusedRings();
        assert.equal(fused.length, 0, 'TPPP should not yield fused rings');
    });

    it('should include a super-ring in the TPPP SSSR output', () => {
        const rings = detectRings(TPPP_SMILES);
        assert.ok(rings.length > 0, 'SSSR returned no rings for TPPP');

        const largest = Math.max(...rings.map(r => r.length));
        assert.ok(
            largest >= 12,
            `Expected at least one ring of size ≥12 in TPPP SSSR output, observed sizes: ${rings.map(r => r.length).join(', ')}`
        );
    });
});
