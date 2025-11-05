#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const { SMILES, MOLECULE_OPTIONS } = require('./config');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.HTMLImageElement = dom.window.HTMLImageElement;

const SmilesDrawer = require('../../app.js');
const SmiDrawer = SmilesDrawer.SmiDrawer;

const sd = new SmiDrawer(MOLECULE_OPTIONS);
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
document.body.appendChild(svg);

const preprocessor = sd.drawer.preprocessor;
const ringManager = preprocessor.ringManager;
const handler = ringManager.bridgedRingHandler;

const captureRingIds = () => ringManager.rings.map((ring) => ring.id);
const captureRingSummary = () => ringManager.rings.map((ring) => ({
    id: ring.id,
    isBridged: !!ring.isBridged,
    members: ring.members.length,
}));

const logs = [];

const originalInitRings = ringManager.initRings.bind(ringManager);
ringManager.initRings = function patchedInitRings(...args) {
    logs.push({ type: 'process:start', rings: captureRingIds() });
    const result = originalInitRings(...args);
    logs.push({ type: 'process:end', rings: captureRingSummary() });
    return result;
};

const originalCreate = handler.createBridgedRing.bind(handler);
handler.createBridgedRing = function patchedCreate(ringIds, sourceVertexId) {
    logs.push({ type: 'create:start', ringIds: ringIds.slice(), sourceVertexId });
    const bridgedRing = originalCreate(ringIds, sourceVertexId);
    logs.push({
        type: 'create:end',
        id: bridgedRing.id,
        members: bridgedRing.members.length,
    });
    return bridgedRing;
};

logs.push({ type: 'beforeInit', rings: captureRingIds() });

sd.draw(SMILES, svg, 'light');

logs.push({ type: 'afterInit', rings: captureRingSummary() });

const positionData = sd.drawer.getPositionData();

const outputInspectPath = path.join(__dirname, 'node-smi-inspect.json');
const outputPositionPath = path.join(__dirname, 'ferrochelate-node.json');

fs.writeFileSync(outputInspectPath, JSON.stringify({ logs, data: positionData }, null, 2));
fs.writeFileSync(outputPositionPath, JSON.stringify(positionData, null, 2));

console.log(`Wrote ${path.relative(process.cwd(), outputPositionPath)}`);
console.log(`Wrote ${path.relative(process.cwd(), outputInspectPath)}`);
