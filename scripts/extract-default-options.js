#!/usr/bin/env node

const { Project } = require('ts-morph');
const path = require('path');

console.log('Extracting DefaultOptions from DrawerBase...\n');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.json')
});

const drawerBaseFile = project.getSourceFile('src/DrawerBase.ts');
if (!drawerBaseFile) {
  console.error('Could not find src/DrawerBase.ts');
  process.exit(1);
}

const classDeclaration = drawerBaseFile.getClass('DrawerBase');
if (!classDeclaration) {
  console.error('Could not find DrawerBase class');
  process.exit(1);
}

console.log('Step 1: Finding defaultOptions in constructor...');
const constructor = classDeclaration.getConstructors()[0];
if (!constructor) {
  console.error('Could not find constructor');
  process.exit(1);
}

const statements = constructor.getStatements();
let defaultOptionsStatement = null;
for (const statement of statements) {
  const text = statement.getText();
  if (text.includes('this.defaultOptions = {')) {
    defaultOptionsStatement = statement;
    break;
  }
}

if (!defaultOptionsStatement) {
  console.error('Could not find defaultOptions assignment');
  process.exit(1);
}

// Extract the object literal
const text = defaultOptionsStatement.getText();
const match = text.match(/this\.defaultOptions = (\{[\s\S]*?\n    \});/);
if (!match) {
  console.error('Could not parse defaultOptions object');
  process.exit(1);
}

const defaultOptionsObject = match[1];
console.log(`  ✓ Found defaultOptions object (~${defaultOptionsObject.split('\n').length} lines)`);

console.log('\nStep 2: Creating DefaultOptions.ts...');
const optionsFile = project.createSourceFile('src/DefaultOptions.ts', '', { overwrite: true });

optionsFile.addStatements([
  `function getDefaultOptions(): any {`,
  `  return ${defaultOptionsObject};`,
  `}`,
  ``,
  `export = getDefaultOptions;`
]);

console.log('  ✓ Created DefaultOptions.ts');

console.log('\nStep 3: Saving DefaultOptions.ts...');
optionsFile.saveSync();
console.log(`  ✓ Saved: ${optionsFile.getFilePath()}`);

console.log('\n' + '='.repeat(80));
console.log('EXTRACTION COMPLETE');
console.log('='.repeat(80));
console.log('Created DefaultOptions.ts with configuration data');
console.log('\nNEXT STEPS:');
console.log('1. Run: node scripts/update-drawer-for-default-options.js');
console.log('2. Run: npx tsc && npx gulp && npm run test:regression');
