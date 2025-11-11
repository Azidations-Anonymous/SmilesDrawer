const test = require('node:test');
const assert = require('node:assert/strict');
const { DOMParser } = require('linkedom');

const SmilesDrawer = require('../src/SmilesDrawer');

function ensureDom() {
  if (global.document) {
    return;
  }
  const dom = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
  global.window = dom.defaultView;
  global.document = dom;
  global.SVGElement = window.SVGElement;
  global.HTMLCanvasElement = window.HTMLCanvasElement;
  global.HTMLImageElement = window.HTMLImageElement;
}

test('SmilesDrawer.getDimensions falls back to user canvas size when scale disabled', () => {
  ensureDom();
  const drawer = new SmilesDrawer({ canvas: { width: 420, height: 280, scale: 0 } });
  const canvas = document.createElement('canvas');
  const dims = drawer.getDimensions(canvas);
  assert.equal(dims.w, 420);
  assert.equal(dims.h, 280);
});

test('SmilesDrawer.getDimensions prefers element style when scale disabled', () => {
  ensureDom();
  const drawer = new SmilesDrawer({ canvas: { width: 100, height: 100, scale: 0 } });
  const canvas = document.createElement('canvas');
  canvas.style.width = '512px';
  canvas.style.height = '256px';
  const dims = drawer.getDimensions(canvas);
  assert.equal(dims.w, 512);
  assert.equal(dims.h, 256);
});

test('SmilesDrawer.getDimensions reads SVG style when scale enabled', () => {
  ensureDom();
  const drawer = new SmilesDrawer({ canvas: { width: 100, height: 100, scale: 2 } });
  const canvas = document.createElement('canvas');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.width = '800px';
  svg.style.height = '600px';
  const dims = drawer.getDimensions(canvas, svg);
  assert.equal(dims.w, 800);
  assert.equal(dims.h, 600);
});
