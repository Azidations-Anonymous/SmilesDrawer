#!/usr/bin/env node

const { Project } = require('ts-morph');
const path = require('path');
const fs = require('fs');

console.log('Renaming DrawerBase to MolecularPreprocessor...\n');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.json')
});

// Step 1: Rename the class inside DrawerBase.ts
console.log('Step 1: Renaming class inside DrawerBase.ts...');
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

classDeclaration.rename('MolecularPreprocessor');
console.log('  ✓ Renamed class to MolecularPreprocessor');

// Step 2: Update the comment
console.log('Step 2: Updating JSDoc comment...');
const jsdoc = classDeclaration.getJsDocs()[0];
if (jsdoc) {
  const text = jsdoc.getInnerText();
  const newText = text.replace(
    'The main class of the application representing the smiles drawer',
    'The molecular structure preprocessor and coordinator'
  );
  jsdoc.remove();
  classDeclaration.insertJsDoc(0, newText);
  console.log('  ✓ Updated JSDoc comment');
}

drawerBaseFile.saveSync();
console.log('  ✓ Saved changes to DrawerBase.ts');

// Step 3: Rename the file
console.log('\nStep 3: Renaming file...');
const oldPath = drawerBaseFile.getFilePath();
const newPath = oldPath.replace('DrawerBase.ts', 'MolecularPreprocessor.ts');
drawerBaseFile.move(newPath);
drawerBaseFile.saveSync();
console.log(`  ✓ Renamed ${oldPath} to ${newPath}`);

// Step 4: Update all imports
console.log('\nStep 4: Updating imports in all files...');
const sourceFiles = project.getSourceFiles();
let updatedCount = 0;

for (const sourceFile of sourceFiles) {
  const imports = sourceFile.getImportDeclarations();
  let fileModified = false;

  for (const importDecl of imports) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    if (moduleSpecifier === './DrawerBase') {
      importDecl.setModuleSpecifier('./MolecularPreprocessor');
      fileModified = true;
    }
  }

  // Also check for require-style imports
  const requireImports = sourceFile.getDescendantsOfKind(274); // ImportEqualsDeclaration
  for (const requireImport of requireImports) {
    const text = requireImport.getText();
    if (text.includes('./DrawerBase')) {
      const newText = text.replace('./DrawerBase', './MolecularPreprocessor');
      requireImport.replaceWithText(newText);
      fileModified = true;
    }
  }

  if (fileModified) {
    sourceFile.saveSync();
    updatedCount++;
    console.log(`  ✓ Updated imports in ${sourceFile.getBaseName()}`);
  }
}

console.log(`  ✓ Updated imports in ${updatedCount} file(s)`);

// Step 5: Delete old .d.ts file if it exists
console.log('\nStep 5: Cleaning up old declaration file...');
const oldDtsPath = path.join(__dirname, '..', 'src', 'DrawerBase.d.ts');
if (fs.existsSync(oldDtsPath)) {
  fs.unlinkSync(oldDtsPath);
  console.log('  ✓ Deleted DrawerBase.d.ts');
} else {
  console.log('  ✓ No DrawerBase.d.ts to delete');
}

console.log('\n' + '='.repeat(80));
console.log('RENAME COMPLETE');
console.log('='.repeat(80));
console.log('DrawerBase has been renamed to MolecularPreprocessor');
console.log('\nNEXT STEPS:');
console.log('1. Run: npx tsc');
console.log('2. Fix any TypeScript errors');
console.log('3. Run: npx gulp && npm run test:regression');
