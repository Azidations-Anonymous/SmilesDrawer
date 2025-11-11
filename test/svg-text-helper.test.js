const test = require('node:test');
const assert = require('node:assert/strict');
const { DOMParser } = require('linkedom');

const SvgTextHelper = require('../src/drawing/helpers/SvgTextHelper');
const ThemeManager = require('../src/config/ThemeManager');
const { getDefaultUserOptions } = require('../src/config/DefaultOptions');

function ensureDomWithCanvasStub() {
  if (global.document && global.document.__canvasStubbed) {
    return;
  }
  const dom = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
  const originalCreateElement = dom.createElement.bind(dom);
  dom.createElement = function(tagName, ...args) {
    if (String(tagName).toLowerCase() === 'canvas') {
      return {
        getContext() {
          return {
            font: '',
            measureText() {
              return {
                width: 10,
                actualBoundingBoxLeft: 1,
                actualBoundingBoxRight: 1,
                actualBoundingBoxAscent: 2
              };
            }
          };
        }
      };
    }
    return originalCreateElement(tagName, ...args);
  };
  dom.__canvasStubbed = true;
  global.window = dom.defaultView;
  global.document = dom;
  global.SVGElement = window.SVGElement;
  global.HTMLElement = window.HTMLElement;
  global.Node = window.Node;
}

test('SvgTextHelper.measureText applies custom line height', () => {
  ensureDomWithCanvasStub();
  const metrics = SvgTextHelper.measureText('Example', 10, 'Arial', 1.5);
  assert.equal(metrics.height, 6);
});

test('SvgTextHelper.writeText spaces tspans using provided line height', () => {
  ensureDomWithCanvasStub();
  const options = getDefaultUserOptions();
  const themeManager = new ThemeManager(options.appearance.themes, 'light');
  const { svg } = SvgTextHelper.writeText('foo\nbar', themeManager, 10, 'Arial', Number.MAX_SAFE_INTEGER, 1.5);
  const tspans = Array.from(svg.querySelectorAll('tspan'));
  assert.equal(tspans.length, 2);
  const firstY = parseFloat(tspans[0].getAttribute('y') || '0');
  const secondY = parseFloat(tspans[1].getAttribute('y') || '0');
  assert.equal(firstY, 6);
  assert.equal(secondY, 12);
});
