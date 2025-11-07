#!/usr/bin/env node

/**
 * Regression tests for cis/trans stereobond corrections.
 *
 * The tests mirror the SMILES directional markers directly:
 *   - identical `/` or `\\` markers imply trans arrangements,
 *   - differing markers imply cis arrangements,
 * even when the double bond is embedded inside a ring.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');

function prepareGraph(smiles) {
    const preprocessor = new MolecularPreprocessor({});
    preprocessor.initDraw(Parser.parse(smiles, {}), 'light', false, []);
    preprocessor.processGraph();
    return preprocessor.graph;
}

function getDirectionalNeighbour(graph, vertex, oppositeId) {
    for (const neighbourId of vertex.neighbours) {
        if (neighbourId === oppositeId) {
            continue;
        }
        const edge = graph.getEdge(vertex.id, neighbourId);
        if (edge && edge.stereoSymbol) {
            return graph.vertices[neighbourId];
        }
    }
    return null;
}

function sideOfLine(a, b, point) {
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
    if (cross > 0) {
        return 1;
    }
    if (cross < 0) {
        return -1;
    }
    return 0;
}

function measuredOrientation(graph) {
    const edge = graph.edges.find(e => e.bondType === '=' && e.cisTrans);
    assert.ok(edge, 'no stereogenic double bond found');
    const vertexA = graph.vertices[edge.sourceId];
    const vertexB = graph.vertices[edge.targetId];
    const neighbourA = getDirectionalNeighbour(graph, vertexA, vertexB.id);
    const neighbourB = getDirectionalNeighbour(graph, vertexB, vertexA.id);

    assert.ok(neighbourA, 'missing directional neighbour on first atom');
    assert.ok(neighbourB, 'missing directional neighbour on second atom');

    const placementA = sideOfLine(vertexA.position, vertexB.position, neighbourA.position);
    const placementB = sideOfLine(vertexA.position, vertexB.position, neighbourB.position);

    assert.notStrictEqual(placementA, 0, 'degenerate placement for first substituent');
    assert.notStrictEqual(placementB, 0, 'degenerate placement for second substituent');

    return placementA === placementB ? 'cis' : 'trans';
}

function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;
        const intersects = ((yi > point.y) !== (yj > point.y)) &&
            (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || Number.EPSILON) + xi);
        if (intersects) {
            inside = !inside;
        }
    }
    return inside;
}

describe('Cis/trans stereobond corrections', () => {
    it('keeps trans substituents on opposite sides for linear chains', () => {
        const graph = prepareGraph('F/C=C/F');
        assert.equal(measuredOrientation(graph), 'trans');
    });

    it('keeps cis substituents on the same side for linear chains', () => {
        const graph = prepareGraph('F/C=C\\F');
        assert.equal(measuredOrientation(graph), 'cis');
    });

    it('resolves ring-embedded trans bonds before overlap resolution', () => {
        const graph = prepareGraph('C1/C=C/CC=C\\1');
        assert.equal(measuredOrientation(graph), 'trans');
    });

    it('keeps the allyl substituent inside the macrocycle for the Figure S2 molecule', () => {
        const smiles = 'C[C@H]1C[C@@]23C(=O)/C(=C\\4/C=C/C(=C/[C@@H](C/C=C/C(=C/[C@]2(C=C1C)C)/C)O)/CO4)/C(=O)O3';
        const preprocessor = new MolecularPreprocessor({});
        preprocessor.initDraw(Parser.parse(smiles, {}), 'light', false, []);
        preprocessor.processGraph();

        const graph = preprocessor.graph;
        const largestRing = preprocessor.rings.reduce((acc, ring) => {
            if (!acc) {
                return ring;
            }
            return ring.members.length > acc.members.length ? ring : acc;
        }, null);

        assert.ok(largestRing, 'expected at least one ring in the macrocycle');

        const polygon = largestRing.members.map((id) => graph.vertices[id].position);
        const target = graph.vertices[29];
        assert.ok(target, 'could not locate the allyl carbon attached to the ether bridge');
        assert.ok(
            pointInPolygon(target.position, polygon),
            'allyl bridge should remain inside the macrocycle'
        );
    });
});
