const test = require('node:test');
const assert = require('node:assert/strict');

const CanvasPrimitiveDrawer = require('../src/drawing/draw/CanvasPrimitiveDrawer');
const CanvasWedgeDrawer = require('../src/drawing/draw/CanvasWedgeDrawer');
const Vector2 = require('../src/graph/Vector2');

function createCanvasWrapper(overrides = {}) {
  const ctxCalls = [];
  const ctx = {
    font: '',
    lineWidth: 0,
    lineCap: '',
    strokeStyle: '',
    setLineDash() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fill() {},
    closePath() {},
    save() {},
    restore() {},
    arc() {},
    measureText() {
      return { width: 7 };
    },
    createLinearGradient() {
      return { addColorStop() {} };
    },
    createRadialGradient() {
      return { addColorStop() {} };
    }
  };
  return {
    ctx,
    offsetX: 0,
    offsetY: 0,
    halfBondThickness: 1,
    themeManager: {
      getColor: () => '#000'
    },
    userOpts: {
      rendering: {
        bonds: {
          bondThickness: 2,
          bondLength: 40,
          dashedInsetPx: 2,
          dashedStepFactor: 1.2,
          dashedWidthFactorCanvas: 0.5,
          dashedColorSwitchThreshold: 0.4,
          dashedWedgeSpacingMultiplier: 3,
          dashPattern: [3, 2],
          tripleBondSpacingDivider: 1.5,
          bondSpacing: 6
        },
        stereochemistry: {
          shadowShortenPx: 8,
          wedgeTipPaddingPx: 3,
          wedgeSidePaddingPx: 1
        }
      }
    },
    ...overrides
  };
}

function createLineStub() {
  const from = new Vector2(0, 0);
  const to = new Vector2(10, 0);
  const shortenArgs = [];
  const stub = {
    from,
    to,
    shortenArgs,
    clone() {
      return {
        shorten(value) {
          shortenArgs.push(value);
          return this;
        },
        getLeftVector() {
          return from.clone();
        },
        getRightVector() {
          return to.clone();
        }
      };
    },
    getLeftVector() {
      return from.clone();
    },
    getRightVector() {
      return to.clone();
    },
    getLeftElement() {
      return 'C';
    },
    getRightElement() {
      return 'C';
    },
    getLength() {
      return to.clone().subtract(from).length();
    },
    getRightChiral() {
      return false;
    }
  };
  return stub;
}

test('CanvasPrimitiveDrawer uses shadowShortenPx for line shadows', () => {
  const wrapper = createCanvasWrapper({
    userOpts: {
      rendering: {
        bonds: {
          bondThickness: 2,
          bondLength: 40,
          dashedInsetPx: 2,
          dashedStepFactor: 1.2,
          dashedWidthFactorCanvas: 0.5,
          dashedColorSwitchThreshold: 0.4,
          dashedWedgeSpacingMultiplier: 3,
          dashPattern: [3, 2],
          tripleBondSpacingDivider: 1.5,
          bondSpacing: 6
        },
        stereochemistry: {
          shadowShortenPx: 12,
          wedgeTipPaddingPx: 3,
          wedgeSidePaddingPx: 1
        }
      }
    }
  });
  const line = createLineStub();
  const drawer = new CanvasPrimitiveDrawer(wrapper);
  drawer.drawLine(line, false);
  assert.equal(line.shortenArgs[0], 12);
});

function createDashedLineStub(isRightChiral = false) {
  const from = new Vector2(0, 0);
  const to = new Vector2(10, 0);
  const stub = {
    from,
    to,
    shortenRightArgs: [],
    shortenLeftArgs: [],
    clone() {
      return {
        shortenRight(value) {
          stub.shortenRightArgs.push(value);
          return this;
        },
        shortenLeft(value) {
          stub.shortenLeftArgs.push(value);
          return this;
        },
        getLeftVector: () => from.clone(),
        getRightVector: () => to.clone()
      };
    },
    getLeftVector: () => from.clone(),
    getRightVector: () => to.clone(),
    getLeftElement: () => 'C',
    getRightElement: () => 'C',
    getLength: () => to.clone().subtract(from).length(),
    getRightChiral: () => isRightChiral
  };
  return stub;
}

test('CanvasWedgeDrawer uses dashedInsetPx for dashed wedges', () => {
  const wrapper = createCanvasWrapper({
    userOpts: {
      rendering: {
        bonds: {
          bondThickness: 2,
          bondLength: 40,
          dashedInsetPx: 3,
          dashedStepFactor: 1,
          dashedWidthFactorCanvas: 0.5,
          dashedColorSwitchThreshold: 0.4,
          dashedWedgeSpacingMultiplier: 3,
          dashPattern: [3, 2],
          tripleBondSpacingDivider: 1.5,
          bondSpacing: 6
        },
        stereochemistry: {
          wedgeTipPaddingPx: 0,
          wedgeSidePaddingPx: 0,
          shadowShortenPx: 8
        }
      }
    }
  });
  const drawer = new CanvasWedgeDrawer(wrapper);
  const rightLine = createDashedLineStub(true);
  const leftLine = createDashedLineStub(false);
  drawer.drawDashedWedge(rightLine);
  drawer.drawDashedWedge(leftLine);
  assert(rightLine.shortenRightArgs.includes(3));
  assert(leftLine.shortenLeftArgs.includes(3));
});
