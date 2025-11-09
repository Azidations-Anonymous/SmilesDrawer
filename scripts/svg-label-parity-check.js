#!/usr/bin/env node

/**
 * Compare SmilesDrawer's SVG label offsets against PIKAChU for a set of SMILES strings.
 *
 * This script renders each SMILES with both toolkits, parses their SVG output, and reports
 * the relative offsets between primary labels and satellites (hydrogens, charge symbols, etc.).
 *
 * Usage:
 *   node scripts/svg-label-parity-check.js [SMILES...]
 *   npm run parity:svg-labels
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseHTML } = require('linkedom');

function ensureDom() {
  if (global.document) {
    return;
  }
  const { window } = parseHTML('<!doctype html><html><body></body></html>');
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
}

ensureDom();

const Parser = require('../src/parsing/Parser.js');
const SvgDrawer = require('../src/drawing/SvgDrawer.js');
const DEFAULT_SAMPLES = [
  { id: 'ammonium', smiles: '[NH4+]' },
  { id: 'hydroxide', smiles: '[18OH-]' },
  { id: 'sulfonium', smiles: '[SH3+]' }
];

function renderSmilesDrawerSvg(smiles) {
  const drawer = new SvgDrawer({});
  const tree = Parser.parse(smiles, {});
  const target = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const svg = drawer.draw(tree, target, 'light', null, false, [], false);
  return svg.outerHTML;
}

function renderPikachuSvg(smiles) {
  const scriptPath = path.resolve(__dirname, '..', '..', 'pikachu', 'pikachu-run');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pikachu-svg-'));
  const shimDir = path.join(tmpDir, 'shim');
  const outputPath = path.join(tmpDir, 'output.html');
  fs.mkdirSync(shimDir);
  const shimOpen = path.join(shimDir, 'open');
  fs.writeFileSync(shimOpen, '#!/bin/sh\nexit 0\n');
  fs.chmodSync(shimOpen, 0o755);
  try {
    const env = {
      ...process.env,
      PATH: `${shimDir}${path.delimiter}${process.env.PATH || ''}`
    };
    execFileSync(scriptPath, ['--output', outputPath, smiles], {
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'inherit'],
      env
    });
    const html = fs.readFileSync(outputPath, 'utf8');
    const { document } = parseHTML(html);
    const svg = document.querySelector('svg');
    if (!svg) {
      throw new Error('PIKAChU output missing <svg>');
    }
    return svg.outerHTML;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function extractSmilesDrawerOffsets(svgMarkup) {
  const { document } = parseHTML(svgMarkup);
  const primary = document.querySelector('text[data-label-role="primary"]');
  if (!primary) {
    throw new Error('SmilesDrawer output missing primary label');
  }
  const base = {
    text: primary.textContent.trim(),
    x: Number(primary.getAttribute('x')),
    y: Number(primary.getAttribute('y'))
  };

  const satellites = [...document.querySelectorAll('text[data-label-role="satellite"]')].map((node) => ({
    text: node.textContent.trim(),
    x: Number(node.getAttribute('x')),
    y: Number(node.getAttribute('y'))
  }));

  return { base, satellites };
}

function extractPikachuOffsets(svgMarkup) {
  const { document } = parseHTML(svgMarkup);
  const group = document.querySelector('g[id*="atom_"][id$="_text"]');
  if (!group) {
    throw new Error('PIKAChU output missing atom text group');
  }
  const texts = [...group.querySelectorAll('text')];
  if (texts.length === 0) {
    throw new Error('PIKAChU atom text group contains no <text> nodes');
  }
  const primary = texts[0];
  const base = {
    text: primary.textContent.trim(),
    x: Number(primary.getAttribute('x')),
    y: Number(primary.getAttribute('y'))
  };
  const satellites = texts.slice(1).map((node) => ({
    text: node.textContent.trim(),
    x: Number(node.getAttribute('x')),
    y: Number(node.getAttribute('y'))
  }));
  return { base, satellites };
}

function toOffsets(base, satellites) {
  return satellites.map((sat) => ({
    text: sat.text,
    dx: sat.x - base.x,
    dy: sat.y - base.y
  }));
}

function compareOffsets(sampleId, smilesData, pikachuData) {
  const results = [];
  const ours = toOffsets(smilesData.base, smilesData.satellites);
  const theirs = toOffsets(pikachuData.base, pikachuData.satellites);
  const texts = new Set([...ours.map((o) => o.text), ...theirs.map((t) => t.text)]);

  for (const text of texts) {
    const oursList = ours.filter((o) => o.text === text);
    const theirsList = theirs.filter((o) => o.text === text);
    const maxCount = Math.max(oursList.length, theirsList.length);
    for (let i = 0; i < maxCount; i += 1) {
      const oursOffset = oursList[i];
      const theirOffset = theirsList[i];
      if (!theirOffset || !oursOffset) {
        results.push({
          sampleId,
          text,
          status: 'missing',
          ours: oursOffset || null,
          pikachu: theirOffset || null
        });
        continue;
      }
      results.push({
        sampleId,
        text,
        status: 'ok',
        deltaX: Number((oursOffset.dx - theirOffset.dx).toFixed(3)),
        deltaY: Number((oursOffset.dy - theirOffset.dy).toFixed(3)),
        ours: oursOffset,
        pikachu: theirOffset
      });
    }
  }

  return results;
}

function run(samples) {
  const summary = [];
  for (const sample of samples) {
    try {
      const smilesSvg = renderSmilesDrawerSvg(sample.smiles);
      const pikachuSvg = renderPikachuSvg(sample.smiles);
      const smilesData = extractSmilesDrawerOffsets(smilesSvg);
      const pikachuData = extractPikachuOffsets(pikachuSvg);
      const comparisons = compareOffsets(sample.id, smilesData, pikachuData);
      summary.push({ sample: sample.id, comparisons });
    } catch (err) {
      summary.push({
        sample: sample.id,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }
  return summary;
}

function main() {
  const cliSmiles = process.argv.slice(2);
  const samples = cliSmiles.length > 0
    ? cliSmiles.map((smiles, idx) => ({ id: `sample-${idx + 1}`, smiles }))
    : DEFAULT_SAMPLES;

  const summary = run(samples);
  for (const entry of summary) {
    console.log(`\n=== ${entry.sample} ===`);
    if (entry.error) {
      console.error(`  Error: ${entry.error}`);
      continue;
    }
    for (const cmp of entry.comparisons) {
      if (cmp.status === 'missing') {
        console.log(`  ${cmp.text}: missing ${cmp.ours ? 'PIKAChU' : 'SmilesDrawer'} satellite`);
      } else {
        const dist = Math.hypot(cmp.deltaX, cmp.deltaY);
        console.log(
          `  ${cmp.text.padEnd(4)} Δx=${cmp.deltaX.toFixed(3).padStart(7)} Δy=${cmp.deltaY.toFixed(3).padStart(7)} | |Δ|=${dist.toFixed(3)}`
        );
      }
    }
  }
}

main();
