const test = require('node:test');
const assert = require('node:assert/strict');

const CanvasDrawer = require('../src/drawing/CanvasDrawer');
const ThemeManager = require('../src/config/ThemeManager');
const { getDefaultUserOptions } = require('../src/config/DefaultOptions');

function ensureWindow() {
  if (typeof global.window === 'undefined') {
    global.window = { devicePixelRatio: 1 };
  } else if (typeof global.window.devicePixelRatio === 'undefined') {
    global.window.devicePixelRatio = 1;
  }
}

function createCanvasStub() {
  const calls = [];
  const ctx = {
    font: '',
    lineWidth: 0,
    fillStyle: '#000',
    globalAlpha: 1,
    measureText() {
      return { width: 7 };
    },
    setTransform() {},
    beginPath() {
      calls.push({ type: 'beginPath' });
    },
    closePath() {
      calls.push({ type: 'closePath' });
    },
    arc(x, y, radius) {
      calls.push({ type: 'arc', x, y, radius });
    },
    fill() {
      calls.push({ type: 'fill', fillStyle: this.fillStyle, globalAlpha: this.globalAlpha });
    },
    stroke() {
      calls.push({ type: 'stroke' });
    },
    save() {},
    restore() {}
  };
  const canvas = {
    width: 0,
    height: 0,
    style: {
      width: '',
      height: ''
    },
    getContext() {
      return ctx;
    }
  };
  return { canvas, ctx, calls };
}

test('CanvasDrawer uses typography font family for large/small fonts', () => {
  ensureWindow();
  const { canvas } = createCanvasStub();
  const userOptions = getDefaultUserOptions();
  userOptions.typography.fontFamily = 'Fancy Sans';
  userOptions.typography.fontSizeLarge = 22;
  userOptions.typography.fontSizeSmall = 9;
  const themeManager = new ThemeManager(userOptions.appearance.themes, 'light');
  const drawer = new CanvasDrawer(canvas, themeManager, userOptions, {
    bondLengthSq: 0,
    halfBondSpacing: 0,
    halfFontSizeLarge: 11,
    quarterFontSizeLarge: 5.5,
    fifthFontSizeSmall: 1.8
  });
  assert.equal(drawer.fontLarge, '22pt Fancy Sans');
  assert.equal(drawer.fontSmall, '9pt Fancy Sans');
});

test('CanvasDrawer derives hydrogen and bond thickness from user options', () => {
  ensureWindow();
  const { canvas } = createCanvasStub();
  const userOptions = getDefaultUserOptions();
  userOptions.typography.fontFamily = 'CanvasTest';
  userOptions.rendering.bonds.bondThickness = 3.5;
  const themeManager = new ThemeManager(userOptions.appearance.themes, 'light');
  const derived = {
    bondLengthSq: 900,
    halfBondSpacing: 3,
    halfFontSizeLarge: 10,
    quarterFontSizeLarge: 5,
    fifthFontSizeSmall: 2
  };
  const drawer = new CanvasDrawer(canvas, themeManager, userOptions, derived);
  assert.equal(drawer.halfBondThickness, userOptions.rendering.bonds.bondThickness / 2);
  assert.equal(drawer.hydrogenWidth, 7);
});

test('CanvasDrawer drawAtomHighlight uses appearance configuration', () => {
  ensureWindow();
  const { canvas, calls } = createCanvasStub();
  const userOptions = getDefaultUserOptions();
  userOptions.appearance.highlights.fallbackColor = '#ff00ff';
  userOptions.appearance.highlights.fallbackRadiusFactor = 0.4;
  userOptions.rendering.bonds.bondLength = 50;
  delete userOptions.appearance.themes.light.HIGHLIGHT;
  const themeManager = new ThemeManager(userOptions.appearance.themes, 'light');
  const drawer = new CanvasDrawer(canvas, themeManager, userOptions, {
    bondLengthSq: 0,
    halfBondSpacing: 0,
    halfFontSizeLarge: 10,
    quarterFontSizeLarge: 5,
    fifthFontSizeSmall: 2
  });

  calls.length = 0;
  drawer.drawAtomHighlight(10, 20);
  const arcCall = calls.find((call) => call.type === 'arc');
  assert(arcCall, 'expected highlight arc call');
  assert.equal(arcCall.radius, userOptions.appearance.highlights.fallbackRadiusFactor * userOptions.rendering.bonds.bondLength);
  const fillCall = calls.find((call) => call.type === 'fill');
  assert.equal(fillCall.fillStyle, '#ff00ff');
  assert.equal(fillCall.globalAlpha, 0.65);
});

test('CanvasDrawer drawAtomHighlight uses theme highlight color when available', () => {
  ensureWindow();
  const { canvas, calls } = createCanvasStub();
  const userOptions = getDefaultUserOptions();
  userOptions.appearance.themes.light.HIGHLIGHT = '#13579b';
  userOptions.rendering.bonds.bondLength = 40;
  const themeManager = new ThemeManager(userOptions.appearance.themes, 'light');
  const drawer = new CanvasDrawer(canvas, themeManager, userOptions, {
    bondLengthSq: 0,
    halfBondSpacing: 0,
    halfFontSizeLarge: 10,
    quarterFontSizeLarge: 5,
    fifthFontSizeSmall: 2
  });

  calls.length = 0;
  drawer.drawAtomHighlight(5, 5);
  const fillCall = calls.find((call) => call.type === 'fill');
  assert.equal(fillCall.fillStyle, '#13579b');
});
