#!/usr/bin/env node

/**
 * @file Generates SVG representation of molecular structures from SMILES strings for visual regression testing.
 * @module test/generate-svg
 * @description
 * This script parses a SMILES string using SmilesDrawer and generates an SVG representation.
 * Used for visual regression testing to compare rendering differences between code versions.
 *
 * @example
 * // Generate SVG to file
 * node test/generate-svg.js "CCO" /tmp/output.svg
 */

const scriptStartTime = Date.now();

const domLibLoadStart = Date.now();
const { parseHTML } = require('linkedom');
const domLibLoadEnd = Date.now();
console.log(`TIMING: linkedom load took ${domLibLoadEnd - domLibLoadStart}ms`);

const fs = require('fs');

const { createMoleculeOptions } = require('./molecule-options');

const smilesInput = process.argv[2];
const outputFile = process.argv[3];

if (!smilesInput) {
    console.error('ERROR: No SMILES string provided');
    console.error('Usage: node generate-svg.js "<SMILES>" [output-file]');
    process.exit(2);
}

console.log(`PROCESSING: ${smilesInput}`);

const domSetupStart = Date.now();
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
const domSetupEnd = Date.now();
console.log(`TIMING: DOM setup took ${domSetupEnd - domSetupStart}ms`);

const smilesDrawerLoadStart = Date.now();
const SmilesDrawer = require('../app.js');
const smilesDrawerLoadEnd = Date.now();
console.log(`TIMING: SmilesDrawer load took ${smilesDrawerLoadEnd - smilesDrawerLoadStart}ms`);

const options = createMoleculeOptions({
    width: 500,
    height: 500,
    bondThickness: 1.0,
    bondLength: 30,
    shortBondLength: 0.85,
    bondSpacing: 0.18 * 30,
    atomVisualization: 'default',
    isomeric: true,
    debug: false,
    terminalCarbons: false,
    explicitHydrogens: false,
    overlapSensitivity: 0.42,
    overlapResolutionIterations: 1,
    compactDrawing: true,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSizeLarge: 6,
    fontSizeSmall: 4,
    padding: 20.0,
    themes: {
        dark: {
            C: '#fff',
            O: '#e74c3c',
            N: '#3498db',
            F: '#27ae60',
            CL: '#16a085',
            BR: '#d35400',
            I: '#8e44ad',
            P: '#d35400',
            S: '#f39c12',
            B: '#e67e22',
            SI: '#e67e22',
            H: '#aaa',
            BACKGROUND: '#141414'
        },
        light: {
            C: '#222',
            O: '#e74c3c',
            N: '#3498db',
            F: '#27ae60',
            CL: '#16a085',
            BR: '#d35400',
            I: '#8e44ad',
            P: '#d35400',
            S: '#f39c12',
            B: '#e67e22',
            SI: '#e67e22',
            H: '#999',
            BACKGROUND: '#fff'
        }
    }
});

try {
    console.log('PARSING: Starting parse');
    const parseStartTime = Date.now();
    const svgDrawer = new SmilesDrawer.SvgDrawer(options);

    SmilesDrawer.parse(smilesInput, function(tree) {
        const parseEndTime = Date.now();
        console.log(`PARSE_SUCCESS: Tree generated (took ${parseEndTime - parseStartTime}ms)`);
        console.log('PROCESSING: Generating SVG');
        const drawStartTime = Date.now();

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svg.setAttribute('width', String(options.width));
        svg.setAttribute('height', String(options.height));

        svgDrawer.draw(tree, svg, 'light', false);

        const svgString = svg.outerHTML;
        const drawEndTime = Date.now();
        console.log(`PROCESS_SUCCESS: SVG generated (took ${drawEndTime - drawStartTime}ms)`);

        if (outputFile) {
            fs.writeFileSync(outputFile, svgString, 'utf8');
            console.log('SVG written to: ' + outputFile);
            console.log('SVG length: ' + svgString.length + ' bytes');
        } else {
            console.log('SVG_START_MARKER');
            console.log(svgString);
            console.log('SVG_END_MARKER');
        }

        const scriptEndTime = Date.now();
        console.log(`TIMING: Total script execution time: ${scriptEndTime - scriptStartTime}ms`);

        process.exit(0);
    }, function(err) {
        console.error('PARSE_ERROR: ' + err);
        process.exit(1);
    });
} catch (err) {
    console.error('FATAL_ERROR: ' + err.message);
    console.error(err.stack);
    process.exit(1);
}
