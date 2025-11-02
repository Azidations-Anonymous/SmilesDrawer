#!/usr/bin/env node

const { Project } = require('ts-morph');
const path = require('path');

const initializationMethods = [
  'initDraw',
  'initHydrogens'
];

console.log('Updating DrawerBase.ts to use InitializationManager...\n');

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

console.log('Step 1: Adding InitializationManager import...');
const existingImport = drawerBaseFile.getImportDeclaration(imp =>
  imp.getModuleSpecifierValue() === './InitializationManager'
);

if (!existingImport) {
  drawerBaseFile.addImportDeclaration({
    moduleSpecifier: './InitializationManager',
    defaultImport: 'InitializationManager'
  });
  console.log('  ✓ Added import');
} else {
  console.log('  ✓ Import already exists');
}

console.log('Step 2: Adding initializationManager property...');
const initProp = classDeclaration.getProperty('initializationManager');
if (!initProp) {
  classDeclaration.addProperty({
    name: 'initializationManager',
    type: 'InitializationManager',
    scope: 'private'
  });
  console.log('  ✓ Added initializationManager property');
} else {
  console.log('  ✓ initializationManager property already exists');
}

console.log('Step 3: Initializing initializationManager in constructor...');
const constructor = classDeclaration.getConstructors()[0];
if (constructor) {
  const bodyText = constructor.getBodyText() || '';
  if (!bodyText.includes('this.initializationManager = new InitializationManager(this)')) {
    // Add after molecularInfoManager initialization
    const statements = constructor.getStatements();
    let insertIndex = 0;
    for (let i = 0; i < statements.length; i++) {
      const text = statements[i].getText();
      if (text.includes('this.molecularInfoManager = new MolecularInfoManager(this)')) {
        insertIndex = i + 1;
        break;
      }
    }
    constructor.insertStatements(insertIndex, 'this.initializationManager = new InitializationManager(this);');
    console.log('  ✓ Added initializationManager initialization');
  } else {
    console.log('  ✓ initializationManager already initialized');
  }
}

console.log('Step 4: Converting methods to delegate to initializationManager...');
let methodsConverted = 0;

for (const methodName of initializationMethods) {
  const method = classDeclaration.getMethod(methodName);
  if (method) {
    const params = method.getParameters().map(p => p.getName()).join(', ');
    const returnType = method.getReturnType().getText();
    const needsReturn = returnType !== 'void';

    const delegationCode = needsReturn
      ? `return this.initializationManager.${methodName}(${params});`
      : `this.initializationManager.${methodName}(${params});`;

    method.setBodyText(delegationCode);
    methodsConverted++;
  }
}

console.log(`  ✓ Converted ${methodsConverted} methods to delegate to initializationManager`);

console.log('Step 5: Saving DrawerBase.ts...');
drawerBaseFile.saveSync();
console.log(`  ✓ Saved: ${drawerBaseFile.getFilePath()}`);

console.log('\n' + '='.repeat(80));
console.log('UPDATE COMPLETE');
console.log('='.repeat(80));
console.log(`Converted ${methodsConverted} methods to delegate to InitializationManager`);
console.log('\nNEXT STEPS:');
console.log('1. Run: npx tsc');
console.log('2. Fix any TypeScript errors');
console.log('3. Run: npx gulp && npm run test:regression');
