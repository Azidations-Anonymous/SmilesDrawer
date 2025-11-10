#!/usr/bin/env node

/**
 * @file Generates JSON graph data from SMILES strings.
 *        Provides both a reusable helper (renderJson) and a CLI entry point.
 */

const { parseHTML } = require('linkedom');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

const { createMoleculeOptions } = require('./molecule-options');
const { collectRingDiagnostics } = require('./ring-diagnostics');
const { collectCisTransDiagnostics } = require('./cis-trans-diagnostics');

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

/**
 * Render a SMILES string to JSON graph data.
 * @param {string} smiles
 * @param {object} [options]
 * @param {object} [options.moleculeOptions]
 * @returns {Promise<{json: string, data: object, timings: {parse: number, draw: number, total: number}}>}
 */
async function renderJson(smiles, options = {}) {
  if (!smiles) {
    throw new Error('SMILES string is required');
  }

  ensureDom();
  const SmilesDrawer = getSmilesDrawer();
  const mergedOptions = createMoleculeOptions({ ...(options.moleculeOptions || {}) });

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

        const drawStart = performance.now();
        svgDrawer.draw(tree, svg, 'light', false);
        const drawEnd = performance.now();

        const graphData = svgDrawer.getPositionData();
        const ringDiagnostics = collectRingDiagnostics(svgDrawer.preprocessor);
        const cisTransDiagnostics = collectCisTransDiagnostics(svgDrawer.preprocessor);

        if (graphData && typeof graphData === 'object') {
          const target = graphData.serializedData && typeof graphData.serializedData === 'object'
            ? graphData.serializedData
            : graphData;

          if (ringDiagnostics) {
            target.ringDiagnostics = ringDiagnostics;
          }
          if (cisTransDiagnostics && cisTransDiagnostics.length > 0) {
            target.cisTransDiagnostics = cisTransDiagnostics;
          }
        }

        const jsonOutput = JSON.stringify(graphData, null, 2);
        const timings = {
          parse: parseEnd - parseStart,
          draw: drawEnd - drawStart,
          total: performance.now() - totalStart
        };

        resolve({
          json: jsonOutput,
          data: graphData,
          timings
        });
      },
      (err) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    );
  });
}

async function runCli() {
  const smilesInput = process.argv[2];
  const outputFile = process.argv[3];

  if (!smilesInput) {
    console.error('ERROR: No SMILES string provided');
    console.error('Usage: node generate-json.js "<SMILES>" [output-file]');
    process.exit(2);
  }

  try {
    const { json } = await renderJson(smilesInput);
    if (outputFile) {
      fs.writeFileSync(outputFile, json, 'utf8');
      console.log('JSON written to:', path.resolve(outputFile));
      console.log('JSON length:', json.length, 'bytes');
    } else {
      console.log('JSON_START_MARKER');
      console.log(json);
      console.log('JSON_END_MARKER');
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
    renderJson
  };
}
