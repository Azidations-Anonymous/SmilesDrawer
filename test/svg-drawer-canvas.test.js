const test = require('node:test');
const assert = require('node:assert/strict');
const { DOMParser } = require('linkedom');

const Parser = require('../src/parsing/Parser');
const SvgDrawer = require('../src/drawing/SvgDrawer');

function ensureDom() {
  if (global.document) {
    return;
  }
  const dom = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
  global.window = dom.defaultView;
  global.document = dom;
  global.SVGElement = window.SVGElement;
  global.HTMLCanvasElement = window.HTMLCanvasElement;
}

test('SvgDrawer.drawCanvas uses user canvas dimensions', () => {
  ensureDom();
  const userOptions = {
    canvas: {
      width: 640,
      height: 480,
      scale: 0,
      padding: 10
    }
  };
  const drawer = new SvgDrawer(userOptions);
  const recorded = [];
  drawer.draw = function (data, targetSvg, ...rest) {
    recorded.push(targetSvg);
    return targetSvg;
  };
  const canvas = document.createElement('canvas');
  const parseTree = Parser.parse('C', {});
  drawer.drawCanvas(parseTree, canvas, 'light', false);
  const svg = recorded[0];
  assert(svg, 'expected temporary svg to be passed to draw');
  assert.equal(svg.getAttribute('viewBox'), '0 0 640 480');
  assert.equal(svg.getAttribute('width'), '640');
  assert.equal(svg.getAttribute('height'), '480');
});
