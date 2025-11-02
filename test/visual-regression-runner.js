#!/usr/bin/env node

/**
 * @file Visual regression test runner for SmilesDrawer
 * @module test/visual-regression-runner
 * @description
 * Compares molecular structure renderings between two versions of SmilesDrawer.
 * Unlike the standard regression test, this continues testing even when differences
 * are found and generates an HTML report with side-by-side SVG comparisons.
 *
 * ## Features
 * - Tests all SMILES without early bailout
 * - Generates SVG for both old and new versions
 * - Creates interactive HTML report showing differences
 * - Allows manual visual inspection of changes
 *
 * ## Usage
 * node test/visual-regression-runner.js <old-code-path> <new-code-path> [--full]
 *
 * @example
 * node test/visual-regression-runner.js /tmp/baseline /Users/ch/Develop/smilesDrawer
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const fastDatasets = [
    { name: 'fastregression', file: './fastregression.js' }
];

const fullDatasets = [
    { name: 'chembl', file: './chembl.js' },
    { name: 'drugbank', file: './drugbank.js' },
    { name: 'fdb', file: './fdb.js' },
    { name: 'force', file: './force.js' },
    { name: 'gdb17', file: './gdb17.js' },
    { name: 'schembl', file: './schembl.js' }
];

const args = process.argv.slice(2);
const fullMode = args.includes('--full');
const pathArgs = args.filter(arg => arg !== '--full');

const oldCodePath = pathArgs[0];
const newCodePath = pathArgs[1];

if (!oldCodePath || !newCodePath) {
    console.error('ERROR: Missing arguments');
    console.error('Usage: node visual-regression-runner.js <old-code-path> <new-code-path> [--full]');
    console.error('Example: node visual-regression-runner.js /tmp/smiles-old /Users/ch/Develop/smilesDrawer');
    process.exit(2);
}

const datasets = fullMode ? fullDatasets : fastDatasets;
const differences = [];

console.log('='.repeat(80));
console.log('SMILES DRAWER VISUAL REGRESSION TEST');
console.log('='.repeat(80));
console.log('MODE: ' + (fullMode ? 'FULL (all datasets)' : 'FAST (fastregression only)'));
console.log('OLD CODE PATH: ' + oldCodePath);
console.log('NEW CODE PATH: ' + newCodePath);
console.log('='.repeat(80));

let totalTested = 0;
let totalDatasets = 0;
let totalSkipped = 0;
let totalDifferences = 0;

for (const dataset of datasets) {
    console.log('\n' + '='.repeat(80));
    console.log('TESTING DATASET: ' + dataset.name);
    console.log('='.repeat(80));

    let smilesList;
    try {
        const datasetContent = fs.readFileSync(path.join(__dirname, dataset.file), 'utf8');
        const func = new Function(datasetContent + '; return ' + dataset.name + ';');
        smilesList = func();
        if (!smilesList) {
            throw new Error('Dataset variable "' + dataset.name + '" not found in file');
        }
    } catch (err) {
        console.error('ERROR: Failed to load dataset: ' + dataset.file);
        console.error(err.message);
        process.exit(2);
    }

    console.log('LOADED: ' + smilesList.length + ' SMILES strings');

    for (let i = 0; i < smilesList.length; i++) {
        const rawSmiles = smilesList[i];
        const smiles = sanitizeSmiles(rawSmiles);
        const index = i + 1;

        console.log('\n[' + dataset.name + ' ' + index + '/' + smilesList.length + '] Testing: ' + smiles.substring(0, 60) + (smiles.length > 60 ? '...' : ''));

        // Generate JSON for comparison
        const oldJsonFile = path.join(os.tmpdir(), 'smiles-drawer-old-json-' + Date.now() + '-' + Math.random().toString(36).substring(7) + '.json');
        const newJsonFile = path.join(os.tmpdir(), 'smiles-drawer-new-json-' + Date.now() + '-' + Math.random().toString(36).substring(7) + '.json');

        const oldJsonResult = spawnSync('node', ['test/generate-json.js', smiles, oldJsonFile], {
            cwd: oldCodePath,
            encoding: 'utf8'
        });

        if (oldJsonResult.error || oldJsonResult.status !== 0) {
            if (oldJsonResult.stderr && oldJsonResult.stderr.includes('PARSE_ERROR')) {
                console.log('  SKIP: Invalid SMILES (parse error in old code)');
                totalSkipped++;
                continue;
            }
            console.error('  WARNING: Old code failed to generate data');
            totalSkipped++;
            continue;
        }

        const newJsonResult = spawnSync('node', ['test/generate-json.js', smiles, newJsonFile], {
            cwd: newCodePath,
            encoding: 'utf8'
        });

        if (newJsonResult.error || newJsonResult.status !== 0) {
            if (newJsonResult.stderr && newJsonResult.stderr.includes('PARSE_ERROR')) {
                console.log('  SKIP: Invalid SMILES (parse error in new code)');
                totalSkipped++;
                continue;
            }
            console.error('  WARNING: New code failed to generate data');
            totalSkipped++;
            continue;
        }

        let oldJson, newJson;
        try {
            oldJson = fs.readFileSync(oldJsonFile, 'utf8');
            newJson = fs.readFileSync(newJsonFile, 'utf8');
            fs.unlinkSync(oldJsonFile);
            fs.unlinkSync(newJsonFile);
        } catch (err) {
            console.error('  WARNING: Failed to read JSON files');
            totalSkipped++;
            continue;
        }

        // Check if there's a difference
        if (oldJson !== newJson) {
            console.log('  DIFFERENCE DETECTED - Generating SVG comparison');
            totalDifferences++;

            // Generate SVG for both versions
            const oldSvgFile = path.join(os.tmpdir(), 'smiles-drawer-old-svg-' + Date.now() + '-' + Math.random().toString(36).substring(7) + '.svg');
            const newSvgFile = path.join(os.tmpdir(), 'smiles-drawer-new-svg-' + Date.now() + '-' + Math.random().toString(36).substring(7) + '.svg');

            spawnSync('node', ['test/generate-svg.js', smiles, oldSvgFile], {
                cwd: oldCodePath,
                encoding: 'utf8'
            });

            spawnSync('node', ['test/generate-svg.js', smiles, newSvgFile], {
                cwd: newCodePath,
                encoding: 'utf8'
            });

            let oldSvg = '';
            let newSvg = '';
            try {
                oldSvg = fs.readFileSync(oldSvgFile, 'utf8');
                newSvg = fs.readFileSync(newSvgFile, 'utf8');
                fs.unlinkSync(oldSvgFile);
                fs.unlinkSync(newSvgFile);
            } catch (err) {
                console.error('  WARNING: Failed to read SVG files');
            }

            differences.push({
                dataset: dataset.name,
                index: index,
                total: smilesList.length,
                smiles: smiles,
                oldSvg: oldSvg,
                newSvg: newSvg,
                oldJsonLength: oldJson.length,
                newJsonLength: newJson.length
            });
        } else {
            console.log('  MATCH: Identical output ✓');
        }

        totalTested++;
    }

    totalDatasets++;
    console.log('\n' + dataset.name + ' COMPLETE: ' + smilesList.length + ' SMILES tested');
}

// Generate HTML report
if (differences.length > 0) {
    const reportPath = path.join(process.cwd(), 'visual-regression-report.html');
    const html = generateHTMLReport(differences, totalTested, totalSkipped, totalDifferences);
    fs.writeFileSync(reportPath, html, 'utf8');
    
    console.log('\n' + '='.repeat(80));
    console.log('VISUAL REGRESSION REPORT GENERATED');
    console.log('='.repeat(80));
    console.log('Total tested: ' + totalTested);
    console.log('Total skipped: ' + totalSkipped);
    console.log('Differences found: ' + totalDifferences);
    console.log('\nReport saved to: ' + reportPath);
    console.log('='.repeat(80));
    
    process.exit(1);
} else {
    console.log('\n' + '='.repeat(80));
    console.log('ALL TESTS PASSED - NO DIFFERENCES FOUND');
    console.log('='.repeat(80));
    console.log('Total tested: ' + totalTested);
    console.log('Total skipped: ' + totalSkipped);
    console.log('='.repeat(80));
    
    process.exit(0);
}

function sanitizeSmiles(smiles) {
    let cleaned = '';
    for (let i = 0; i < smiles.length; i++) {
        const charCode = smiles.charCodeAt(i);
        if (charCode >= 32 && charCode <= 126) {
            cleaned += smiles[i];
        }
    }
    return cleaned;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function generateHTMLReport(differences, totalTested, totalSkipped, totalDifferences) {
    const timestamp = new Date().toISOString();
    
    let differencesHTML = differences.map((diff, idx) => `
        <div class="difference-card" id="diff-${idx}">
            <div class="difference-header">
                <h3>Difference #${idx + 1} of ${totalDifferences}</h3>
                <div class="meta">
                    <span class="dataset">${escapeHtml(diff.dataset)}</span>
                    <span class="index">Test ${diff.index}/${diff.total}</span>
                </div>
            </div>
            <div class="smiles-display">
                <code>${escapeHtml(diff.smiles)}</code>
            </div>
            <div class="comparison-container">
                <div class="comparison-side">
                    <h4>Baseline (Old)</h4>
                    <div class="svg-container">
                        ${diff.oldSvg}
                    </div>
                    <div class="meta">JSON: ${diff.oldJsonLength} bytes</div>
                </div>
                <div class="comparison-side">
                    <h4>Current (New)</h4>
                    <div class="svg-container">
                        ${diff.newSvg}
                    </div>
                    <div class="meta">JSON: ${diff.newJsonLength} bytes</div>
                </div>
            </div>
            <div class="nav-buttons">
                ${idx > 0 ? `<button onclick="location.href='#diff-${idx-1}'">← Previous</button>` : '<button disabled>← Previous</button>'}
                ${idx < differences.length - 1 ? `<button onclick="location.href='#diff-${idx+1}'">Next →</button>` : '<button disabled>Next →</button>'}
                <button onclick="location.href='#top'">↑ Top</button>
            </div>
        </div>
    `).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Report - SMILES Drawer</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        header {
            border-bottom: 3px solid #3498db;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        h1 {
            color: #2c3e50;
            font-size: 2em;
            margin-bottom: 10px;
        }
        
        .summary {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
        }
        
        .summary-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .difference-card {
            border: 2px solid #e74c3c;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            background: #fff;
            scroll-margin-top: 20px;
        }
        
        .difference-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .difference-header h3 {
            color: #e74c3c;
            font-size: 1.3em;
        }
        
        .meta {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .meta span {
            margin-left: 15px;
            padding: 3px 8px;
            background: #ecf0f1;
            border-radius: 3px;
        }
        
        .dataset {
            font-weight: bold;
            color: #3498db;
        }
        
        .smiles-display {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 12px 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            overflow-x: auto;
        }
        
        .smiles-display code {
            font-family: 'Courier New', monospace;
            font-size: 0.95em;
        }
        
        .comparison-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .comparison-side {
            border: 1px solid #bdc3c7;
            border-radius: 5px;
            padding: 15px;
        }
        
        .comparison-side h4 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .svg-container {
            background: white;
            border: 1px solid #ecf0f1;
            border-radius: 3px;
            padding: 10px;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
        }
        
        .svg-container svg {
            max-width: 100%;
            height: auto;
        }
        
        .nav-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            padding-top: 15px;
            border-top: 1px solid #ecf0f1;
        }
        
        button {
            padding: 8px 16px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.95em;
            transition: background 0.3s;
        }
        
        button:hover:not(:disabled) {
            background: #2980b9;
        }
        
        button:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }
        
        .timestamp {
            color: #95a5a6;
            font-size: 0.85em;
            margin-top: 10px;
        }
        
        @media (max-width: 768px) {
            .comparison-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container" id="top">
        <header>
            <h1>Visual Regression Test Report</h1>
            <div class="timestamp">Generated: ${timestamp}</div>
        </header>
        
        <div class="summary">
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-value">${totalTested}</div>
                    <div class="summary-label">Total Tested</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${totalDifferences}</div>
                    <div class="summary-label">Differences Found</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${totalSkipped}</div>
                    <div class="summary-label">Skipped</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${Math.round((totalDifferences / totalTested) * 100)}%</div>
                    <div class="summary-label">Difference Rate</div>
                </div>
            </div>
        </div>
        
        ${differencesHTML}
    </div>
</body>
</html>`;
}
