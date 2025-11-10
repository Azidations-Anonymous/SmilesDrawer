#!/usr/bin/env node

/**
 * @file Generates SVG representation of molecular structures from SMILES strings.
 *        Provides both a reusable helper (renderSvg) and a CLI entry point.
 */

const { parseHTML } = require('linkedom');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

const { createMoleculeOptions } = require('./molecule-options');

let domInitialized = false;
let cachedSmilesDrawer = null;

function ensureDom() {
  if (domInitialized) {
    return;
  }

  const { window } = parseHTML('<!DOCTYPE html><html><body></body></html>');
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
  global.HTMLElement = window.HTMLElement;
  global.SVGElement = window.SVGElement;
  global.HTMLCanvasElement = window.HTMLCanvasElement;
  global.HTMLImageElement = window.HTMLImageElement;
  global.Element = window.Element;
  global.Node = window.Node;
  global.DOMParser = window.DOMParser;
  global.XMLSerializer = window.XMLSerializer;
  domInitialized = true;
}

function getSmilesDrawer() {
  if (!cachedSmilesDrawer) {
    cachedSmilesDrawer = require('../app.js');
  }
  return cachedSmilesDrawer;
}

function formatLogArg(arg) {
  if (typeof arg === 'string') {
    return arg;
  }
  try {
    return JSON.stringify(arg);
  } catch (err) {
    return String(arg);
  }
}

/**
 * Render a SMILES string to SVG.
 * @param {string} smiles
 * @param {object} [options]
 * @param {boolean} [options.kekulize=false]
 * @param {string} [options.theme='light']
 * @param {object} [options.moleculeOptions] - Additional option overrides.
 * @param {(msg: string) => void} [options.onLog] - Called for every console.log emitted by SmilesDrawer during draw.
 * @param {boolean} [options.captureLogs=true] - Disable to skip console capture entirely.
 * @returns {Promise<{svg: string, logs: string[], timings: {parse: number, draw: number, total: number}}>}
 */
async function renderSvg(smiles, options = {}) {
  if (!smiles) {
    throw new Error('SMILES string is required');
  }

  ensureDom();
  const SmilesDrawer = getSmilesDrawer();
  const mergedOptions = createMoleculeOptions({ ...(options.moleculeOptions || {}) });
  const theme = options.theme || 'light';
  const captureLogs = options.captureLogs !== false;
  const logs = [];

  const totalStart = performance.now();

  return new Promise((resolve, reject) => {
    const svgDrawer = new SmilesDrawer.SvgDrawer(mergedOptions);
    const parseStart = performance.now();

    SmilesDrawer.parse(
      smiles,
      (tree) => {
        const parseEnd = performance.now();

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('width', String(mergedOptions.width));
        svg.setAttribute('height', String(mergedOptions.height));
        svg.setAttribute('data-kekulize-mode', String(!!options.kekulize));

        const runDraw = () => {
          svgDrawer.draw(tree, svg, theme, !!options.debug);
        };

        const capture = captureLogs && typeof console !== 'undefined';
        const originalConsoleLog = capture ? console.log : null;
        const emitLog = (message) => {
          logs.push(message);
          if (typeof options.onLog === 'function') {
            options.onLog(message);
          }
        };

        let drawStart = performance.now();
        let drawEnd;

        if (capture) {
          console.log = (...args) => {
            const message = args.map(formatLogArg).join(' ');
            emitLog(message);
            originalConsoleLog(...args);
          };
        }

        try {
          runDraw();
          drawEnd = performance.now();
        } catch (err) {
          if (capture) {
            console.log = originalConsoleLog;
          }
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        } finally {
          if (capture) {
            console.log = originalConsoleLog;
          }
        }

        const timings = {
          parse: parseEnd - parseStart,
          draw: drawEnd - drawStart,
          total: performance.now() - totalStart
        };

        resolve({
          svg: svg.outerHTML,
          logs,
          timings
        });
      },
      (err) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    );
  });
}

function parseBooleanFlag(value, flagName) {
  if (value === undefined) {
    throw new Error(`${flagName} flag requires a value`);
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }
  throw new Error(`Invalid boolean value for ${flagName}: ${value}`);
}

async function runCli() {
  const rawArgs = process.argv.slice(2);
  const positionals = [];
  let kekulizeMode = false;

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === '--kekulize') {
      kekulizeMode = parseBooleanFlag(rawArgs[i + 1], '--kekulize');
      i += 1;
      continue;
    }
    if (arg.startsWith('--kekulize=')) {
      kekulizeMode = parseBooleanFlag(arg.split('=')[1], '--kekulize');
      continue;
    }
    positionals.push(arg);
  }

  const smilesInput = positionals[0];
  const outputFile = positionals[1];

  if (!smilesInput) {
    console.error('ERROR: No SMILES string provided');
    console.error('Usage: node generate-svg.js [--kekulize=true|false] "<SMILES>" [output-file]');
    process.exit(2);
  }

  try {
    const { svg } = await renderSvg(smilesInput, { kekulize: kekulizeMode, captureLogs: false });
    if (outputFile) {
      fs.writeFileSync(outputFile, svg, 'utf8');
      console.log('SVG written to:', path.resolve(outputFile));
      console.log('SVG length:', svg.length, 'bytes');
    } else {
      console.log('SVG_START_MARKER');
      console.log(svg);
      console.log('SVG_END_MARKER');
    }
    process.exit(0);
  } catch (err) {
    console.error('PARSE_ERROR:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
} else {
  module.exports = {
    renderSvg
  };
}
