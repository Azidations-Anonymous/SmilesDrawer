#!/usr/bin/env node

/**
 * Overlap finetuning regression tests.
 *
 * These tests exercise the steric-clash reductions described in Fig. 2B of the
 * PIKAChU paper using large macrocycles/natural products. The assertions run the
 * full layout once without finetuning, then apply the finetune pass in isolation
 * so the before/after layouts are deterministic.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Parser = require('../src/parsing/Parser.js');
const MolecularPreprocessor = require('../src/preprocessing/MolecularPreprocessor.js');

const FIGURE_2B_MACROCYCLE = 'CO[C@H]1C[C@@H]2CC=C[C@@H](C[C@@H](O[C@H]3OC[C@H](O)[C@@H](OC)[C@H]3OC)C/C=C(C)\\C=C\\C(=O)O[C@H]([C@@H](C)[C@@H](O)[C@@H](C)CC[C@H]3C[C@H](OC)C[C@H](C)O3)[C@@H](C)[C@H](O)C[C@H](O)C[C@@H](OC)C[C@@H]3CC=C[C@@H](C[C@@H](O[C@H]4OC[C@H](O)[C@@H](OC)[C@H]4OC)C/C=C(C)/C=C\\C(=O)O[C@H]([C@@H](C)[C@@H](O)[C@@H](C)CC[C@H]4C[C@H](OC)C[C@H](C)O4)[C@@H](C)[C@H](O)C[C@H](O)C1C)O3)O2';
const DENSE_PEPTIDE_BRANCH = 'CC(C)C/C=C/C=C\\C(=O)N[C@@H](CC(N)=O)C(=O)N[C@@H]1C(=O)N[C@H](C2=CC=C(O)C=C2)C(=O)N[C@H](CCCN)C(=O)N[C@H]([C@@H](C)O)C(=O)N[C@@H](C2=CC=C(O)C=C2)C(=O)N[C@H](C2=CC=C(O)C=C2)C(=O)N[C@@H]([C@H](C)O)C(=O)N[C@@H](CC2=CC=CC=C2)C(=O)N[C@H](CCCN)C(=O)N[C@@H](C2=CC=C(O[C@H]3O[C@H](CO)[C@@H](O)[C@H](O)[C@@H]3O[C@H]3O[C@H](CO)[C@@H](O)[C@H](O)[C@@H]3O)C=C2)C(=O)N[C@H]([C@@H](C)O)C(=O)N[C@@H](C2=CC=C(O)C=C2)C(=O)NCC(=O)N[C@@H](CC(C)C)C(=O)N[C@H](C)C(=O)N[C@@H](C2=CC(Cl)=C(O)C=C2)C(=O)O[C@@H]1C(N)=O.Cl.Cl';

function mergeOptions(target, source) {
    if (!source || typeof source !== 'object') {
        return target;
    }

    for (const key of Object.keys(source)) {
        const value = source[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            mergeOptions(target[key], value);
        } else {
            target[key] = value;
        }
    }

    return target;
}

function prepareMolecule(smiles, overrides = {}) {
    const parseTree = Parser.parse(smiles, {});
    const baseOptions = {
        layout: {
            finetune: {
                enabled: false
            }
        }
    };
    const mergedOptions = mergeOptions(baseOptions, overrides);
    const preprocessor = new MolecularPreprocessor(mergedOptions);
    preprocessor.initDraw(parseTree, 'light', false, []);
    preprocessor.processGraph();
    return preprocessor;
}

describe('Overlap finetuning parity', () => {
    it('reduces the Fig. 2B macrocycle clash score', () => {
        const preprocessor = prepareMolecule(FIGURE_2B_MACROCYCLE);
        const baseline = preprocessor.getTotalOverlapScore();
        preprocessor.userOpts.layout.finetune.enabled = true;
        preprocessor.resolveFinetuneOverlaps();
        const tuned = preprocessor.getTotalOverlapScore();

        assert.ok(tuned < baseline, 'finetuning should lower the overlap score');
        const minReduction = Math.min(5, baseline * 0.5);
        assert.ok(
            baseline - tuned > minReduction,
            `Expected a reduction larger than ${minReduction.toFixed(2)}, observed baseline=${baseline}, tuned=${tuned}`
        );
    });

    it('honours the iteration guard when finetuning is capped', () => {
        const preprocessor = prepareMolecule(FIGURE_2B_MACROCYCLE);
        const baseline = preprocessor.getTotalOverlapScore();
        preprocessor.userOpts.layout.finetune.enabled = true;
        preprocessor.userOpts.layout.finetune.maxSteps = 0;
        preprocessor.resolveFinetuneOverlaps();
        const capped = preprocessor.getTotalOverlapScore();

        assert.equal(capped, baseline, 'zero finetune steps should skip the extra pass');
    });

    it('reduces overlap scores on densely branched peptides', () => {
        const preprocessor = prepareMolecule(DENSE_PEPTIDE_BRANCH, {
            layout: {
                graph: {
                    overlapSensitivity: 0.3
                }
            }
        });
        const baseline = preprocessor.getTotalOverlapScore();
        preprocessor.userOpts.layout.finetune.enabled = true;
        preprocessor.resolveFinetuneOverlaps();
        const tuned = preprocessor.getTotalOverlapScore();

        assert.ok(tuned < baseline, 'finetuning should reduce overlap on branched peptides');
        assert.ok(
            baseline - tuned > 5,
            `Expected a reduction larger than 5, observed baseline=${baseline}, tuned=${tuned}`
        );
    });
});
