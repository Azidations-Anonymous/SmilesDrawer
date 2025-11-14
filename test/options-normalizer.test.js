const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getLegacyDefaultOptions,
  getDefaultUserOptions
} = require('../src/config/DefaultOptions.js');
const {
  normalizeUserOptions,
  translateLegacyToUser,
  materializeLegacyOptions
} = require('../src/config/OptionsNormalizer.js');

test('normalizeUserOptions() with no input returns default user options', () => {
  const normalized = normalizeUserOptions();
  const defaults = getDefaultUserOptions();

  assert.deepEqual(normalized.canvas, defaults.canvas);
  assert.equal(normalized.rendering.bonds.bondLength, defaults.rendering.bonds.bondLength);
  assert.equal(normalized.meta.version, defaults.meta.version);
  assert.equal(normalized.meta.debugTextOutline, defaults.meta.debugTextOutline);
});

test('normalizeUserOptions() translates legacy options', () => {
  const legacyOverrides = {
    width: 640,
    height: 400,
    scale: 0.25,
    bondLength: 32,
    showAtomAnnotations: true,
    atomAnnotationColor: '#00ff00',
    atomAnnotationFormatter: () => 'hi',
    labelMaskRadiusScale: 0.9,
    labelMaskRadiusScaleWide: 1.2,
    weights: {
      colormap: ['#fff']
    }
  };

  const normalized = normalizeUserOptions(legacyOverrides);

  assert.equal(normalized.canvas.width, 640);
  assert.equal(normalized.canvas.height, 400);
  assert.equal(normalized.canvas.scale, 0.25);
  assert.equal(normalized.rendering.bonds.bondLength, 32);
  assert.equal(normalized.annotations.enabled, true);
  assert.equal(normalized.annotations.color, '#00ff00');
  assert.equal(typeof normalized.annotations.formatter, 'function');
  assert.equal(normalized.annotations.mask.baseScale, 0.9);
  assert.equal(normalized.annotations.mask.wideScale, 1.2);
  assert.deepEqual(normalized.visualizations.weights.colormap, ['#fff']);
});

test('translateLegacyToUser preserves legacy defaults', () => {
  const legacy = getLegacyDefaultOptions();
  legacy.width = 720;
  legacy.debug = true;

  const translated = translateLegacyToUser(legacy);

  assert.equal(translated.canvas.width, 720);
  assert.equal(translated.meta.debug, true);
  assert.equal(translated.rendering.atoms.atomVisualization, legacy.atomVisualization);
  assert.equal(translated.rendering.stereochemistry.isomeric, legacy.isomeric);
  assert.equal(translated.appearance.themes.dark.C, legacy.themes.dark.C);
});

test('materializeLegacyOptions round-trips normalizeUserOptions', () => {
  const userOverrides = {
    canvas: { width: 1024, padding: 20 },
    annotations: { enabled: true }
  };

  const normalized = normalizeUserOptions(userOverrides);
  const legacy = materializeLegacyOptions(normalized);
  const translatedBack = translateLegacyToUser(legacy);

  assert.equal(legacy.width, 1024);
  assert.equal(translatedBack.canvas.width, 1024);
  assert.equal(translatedBack.annotations.enabled, true);
});

test('normalizeUserOptions() merges nested user options', () => {
  const userOverrides = {
    meta: { debug: true },
    canvas: { width: 800 },
    rendering: {
      bonds: { bondLength: 40 }
    },
    layout: {
      graph: { rotationSnapIncrementDeg: 45 }
    },
    annotations: {
      mask: { baseScale: 0.95 }
    }
  };

  const normalized = normalizeUserOptions(userOverrides);

  assert.equal(normalized.meta.debug, true);
  assert.equal(normalized.canvas.width, 800);
  assert.equal(normalized.rendering.bonds.bondLength, 40);
  assert.equal(normalized.layout.graph.rotationSnapIncrementDeg, 45);
  assert.equal(normalized.annotations.mask.baseScale, 0.95);
  assert.equal(normalized.canvas.height, getDefaultUserOptions().canvas.height);
});

test('normalizeUserOptions() converts deprecated ballRadiusBondFraction to pointRadius', () => {
  const userOverrides = {
    rendering: {
      atoms: {
        ballRadiusBondFraction: 0.25
      }
    }
  };

  const normalized = normalizeUserOptions(userOverrides);
  assert.equal(normalized.rendering.atoms.pointRadius, 0.25 * 30);
  assert.equal(
    'ballRadiusBondFraction' in (normalized.rendering.atoms),
    false
  );
});
