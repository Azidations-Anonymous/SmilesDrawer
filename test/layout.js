#!/usr/bin/env node

/**
 * Layout quality tests for the Kamada-Kawai implementation.
 * These tests go beyond smoke checks by validating energetic optimality,
 * symmetry handling, and invariance properties described in the original paper.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');

/**
 * Fully preprocess a SMILES string so the returned graph reflects the
 * production layout pipeline.
 */
function prepareMolecule(smiles) {
    const preprocessor = new MolecularPreprocessor({});
    preprocessor.initDraw(Parser.parse(smiles, {}), 'light', false, []);
    preprocessor.processGraph();
    return {
        graph: preprocessor.graph,
        bondLength: preprocessor.opts.bondLength
    };
}

/**
 * Return a copy of the current vertex positions for downstream calculations.
 */
function collectPositions(graph) {
    return graph.vertices.map(vertex => ({
        id: vertex.id,
        x: vertex.position.x,
        y: vertex.position.y
    }));
}

/**
 * Compute the Kamada–Kawai energy (total and average per vertex pair).
 */
function computeSpringEnergy(graph, bondLength) {
    const dist = graph.getDistanceMatrix();
    const positions = collectPositions(graph);
    let total = 0;
    let consideredPairs = 0;

    for (let i = 0; i < dist.length; i++) {
        for (let j = i + 1; j < dist.length; j++) {
            const dij = dist[i][j];
            if (!Number.isFinite(dij) || dij === 0) {
                continue;
            }
            const desired = bondLength * dij;
            const dx = positions[i].x - positions[j].x;
            const dy = positions[i].y - positions[j].y;
            const actual = Math.hypot(dx, dy);
            const strength = bondLength * Math.pow(dij, -2.0);
            total += strength * Math.pow(actual - desired, 2);
            consideredPairs++;
        }
    }

    return {
        total,
        average: consideredPairs ? total / consideredPairs : 0
    };
}

/**
 * Calculate mean and worst-case relative distance errors between the current
 * Euclidean layout and the graph-theoretic distances implied by the SMILES.
 */
function computeDistanceErrors(graph, bondLength) {
    const dist = graph.getDistanceMatrix();
    const positions = collectPositions(graph);
    const errors = [];

    for (let i = 0; i < dist.length; i++) {
        for (let j = i + 1; j < dist.length; j++) {
            const dij = dist[i][j];
            if (!Number.isFinite(dij) || dij === 0) {
                continue;
            }
            const desired = bondLength * dij;
            const dx = positions[i].x - positions[j].x;
            const dy = positions[i].y - positions[j].y;
            const actual = Math.hypot(dx, dy);
            errors.push(Math.abs(actual - desired) / desired);
        }
    }

    return {
        mean: errors.reduce((sum, value) => sum + value, 0) / errors.length,
        max: Math.max(...errors)
    };
}

/**
 * Centre a set of points around the origin; needed for symmetry tests.
 */
function centrePoints(points) {
    const centroid = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    const inv = 1 / points.length;
    centroid.x *= inv;
    centroid.y *= inv;
    return points.map(p => ({ x: p.x - centroid.x, y: p.y - centroid.y }));
}

/**
 * Convert centred points into polar radii.
 */
function computeRadii(points) {
    return points.map(p => Math.hypot(p.x, p.y));
}

/**
 * Convenience helper for max absolute deviation from the mean.
 */
function maxDeviation(values) {
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.max(...values.map(value => Math.abs(value - average)));
}

/**
 * Compute all pairwise distances and return them sorted. Used to assert layouts
 * are congruent up to rigid transforms.
 */
function pairwiseSortedDistances(points) {
    const distances = [];
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            distances.push(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y));
        }
    }
    return distances.sort((a, b) => a - b);
}

describe('Kamada-Kawai energy optimisation', () => {
    it('matches known average energy for cyclohexane', () => {
        const { graph, bondLength } = prepareMolecule('C1CCCCC1');
        const { average } = computeSpringEnergy(graph, bondLength);
        assert.ok(Math.abs(average - 793.8512782561247) < 1, `unexpected energy: ${average}`);
    });

    it('matches known average energy for decalin', () => {
        const { graph, bondLength } = prepareMolecule('C1CCCC2CC1CCCC2');
        const { average } = computeSpringEnergy(graph, bondLength);
        assert.ok(Math.abs(average - 502.7515161193521) < 1, `unexpected energy: ${average}`);
    });

    it('matches known average energy for macrocyclic peptide proxy', () => {
        const { graph, bondLength } = prepareMolecule('C=9C=CC(C7=C1C=CC(=N1)C(C=2C=CC=CC=2)=C3C=CC(N3)=C(C=4C=CC=CC=4)C=5C=CC(N=5)=C(C=6C=CC=CC=6)C8=CC=C7N8)=CC=9');
        const { average } = computeSpringEnergy(graph, bondLength);
        assert.ok(Math.abs(average - 974.645438766853) < 5, `unexpected energy: ${average}`);
    });
});

describe('Symmetry and uniformity', () => {
    // A symmetric six-membered ring should remain essentially circular.
    it('draws symmetric rings with uniform radii', () => {
        const { graph } = prepareMolecule('C1CCCCC1');
        const centred = centrePoints(collectPositions(graph));
        const radii = computeRadii(centred);
        assert.ok(maxDeviation(radii) < 4, 'ring radii deviate too much from mean');
    });

    // Graph theoretic distances must be respected post layout; large deviations
    // indicate spring parameters or convergence have regressed.
    it('respects graph-theoretic distances', () => {
        const { graph, bondLength } = prepareMolecule('C1CCCC2CC1CCCC2');
        const stats = computeDistanceErrors(graph, bondLength);
        assert.ok(stats.mean < 0.25, `mean distance error too high: ${stats.mean}`);
        assert.ok(stats.max < 0.75, `max distance error too high: ${stats.max}`);
    });
});

describe('Isomorphism invariance', () => {
    // Two equivalent SMILES strings should lead to the same set of pairwise
    // distances, modulo rotation/translation of the entire structure.
    it('produces congruent layouts for isomorphic benzene representations', () => {
        const first = centrePoints(collectPositions(prepareMolecule('C1=CC=CC=C1').graph));
        const second = centrePoints(collectPositions(prepareMolecule('c1ccccc1').graph));

        const distancesA = pairwiseSortedDistances(first);
        const distancesB = pairwiseSortedDistances(second);
        assert.equal(distancesA.length, distancesB.length, 'distance list length mismatch');
        for (let i = 0; i < distancesA.length; i++) {
            const delta = Math.abs(distancesA[i] - distancesB[i]);
            assert.ok(delta < 1e-3, `pairwise distance mismatch at index ${i}: ${delta}`);
        }
    });
});
