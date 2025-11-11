const test = require('node:test');
const assert = require('node:assert/strict');
const { DOMParser } = require('linkedom');

const OptionsManager = require('../src/config/OptionsManager');
const ThemeManager = require('../src/config/ThemeManager');
const SvgWrapper = require('../src/drawing/SvgWrapper');
const SvgLabelRenderer = require('../src/drawing/renderers/SvgLabelRenderer');

const dom = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
global.window = dom.defaultView;
global.document = dom;
global.SVGElement = window.SVGElement;
global.HTMLElement = window.HTMLElement;
global.Node = window.Node;

function createWrapper(customOptions = {}) {
  const manager = new OptionsManager({ canvas: {}, ...customOptions });
  const themeManager = new ThemeManager(manager.userOpts.appearance.themes, 'dark');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  return {
    manager,
    wrapper: new SvgWrapper(themeManager, svg, manager.userOpts, manager.derivedOpts, true)
  };
}

test('SvgWrapper respects atom sizing options', () => {
  const { manager, wrapper } = createWrapper({
    rendering: {
      bonds: { bondLength: 40 },
      atoms: {
        pointRadius: 2.5,
        pointMaskRadius: 4.5,
        ballRadiusBondFraction: 0.4
      }
    },
    appearance: {
      highlights: {
        fallbackColor: '#123456',
        fallbackRadiusFactor: 0.33
      }
    }
  });

  wrapper.drawPoint(0, 0, 'C');
  const maskCircle = wrapper.maskElements.at(-1);
  const pointCircle = wrapper.vertices.at(-1);
  assert.equal(pointCircle.getAttribute('r'), '2.5');
  assert.equal(maskCircle.getAttribute('r'), '4.5');

  wrapper.drawAtomHighlight(1, 1);
  const highlight = wrapper.highlights.at(-1);
  const expectedRadius = (manager.userOpts.appearance.highlights.fallbackRadiusFactor * manager.userOpts.rendering.bonds.bondLength).toString();
  assert.equal(highlight.getAttribute('r'), expectedRadius);
  assert.equal(highlight.getAttribute('fill'), '#123456');
});

test('SvgWrapper uses annotation mask scales', () => {
  const { manager, wrapper } = createWrapper({
    annotations: {
      mask: {
        baseScale: 0.9,
        wideScale: 1.4,
        canvasRadiusFactor: 0.6
      }
    }
  });

  // primary label with satellites -> wide mask
  (wrapper)['createLabelMask'](0, 0, { display: 'C', element: 'C', kind: 'primary' }, true);
  const mask = wrapper.maskElements.at(-1);
  const expected = (manager.userOpts.typography.fontSizeLarge * manager.userOpts.annotations.mask.wideScale).toString();
  assert.equal(mask.getAttribute('r'), expected);
});

test('SvgWrapper draws dashed polygons using configured dash pattern', () => {
  const { manager, wrapper } = createWrapper({
    rendering: {
      bonds: {
        dashPattern: [7, 1],
        bondThickness: 2
      }
    }
  });

  wrapper.drawDashedPolygon([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]);
  const path = wrapper.paths.at(-1);
  assert(path, 'Expected dashed polygon path to be created');
  assert.equal(path.getAttribute('stroke-dasharray'), manager.userOpts.rendering.bonds.dashPattern.join(','));
  assert.equal(path.getAttribute('stroke-width'), manager.userOpts.rendering.bonds.bondThickness.toString());
});

test('SvgLabelRenderer uses typography defaults', () => {
  const manager = new OptionsManager({
    canvas: {},
    typography: {
      fontFamily: 'TestFamily',
      fontSizeLarge: 22,
      labelOutlineWidth: 1.5
    }
  });
  const renderer = new SvgLabelRenderer(manager.userOpts, () => '#abcdef');
  const label = renderer.drawPrimaryLabel(5, 5, 'C', '#123456');
  assert.equal(label.getAttribute('font-size'), '22pt');
  assert.equal(label.getAttribute('font-family'), 'TestFamily');
  assert.equal(label.getAttribute('stroke-width'), '1.5');
  assert.equal(label.getAttribute('stroke'), '#abcdef');
});
