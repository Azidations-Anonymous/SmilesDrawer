const test = require('node:test');
const assert = require('node:assert/strict');
const { DOMParser } = require('linkedom');

const ReactionDrawer = require('../src/reactions/ReactionDrawer');
const Reaction = require('../src/reactions/Reaction');
const { getDefaultUserOptions } = require('../src/config/DefaultOptions');

function ensureDom() {
  if (global.document) {
    return;
  }
  const dom = new DOMParser().parseFromString('<html><body></body></html>', 'text/html');
  global.window = dom.defaultView;
  global.document = dom;
  global.SVGElement = window.SVGElement;
  global.HTMLElement = window.HTMLElement;
  global.Node = window.Node;
}

test('ReactionDrawer derives render defaults from IUserOptions', () => {
  ensureDom();
  const userOptions = getDefaultUserOptions();
  userOptions.canvas.scale = 2;
  userOptions.rendering.bonds.bondLength = 60;
  userOptions.rendering.bonds.bondThickness = 1.5;
  userOptions.typography.fontSizeLarge = 30;

  const drawer = new ReactionDrawer({}, userOptions);

  assert.equal(drawer.opts.scale, 2);
  assert.equal(drawer.opts.fontSize, 24);
  assert.equal(drawer.opts.spacing, 60 * (10 / 30));
  assert.equal(drawer.opts.plus.size, 60 * (9 / 30));
  assert.equal(drawer.opts.plus.thickness, 1.5);
  assert.equal(drawer.opts.arrow.length, 60 * 4);
  assert.equal(drawer.opts.arrow.headSize, 60 * (6 / 30));
  assert.equal(drawer.opts.arrow.thickness, 1.5);
  assert.equal(drawer.opts.arrow.margin, 60 * (3 / 30));
});

test('ReactionDrawer uses custom typography for reagents text', () => {
  ensureDom();
  const userOptions = getDefaultUserOptions();
  userOptions.rendering.bonds.bondLength = 40;
  userOptions.rendering.bonds.bondThickness = 2;
  userOptions.typography.fontFamily = 'ChemFont';
  userOptions.typography.fontSizeLarge = 28;
  userOptions.reactions.font.family = 'ReagentFont';

  const drawer = new ReactionDrawer({}, userOptions);
  const reaction = new Reaction('CC>O>CC');
  const svg = drawer.draw(reaction, null, 'light', null, '{reagents}', 'Yield 90%');

  const textStyles = Array.from(svg.querySelectorAll('style')).filter((style) =>
    style.textContent.includes('.text')
  );
  assert(textStyles.length > 0);
  textStyles.forEach((style) => {
    assert(style.textContent.includes('ReagentFont'));
    assert(style.textContent.includes(`${drawer.opts.fontSize}pt`));
  });

  const arrowLine = svg.querySelector('#arrow line');
  assert(arrowLine);
  assert.equal(Number(arrowLine.getAttribute('stroke-width')), drawer.opts.arrow.thickness);
});

test('ReactionDrawer honours reaction geometry multipliers', () => {
  ensureDom();
  const userOptions = getDefaultUserOptions();
  userOptions.rendering.bonds.bondLength = 50;
  userOptions.rendering.bonds.bondThickness = 2;
  userOptions.reactions.spacing.bondLengthMultiplier = 0.5;
  userOptions.reactions.plus.sizeBondLengthMultiplier = 0.4;
  userOptions.reactions.plus.thicknessBondThicknessMultiplier = 1.5;
  userOptions.reactions.arrow.lengthBondLengthMultiplier = 5;
  userOptions.reactions.arrow.headSizeBondLengthMultiplier = 0.25;
  userOptions.reactions.arrow.thicknessBondThicknessMultiplier = 0.5;
  userOptions.reactions.arrow.marginBondLengthMultiplier = 0.2;

  const drawer = new ReactionDrawer({}, userOptions);

  assert.equal(drawer.opts.spacing, 25);
  assert.equal(drawer.opts.plus.size, 20);
  assert.equal(drawer.opts.plus.thickness, 3);
  assert.equal(drawer.opts.arrow.length, 250);
  assert.equal(drawer.opts.arrow.headSize, 12.5);
  assert.equal(drawer.opts.arrow.thickness, 1);
  assert.equal(drawer.opts.arrow.margin, 10);
});

test('ReactionDrawer uses reaction-specific scale and weight defaults', () => {
  ensureDom();
  const userOptions = getDefaultUserOptions();
  userOptions.canvas.scale = 0;
  userOptions.reactions.scale = 1.75;
  userOptions.reactions.weights.normalize = true;

  const drawer = new ReactionDrawer({}, userOptions);
  assert.equal(drawer.opts.scale, 1.75);
  assert.equal(drawer.opts.weights.normalize, true);
});
