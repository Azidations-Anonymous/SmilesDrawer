#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parseHTML } = require('linkedom');

const Parser = require('../../src/parsing/Parser');
const MolecularPreprocessor = require('../../src/preprocessing/MolecularPreprocessor');
const { SMILES, MOLECULE_OPTIONS } = require('./config');

const { window } = parseHTML('<!DOCTYPE html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.navigator = window.navigator;
global.HTMLElement = window.HTMLElement;
global.SVGElement = window.SVGElement;
global.HTMLCanvasElement = window.HTMLCanvasElement;
global.HTMLImageElement = window.HTMLImageElement;
global.Element = window.Element;
global.Node = window.Node;
global.DOMParser = window.DOMParser;
global.XMLSerializer = window.XMLSerializer;

function cloneRing(ring) {
    return {
        id: ring.id,
        members: ring.members.slice(),
        neighbours: ring.neighbours.slice(),
        isBridged: !!ring.isBridged,
        isPartOfBridged: !!ring.isPartOfBridged
    };
}

function captureRings(ringManager) {
    return ringManager.rings.map(cloneRing);
}

function captureVertices(preprocessor) {
    return preprocessor.graph.vertices.map((vertex) => ({
        id: vertex.id,
        element: vertex.value.element,
        rings: vertex.value.rings.slice(),
        bridgedRing: vertex.value.bridgedRing
    }));
}

(function run() {
    const tree = Parser.parse(SMILES, {});
    const preprocessor = new MolecularPreprocessor(MOLECULE_OPTIONS);
    const ringManager = preprocessor.ringManager;
    const handler = ringManager.bridgedRingHandler;

    const logs = {
        beforeInitRings: null,
        bridgedCalls: [],
        afterInitRings: null,
        afterProcessGraph: null,
    };

    logs.beforeInitRings = captureRings(ringManager);

    const originalCreate = handler.createBridgedRing.bind(handler);
    handler.createBridgedRing = function patchedCreate(ringIds, sourceVertexId) {
        const inputRings = ringIds.map((id) => cloneRing(ringManager.getRing(id)));
        const result = originalCreate(ringIds, sourceVertexId);
        logs.bridgedCalls.push({
            ringIds: ringIds.slice(),
            sourceVertexId,
            inputRings,
            createdRing: cloneRing(result),
            verticesAfter: captureVertices(preprocessor)
        });
        return result;
    };

    preprocessor.initDraw(tree, 'light', false, []);

    logs.afterInitRings = captureRings(ringManager);

    preprocessor.processGraph();

    logs.afterProcessGraph = {
        rings: captureRings(ringManager),
        vertices: captureVertices(preprocessor)
    };

    const outputPath = path.join(__dirname, 'node-inspect.json');
    fs.writeFileSync(outputPath, JSON.stringify(logs, null, 2));
    console.log(`Inspection written to ${outputPath}`);
})();
