const test = require('node:test');
const assert = require('node:assert/strict');
const { DOMParser } = require('linkedom');

const OptionsManager = require('../src/config/OptionsManager');
const ThemeManager = require('../src/config/ThemeManager');
const SvgWrapper = require('../src/drawing/SvgWrapper');
const SvgLabelRenderer = require('../src/drawing/renderers/SvgLabelRenderer');
const SvgDrawer = require('../src/drawing/SvgDrawer');
const SvgVertexDrawer = require('../src/drawing/draw/SvgVertexDrawer');
const Parser = require('../src/parsing/Parser');

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

function layoutGraph(smiles, optionOverrides = {}) {
  const manager = new OptionsManager({ canvas: {}, ...optionOverrides });
  const drawer = new SvgDrawer(manager.userOpts);
  const tree = Parser.parse(smiles, {});
  drawer.draw(tree, null, 'light', null, false, [], false);
  return { drawer, graph: drawer.preprocessor.graph };
}

function measureTripleOffset(divider) {
  ensureDom();
  const captured = [];
  const originalDrawLine = SvgWrapper.prototype.drawLine;
  SvgWrapper.prototype.drawLine = function(line, ...rest) {
    captured.push(line.clone());
    return originalDrawLine.call(this, line, ...rest);
  };
  try {
    const manager = new OptionsManager({
      canvas: {},
      rendering: { bonds: { tripleBondSpacingDivider: divider } }
    });
    const drawer = new SvgDrawer(manager.userOpts);
    const tree = Parser.parse('C#C', {});
    drawer.draw(tree, null, 'light');
  } finally {
    SvgWrapper.prototype.drawLine = originalDrawLine;
  }

  if (captured.length !== 3) {
    throw new Error(`Expected three bond lines, saw ${captured.length}`);
  }

  const yValues = captured
    .map(line => line.getLeftVector().y)
    .sort((a, b) => a - b);
  const center = yValues[1];
  const outer = yValues[2];
  return Math.abs(outer - center);
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

test('SvgDrawer applies user padding increase when weights are supplied', () => {
  const manager = new OptionsManager({ canvas: { padding: 15 } });
  const drawer = new SvgDrawer(manager.userOpts);
  const basePadding = drawer.userOpts.canvas.padding;
  const additionalPadding = 25;
  drawer.userOpts.visualizations.weights.additionalPadding = additionalPadding;
  drawer.opts.weights.additionalPadding = 0;

  const recordings = [];
  const originalInitDraw = drawer.preprocessor.initDraw.bind(drawer.preprocessor);
  drawer.preprocessor.initDraw = function (...args) {
    recordings.push({
      userPadding: drawer.userOpts.canvas.padding,
      legacyPadding: drawer.opts.padding
    });
    return originalInitDraw(...args);
  };

  const data = Parser.parse('CC', {});
  drawer.draw(data, null, 'light', null, false, [], false);
  drawer.draw(data, null, 'light', [0.1, 0.2], false, [], false);

  assert.equal(recordings.length, 2);
  assert.equal(recordings[0].userPadding, basePadding);
  assert.equal(recordings[0].legacyPadding, basePadding);
  assert.equal(recordings[1].userPadding, basePadding + additionalPadding);
  assert.equal(recordings[1].legacyPadding, basePadding + additionalPadding);
  assert.equal(drawer.userOpts.canvas.padding, basePadding);
  assert.equal(drawer.opts.padding, basePadding);
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

test('centerOfMassRadiusFactor limits neighbourhood averaging', () => {
  const measureCenter = (factor) => {
    const { drawer, graph } = layoutGraph('CC', { layout: { graph: { centerOfMassRadiusFactor: factor } } });
    const left = graph.vertices[0];
    const right = graph.vertices[1];
    left.position.x = 0;
    left.position.y = 0;
    right.position.x = 100;
    right.position.y = 0;
    left.positioned = true;
    right.positioned = true;
    return drawer.preprocessor.getCurrentCenterOfMassInNeigbourhood(left.position).x;
  };

  const localAverage = measureCenter(1.2);
  const wideAverage = measureCenter(5);

  assert(Math.abs(localAverage) < 1e-6, 'Local radius should ignore distant vertices');
  assert(Math.abs(wideAverage - 50) < 1e-6, 'Wide radius should include distant vertices');
});

test('defaultBranchAngleRad steers branch layout', () => {
  const measureBranchAngle = (angleRad) => {
    const { graph } = layoutGraph('C(Cl)C', { layout: { graph: { defaultBranchAngleRad: angleRad } } });
    const center = graph.vertices.find((vertex) => vertex.neighbours.length === 2);
    const neighbours = center.neighbours.map((id) => graph.vertices[id]);
    const branch = neighbours.find((vertex) => vertex.value.element === 'Cl');
    const chain = neighbours.find((vertex) => vertex.value.element === 'C');

    const toBranch = {
      x: branch.position.x - center.position.x,
      y: branch.position.y - center.position.y
    };
    const toChain = {
      x: chain.position.x - center.position.x,
      y: chain.position.y - center.position.y
    };
    const dot = toBranch.x * toChain.x + toBranch.y * toChain.y;
    const magProduct = Math.hypot(toBranch.x, toBranch.y) * Math.hypot(toChain.x, toChain.y);
    return Math.acos(dot / magProduct);
  };

  const sixty = Math.PI / 3;
  const ninety = Math.PI / 2;
  const angleSixty = measureBranchAngle(sixty);
  const angleNinety = measureBranchAngle(ninety);

  assert(Math.abs(angleSixty - sixty) < 1e-3);
  assert(Math.abs(angleNinety - ninety) < 1e-3);
});

test('linearBondToleranceRad toggles nearly-linear point rendering', () => {
  const countPoints = (tolerance) => {
    const { drawer, graph } = layoutGraph('CCC', { layout: { graph: { linearBondToleranceRad: tolerance } } });
    const vertex = graph.vertices.find((v) => v.neighbours.length === 2);
    const [leftId, rightId] = vertex.neighbours;
    const left = graph.vertices[leftId];
    const right = graph.vertices[rightId];

    graph.vertices.forEach((v) => { v.forcePositioned = false; });
    left.position.x = 0;
    left.position.y = 0;
    vertex.position.x = 5;
    vertex.position.y = 0;
    right.position.x = 10;
    right.position.y = 0.5;
    left.value.isDrawn = true;
    right.value.isDrawn = true;
    vertex.forcePositioned = true;

    const calls = { points: 0 };
    const renderer = {
      drawBall() {},
      drawText() {},
      drawPoint() { calls.points += 1; },
      drawAnnotation() {},
      drawDebugText() {},
      drawDebugPoint() {}
    };
    const fakeDrawer = {
      preprocessor: drawer.preprocessor,
      userOpts: drawer.userOpts,
      getRenderer: () => renderer
    };
    const vertexDrawer = new SvgVertexDrawer(fakeDrawer);
    vertexDrawer.drawVertices(false);
    return calls.points;
  };

  const strict = countPoints(0.05);
  const lenient = countPoints(0.2);

  assert.equal(strict, 0);
  assert.equal(lenient, 1);
});

test('tripleBondSpacingDivider controls offset distance', () => {
  const wide = measureTripleOffset(1.5);
  const tight = measureTripleOffset(3);
  assert(wide > tight, `expected wider offset (${wide}) to exceed tighter spacing (${tight})`);
});
