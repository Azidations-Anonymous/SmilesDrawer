#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const jsondiffpatch = require('jsondiffpatch');

const baseDir = __dirname;
const browserPath = path.join(baseDir, 'ferrochelate-browser.json');
const nodePath = path.join(baseDir, 'ferrochelate-node.json');
const diffPath = path.join(baseDir, 'browser-vs-node-diff.json');

const browserData = JSON.parse(fs.readFileSync(browserPath, 'utf8'));
const nodeData = JSON.parse(fs.readFileSync(nodePath, 'utf8'));

const delta = jsondiffpatch.diff(browserData, nodeData);
fs.writeFileSync(diffPath, JSON.stringify(delta || {}, null, 2));

if (!delta) {
    console.log(`No differences. ${path.relative(process.cwd(), diffPath)} rewritten with empty diff.`);
} else {
    console.log(`Diff written to ${path.relative(process.cwd(), diffPath)} (keys: ${Object.keys(delta).length}).`);
}
