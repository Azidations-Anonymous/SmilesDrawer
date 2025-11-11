const test = require('node:test');
const assert = require('node:assert/strict');

const MathHelper = require('../src/utils/MathHelper');
const { getDefaultUserOptions } = require('../src/config/DefaultOptions');
const OverlapResolutionManager = require('../src/preprocessing/OverlapResolutionManager');

test('getFinetuneRotationConfig reflects user rotation preferences', () => {
  const defaultsA = getDefaultUserOptions();
  let config = OverlapResolutionManager.getFinetuneRotationConfig(defaultsA);
  assert.equal(config.stepsPerRotation, 12);
  assert(Math.abs(config.stepAngleRad - MathHelper.toRad(30)) < 1e-9);
  assert(Math.abs(config.finalOffsetRad - MathHelper.toRad(1)) < 1e-9);

  const custom = getDefaultUserOptions();
  custom.layout.graph.rotationSnapIncrementDeg = 45;
  custom.layout.graph.finetuneRotationOffsetDeg = 2.5;
  config = OverlapResolutionManager.getFinetuneRotationConfig(custom);
  assert.equal(config.stepsPerRotation, 8);
  assert(Math.abs(config.stepAngleRad - MathHelper.toRad(45)) < 1e-9);
  assert(Math.abs(config.finalOffsetRad - MathHelper.toRad(2.5)) < 1e-9);
});

test('resolveSecondaryOverlaps uses terminal push angle option', () => {
  const pushDeg = 42;
  const fakePosition = {
    rotateAwayFrom(_closest, _previous, angle) {
      fakePosition.lastAngle = angle;
    },
    lastAngle: null
  };
  const vertex = {
    id: 0,
    position: fakePosition,
    previousPosition: { x: 0, y: 0 },
    isTerminal() {
      return true;
    }
  };
  const drawer = {
    graph: {
      vertices: [
        vertex,
        { position: { x: 1, y: 1 } }
      ]
    },
    userOpts: {
      layout: {
        graph: {
          overlapSensitivity: 0.1
        },
        overlap: {
          terminalPushAngleDeg: pushDeg
        }
      }
    },
    getClosestVertex() {
      return {
        id: 2,
        isTerminal() {
          return true;
        },
        position: { x: 2, y: 2 },
        previousPosition: { x: 3, y: 3 }
      };
    }
  };

  const manager = new OverlapResolutionManager(drawer);
  const scores = [{ id: 0, score: 1 }];
  manager.resolveSecondaryOverlaps(scores);
  assert(Math.abs(fakePosition.lastAngle - MathHelper.toRad(pushDeg)) < 1e-9);
});
