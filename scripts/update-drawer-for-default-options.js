#!/usr/bin/env node

const { Project } = require('ts-morph');
const path = require('path');

console.log('Updating DrawerBase.ts to use DefaultOptions...\n');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.json')
});

const drawerBaseFile = project.getSourceFile('src/DrawerBase.ts');
if (!drawerBaseFile) {
  console.error('Could not find src/DrawerBase.ts');
  process.exit(1);
}

console.log('Step 1: Adding getDefaultOptions import...');
const existingImport = drawerBaseFile.getImportDeclaration(imp =>
  imp.getModuleSpecifierValue() === './DefaultOptions'
);

if (!existingImport) {
  // Add after InitializationManager import
  const initManagerImport = drawerBaseFile.getImportDeclaration(imp =>
    imp.getModuleSpecifierValue() === './InitializationManager'
  );

  if (initManagerImport) {
    const index = initManagerImport.getChildIndex() + 1;
    drawerBaseFile.insertImportDeclaration(index, {
      moduleSpecifier: './DefaultOptions',
      defaultImport: 'getDefaultOptions'
    });
  } else {
    drawerBaseFile.addImportDeclaration({
      moduleSpecifier: './DefaultOptions',
      defaultImport: 'getDefaultOptions'
    });
  }
  console.log('  ✓ Added import');
} else {
  console.log('  ✓ Import already exists');
}

console.log('Step 2: Replacing inline defaultOptions with function call...');
const classDeclaration = drawerBaseFile.getClass('DrawerBase');
if (!classDeclaration) {
  console.error('Could not find DrawerBase class');
  process.exit(1);
}

const constructor = classDeclaration.getConstructors()[0];
if (!constructor) {
  console.error('Could not find constructor');
  process.exit(1);
}

const statements = constructor.getStatements();
for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  const text = statement.getText();

  if (text.includes('this.defaultOptions = {')) {
    // Find the full statement (including all lines until the closing })
    let fullText = text;
    let j = i;
    while (!fullText.includes('};') && j < statements.length - 1) {
      j++;
      fullText = statements.slice(i, j + 1).map(s => s.getText()).join('\n');
    }

    // Replace with function call
    const newStatement = 'this.defaultOptions = getDefaultOptions();';
    statement.replaceWithText(newStatement);

    // Remove the extra statements that were part of the object literal
    for (let k = i + 1; k <= j; k++) {
      statements[k].remove();
    }

    console.log('  ✓ Replaced defaultOptions assignment');
    break;
  }
}

console.log('Step 3: Saving DrawerBase.ts...');
drawerBaseFile.saveSync();
console.log(`  ✓ Saved: ${drawerBaseFile.getFilePath()}`);

console.log('\n' + '='.repeat(80));
console.log('UPDATE COMPLETE');
console.log('='.repeat(80));
console.log('DrawerBase.ts now uses getDefaultOptions()');
console.log('\nNEXT STEPS:');
console.log('1. Run: npx tsc');
console.log('2. Fix any TypeScript errors');
console.log('3. Run: npx gulp && npm run test:regression');
