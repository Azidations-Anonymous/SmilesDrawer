#!/usr/bin/env node

const { Project } = require('ts-morph');
const path = require('path');

const stereochemistryMethods = [
  'annotateStereochemistry',
  'visitStereochemistry'
];

console.log('Updating DrawerBase.ts to use StereochemistryManager...\n');

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

console.log('Step 1: Adding StereochemistryManager import...');
const existingImport = drawerBaseFile.getImportDeclaration(imp =>
  imp.getModuleSpecifierValue() === './StereochemistryManager'
);

if (!existingImport) {
  drawerBaseFile.addImportDeclaration({
    moduleSpecifier: './StereochemistryManager',
    defaultImport: 'StereochemistryManager'
  });
  console.log('  ✓ Added import');
} else {
  console.log('  ✓ Import already exists');
}

console.log('Step 2: Adding stereochemistryManager property...');
const stereochemistryProp = classDeclaration.getProperty('stereochemistryManager');
if (!stereochemistryProp) {
  classDeclaration.addProperty({
    name: 'stereochemistryManager',
    type: 'StereochemistryManager',
    scope: 'private'
  });
  console.log('  ✓ Added stereochemistryManager property');
} else {
  console.log('  ✓ stereochemistryManager property already exists');
}

console.log('Step 3: Initializing stereochemistryManager in constructor...');
const constructor = classDeclaration.getConstructors()[0];
if (constructor) {
  const bodyText = constructor.getBodyText() || '';
  if (!bodyText.includes('this.stereochemistryManager = new StereochemistryManager(this)')) {
    // Add after ringManager initialization
    const statements = constructor.getStatements();
    let insertIndex = 0;
    for (let i = 0; i < statements.length; i++) {
      const text = statements[i].getText();
      if (text.includes('this.ringManager = new RingManager(this)')) {
        insertIndex = i + 1;
        break;
      }
    }
    constructor.insertStatements(insertIndex, 'this.stereochemistryManager = new StereochemistryManager(this);');
    console.log('  ✓ Added stereochemistryManager initialization');
  } else {
    console.log('  ✓ stereochemistryManager already initialized');
  }
}

console.log('Step 4: Converting methods to delegate to stereochemistryManager...');
let methodsConverted = 0;

for (const methodName of stereochemistryMethods) {
  const method = classDeclaration.getMethod(methodName);
  if (method) {
    const params = method.getParameters().map(p => p.getName()).join(', ');
    const returnType = method.getReturnType().getText();
    const needsReturn = returnType !== 'void';

    const delegationCode = needsReturn
      ? `return this.stereochemistryManager.${methodName}(${params});`
      : `this.stereochemistryManager.${methodName}(${params});`;

    method.setBodyText(delegationCode);
    methodsConverted++;
  }
}

console.log(`  ✓ Converted ${methodsConverted} methods to delegate to stereochemistryManager`);

console.log('Step 5: Saving DrawerBase.ts...');
drawerBaseFile.saveSync();
console.log(`  ✓ Saved: ${drawerBaseFile.getFilePath()}`);

console.log('\n' + '='.repeat(80));
console.log('UPDATE COMPLETE');
console.log('='.repeat(80));
console.log(`Converted ${methodsConverted} methods to delegate to StereochemistryManager`);
console.log('\nNEXT STEPS:');
console.log('1. Run: npx tsc');
console.log('2. Fix any TypeScript errors');
console.log('3. Run: npx gulp && npm run test:regression');
