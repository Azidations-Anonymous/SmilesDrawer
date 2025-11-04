#!/usr/bin/env node

/**
 * Layout smoke tests to ensure Kamada-Kawai refactors keep positions valid.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');

function computePositions(smiles) {
    const preprocessor = new MolecularPreprocessor({});
    preprocessor.initDraw(Parser.parse(smiles, {}), 'light', false, []);
    preprocessor.processGraph();
    return preprocessor.graph.vertices.map(vertex => ({
        id: vertex.id,
        x: vertex.position.x,
        y: vertex.position.y,
        positioned: vertex.positioned
    }));
}

function assertAllFinite(positions) {
    positions.forEach(({ x, y }) => {
        assert.ok(Number.isFinite(x));
        assert.ok(Number.isFinite(y));
    });
}

describe('Kamada-Kawai layout regression', () => {
    it('places all vertices when drawing a simple ring', () => {
        const positions = computePositions('C1CCCCC1');
        assert.equal(positions.every(p => p.positioned), true);
        assertAllFinite(positions);
    });

    it('places all vertices for fused systems like decalin', () => {
        const positions = computePositions('C1CCCC2CC1CCCC2');
        assert.equal(positions.every(p => p.positioned), true);
        assertAllFinite(positions);
    });
});
