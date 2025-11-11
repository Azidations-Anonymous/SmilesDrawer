const test = require('node:test');
const assert = require('node:assert/strict');

const CanvasTextDrawer = require('../src/drawing/draw/CanvasTextDrawer');

function createContextRecorder() {
  const calls = [];
  const ctx = {
    font: '',
    textAlign: '',
    textBaseline: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    setTransform() {},
    scale() {},
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fill() {},
    setLineDash() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    arc(x, y, radius) {
      calls.push({
        type: 'arc',
        x,
        y,
        radius,
        op: this.globalCompositeOperation
      });
    },
    fillText(text, x, y) {
      calls.push({ type: 'fillText', text, x, y, font: this.font });
    },
    measureText(text) {
      const width = text.length * 5;
      return {
        width,
        actualBoundingBoxLeft: 1,
        actualBoundingBoxRight: 1,
        actualBoundingBoxAscent: 4
      };
    }
  };
  return { ctx, calls };
}

function createWrapper(overrides = {}) {
  const { ctx, calls } = createContextRecorder();
  const wrapper = {
    ctx,
    offsetX: 0,
    offsetY: 0,
    fontLarge: '20pt CanvasFont',
    fontSmall: '10pt CanvasFont',
    hydrogenWidth: 8,
    halfHydrogenWidth: 4,
    themeManager: {
      getColor: () => '#000'
    },
    userOpts: {
      typography: {
        fontFamily: 'CanvasFont',
        fontSizeLarge: 20,
        fontSizeSmall: 10
      },
      annotations: {
        mask: {
          canvasRadiusFactor: 0.5
        }
      }
    },
    derivedOpts: {
      halfFontSizeLarge: 10,
      quarterFontSizeLarge: 5,
      fifthFontSizeSmall: 2
    },
  };
  return { wrapper: { ...wrapper, ...overrides }, calls };
}

function getMaskRadius(calls) {
  const maskArc = calls.find((call) => call.type === 'arc' && call.op === 'destination-out');
  return maskArc?.radius;
}

test('CanvasTextDrawer scales mask radius with canvasRadiusFactor', () => {
  const { wrapper, calls } = createWrapper({
    userOpts: {
      typography: {
        fontFamily: 'CanvasFont',
        fontSizeLarge: 24,
        fontSizeSmall: 12
      },
      annotations: {
        mask: {
          canvasRadiusFactor: 0.4
        }
      }
    }
  });
  const drawer = new CanvasTextDrawer(wrapper);
  drawer.drawText(0, 0, 'C', 0, 'right', true, 0, 0, 2);
  const radius = getMaskRadius(calls);
  assert(radius);
  assert.equal(radius, Math.max(5, 24) * 0.4);
});

test('CanvasTextDrawer falls back to default mask factor when unset', () => {
  const { wrapper, calls } = createWrapper({
    userOpts: {
      typography: {
        fontFamily: 'CanvasFont',
        fontSizeLarge: 18,
        fontSizeSmall: 9
      },
      annotations: {
        mask: {}
      }
    }
  });
  const drawer = new CanvasTextDrawer(wrapper);
  drawer.drawText(0, 0, 'C', 0, 'right', true, 0, 0, 2);
  const radius = getMaskRadius(calls);
  assert(radius);
  assert.equal(radius, Math.max(5, 18) * (2 / 3));
});
