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
    measureText() {
      return { width: 7 };
    },
    setTransform() {},
    beginPath() {},
    closePath() {},
    arc() {},
    fill() {},
    stroke() {},
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
