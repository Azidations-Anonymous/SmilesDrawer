#!/usr/bin/env node

/**
 * Unit tests for the cis/trans metadata detection pipeline. These assertions
 * work directly on the annotated graph (before any geometric correction runs),
 * giving us fine-grained coverage of the helpers that derive the
 * `cisTransNeighbours` lookup.
 *
 * Reference behaviour is cross-checked against PIKAChU's `_fix_chiral_bonds_in_rings`
 * tooling (see ../pikachu/pikachu/drawing/drawing.py) to make sure the
 * orientation tables are equivalent.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');

function buildGraph(smiles) {
    const preprocessor = new MolecularPreprocessor({});
    preprocessor.initDraw(Parser.parse(smiles, {}), 'light', false, []);
    return preprocessor.graph;
}

function getFirstStereoEdge(graph) {
    const edge = graph.edges.find((e) => e.bondType === '=' && e.cisTrans);
    assert.ok(edge, 'expected a stereogenic double bond in the prepared graph');
    return edge;
}

function getDirectionalNeighbour(graph, vertex, oppositeId) {
    const candidates = vertex.neighbours.filter((id) => id !== oppositeId);

    let directional = candidates.find((id) => {
        const edge = graph.getEdge(vertex.id, id);
        return edge && edge.stereoSymbol && (edge.stereoSourceId === null || edge.stereoSourceId === vertex.id);
    });

    if (!directional && candidates.length) {
        directional = candidates[0];
    }

    return directional !== undefined ? graph.vertices[directional] : null;
}

function expectOrientation(smiles, expected) {
    const graph = buildGraph(smiles);
    const edge = getFirstStereoEdge(graph);
    const source = graph.vertices[edge.sourceId];
    const target = graph.vertices[edge.targetId];
    const anchorA = getDirectionalNeighbour(graph, source, target.id);
    const anchorB = getDirectionalNeighbour(graph, target, source.id);

    assert.ok(anchorA, 'missing directional neighbour on the source vertex');
    assert.ok(anchorB, 'missing directional neighbour on the target vertex');

    const metadata = edge.cisTransNeighbours[anchorA.id]?.[anchorB.id];
    assert.ok(metadata, `no metadata entry for vertices ${anchorA.id} and ${anchorB.id}`);
    assert.equal(metadata, expected, `expected ${expected} but saw ${metadata}`);

    const reverse = edge.cisTransNeighbours[anchorB.id]?.[anchorA.id];
    assert.equal(reverse, expected, 'metadata must be symmetric');
}

describe('cis/trans metadata detection', () => {
    it('flags trans substituents when both flanks use "/" markers', () => {
        expectOrientation('F/C=C/F', 'trans');
    });

    it('flags cis substituents when markers disagree', () => {
        expectOrientation('F/C=C\\F', 'cis');
    });

    it('detects trans intent even for ring-embedded bonds (alternate sequence)', () => {
        expectOrientation('C1/C=C/CC=C\\1', 'trans');
    });
});
