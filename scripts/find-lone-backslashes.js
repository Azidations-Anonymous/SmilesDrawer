#!/usr/bin/env node

/**
 * Scan files for lone backslashes (a single "\" not preceded or followed
 * by another backslash). Passing "--fix" will rewrite the files,
 * doubling each offending backslash. Optionally supply a path as the
 * final argument to override the default test/ directory, e.g.
 *
 *   node scripts/find-lone-backslashes.js --fix ./debug/sample
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const roots = args.filter((arg) => !arg.startsWith('--'));
const baseDir = roots.length > 0 ? path.resolve(roots[0]) : path.resolve(__dirname, '..', 'test');
const regex = /(?<!\\)\\(?!\\)/g; // lone backslash

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function analyzeFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [];
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(content)) !== null) {
    const idx = match.index;
    const before = content.slice(0, idx);
    const line = before.split('\n').length;
    const lastNewline = before.lastIndexOf('\n');
    const column = idx - lastNewline;
    matches.push({ line, column });
  }

  if (!matches.length) {
    return;
  }

  console.log(file);
  for (const { line, column } of matches) {
    console.log(`  line ${line}, column ${column}`);
  }

  if (shouldFix) {
    const fixed = content.replace(regex, '\\\\');
    fs.writeFileSync(file, fixed, 'utf8');
    console.log(`  fixed ${matches.length} occurrence${matches.length === 1 ? '' : 's'}`);
  }
}

for (const file of walk(baseDir)) {
  analyzeFile(file);
}
