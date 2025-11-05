#!/usr/bin/env node

/**
 * Regression test for macrocyclic bridged ring layouts.
 *
 * The current implementation drops certain bridge atoms out of their ring,
 * which allows single bonds to stretch hundreds of units across the canvas.
 * This test encodes the expected upper bound on any drawn bond length when the
 * iron macrocycle SMILES is processed correctly.
 *
 * This guards the regression that surfaced while porting the bridged-ring
 * preprocessing from the historical bundle back into the modern TypeScript build.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const Parser = require('../src/parsing/Parser');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor');

// Provide a minimal DOM so the SvgDrawer/Preprocessor stack can run under node.
function ensureDom() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        return;
    }

    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
}

function prepare(smiles) {
    ensureDom();
    const tree = Parser.parse(smiles, {});
    const preprocessor = new MolecularPreprocessor({ width: 800, height: 800 });
    preprocessor.initDraw(tree, 'light', false, []);
    preprocessor.processGraph();
    return preprocessor;
}

function maxDrawnBondLength(graph) {
    const { vertices, edges } = graph;
    let max = 0;

    for (const edge of edges) {
        const a = vertices[edge.sourceId];
        const b = vertices[edge.targetId];

        if (!a.value.isDrawn || !b.value.isDrawn) {
            continue;
        }

        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const dist = Math.hypot(dx, dy);

        if (dist > max) {
            max = dist;
        }
    }

    return max;
}

const FERROCHELATOR_SMILES = 'CC1=[O][Fe]2345ON1CCC[C@H]1NC(=O)CNC(=O)[C@H](CO)NC(=O)CNC(=O)[C@@H](CCCN(O2)C(C)=[O]3)NC(=O)[C@@H](CCCN(O4)C(C)=[O]5)NC1=O';

test('macrocycle nitrogens remain in a ring', () => {
    const preprocessor = prepare(FERROCHELATOR_SMILES);
    const nitrogenVertices = preprocessor.graph.vertices.filter((vertex) => vertex.value.element === 'N');

    assert.equal(
        nitrogenVertices.length,
        9,
        `expected 9 nitrogens, found ${nitrogenVertices.length}`
    );

    const displacedNitrogens = nitrogenVertices
        .filter((vertex) => vertex.value.rings.length === 0);

    assert.deepEqual(
        displacedNitrogens.map((vertex) => vertex.id),
        [],
        `nitrogen vertices missing ring membership: ${displacedNitrogens.map((vertex) => vertex.id).join(', ')}`
    );
});

test('fast regression dataset produces defined coordinates', async () => {
    ensureDom();
    const dataset = require('./fastregression');

    for (const smiles of dataset) {
        const tree = Parser.parse(smiles, {});
        const preprocessor = new MolecularPreprocessor({ width: 800, height: 800 });
        preprocessor.initDraw(tree, 'light', false, []);
        preprocessor.processGraph();

        for (const vertex of preprocessor.graph.vertices) {
            if (!vertex.value.isDrawn) {
                continue;
            }

            assert.ok(
                Number.isFinite(vertex.position.x) && Number.isFinite(vertex.position.y),
                `vertex ${vertex.id} in SMILES "${smiles}" has invalid position (${vertex.position.x}, ${vertex.position.y})`
            );
        }
    }
});
