#!/usr/bin/env node

const { Project, StructureKind } = require('ts-morph');
const path = require('path');
const fs = require('fs');

const ringRelatedMethods = [
  'edgeRingCount',
  'getBridgedRings',
  'getFusedRings',
  'getSpiros',
  'printRingInfo',
  'getRingCount',
  'hasBridgedRing',
  'getRingbondType',
  'initRings',
  'getBridgedRingRings',
  'isPartOfBridgedRing',
  'createBridgedRing',
  'areVerticesInSameRing',
  'getCommonRings',
  'getLargestOrAromaticCommonRing',
  'addRing',
  'removeRing',
  'getRing',
  'addRingConnection',
  'removeRingConnection',
  'removeRingConnectionsBetween',
  'getRingConnection',
  'getRingConnections',
  'setRingCenter',
  'getSubringCenter',
  'backupRingInformation',
  'restoreRingInformation',
  'createRing',
  'getCommonRingbondNeighbour',
  'isPointInRing',
  'isEdgeInRing',
  'isRingAromatic'
];

const ringRelatedProperties = [
  'ringIdCounter',
  'ringConnectionIdCounter',
  'rings',
  'ringConnections',
  'originalRings',
  'originalRingConnections',
  'bridgedRing'
];

console.log('Performing ring manager extraction...\n');

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

console.log('Step 1: Creating RingManager class file...');

const ringManagerFile = project.createSourceFile('src/RingManager.ts', '', { overwrite: true });

ringManagerFile.addImportDeclaration({
  moduleSpecifier: './DrawerBase',
  namedImports: ['DrawerBase']
});

console.log('Step 2: Creating RingManager class...');

const ringManagerClass = ringManagerFile.addClass({
  name: 'RingManager',
  isExported: true
});

console.log('Step 3: Adding properties to RingManager...');

ringManagerClass.addProperty({
  name: 'drawer',
  type: 'DrawerBase',
  scope: 'private'
});

for (const propName of ringRelatedProperties) {
  const prop = classDeclaration.getProperty(propName);
  if (prop) {
    const typeText = prop.getType().getText();
    const initializer = prop.getInitializer();
    console.log(`  - Adding property: ${propName}: ${typeText}`);

    ringManagerClass.addProperty({
      name: propName,
      type: typeText,
      initializer: initializer ? initializer.getText() : undefined,
      scope: 'public'
    });
  }
}

console.log('Step 4: Adding constructor...');

ringManagerClass.addConstructor({
  parameters: [
    { name: 'drawer', type: 'DrawerBase' }
  ],
  statements: writer => {
    writer.writeLine('this.drawer = drawer;');
    for (const propName of ringRelatedProperties) {
      const prop = classDeclaration.getProperty(propName);
      if (prop) {
        const initializer = prop.getInitializer();
        if (initializer) {
          writer.writeLine(`this.${propName} = ${initializer.getText()};`);
        }
      }
    }
  }
});

console.log('Step 5: Extracting methods to RingManager...');

const methodsExtracted = [];

for (const methodName of ringRelatedMethods) {
  const method = classDeclaration.getMethod(methodName);
  if (method) {
    console.log(`  - Extracting method: ${methodName}`);

    const methodText = method.getText();

    ringManagerClass.addMethod({
      name: methodName,
      parameters: method.getParameters().map(p => ({
        name: p.getName(),
        type: p.getType().getText(),
        hasQuestionToken: p.hasQuestionToken(),
        initializer: p.getInitializer()?.getText()
      })),
      returnType: method.getReturnType().getText(),
      statements: method.getBodyText() || ''
    });

    methodsExtracted.push(methodName);
  }
}

console.log(`\nStep 6: Analyzing dependencies...`);

const methodBodies = methodsExtracted.map(name => {
  const method = ringManagerClass.getMethod(name);
  return method ? method.getBodyText() : '';
}).join('\n');

const thisReferences = (methodBodies.match(/this\.\w+/g) || [])
  .map(ref => ref.replace('this.', ''))
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort();

console.log('\nProperties/methods referenced via "this." in extracted methods:');
thisReferences.forEach(ref => {
  const isRingProperty = ringRelatedProperties.includes(ref);
  const isRingMethod = ringRelatedMethods.includes(ref);
  const marker = isRingProperty ? '[PROPERTY]' : isRingMethod ? '[METHOD]' : '[EXTERNAL]';
  console.log(`  ${marker} this.${ref}`);
});

console.log('\nStep 7: Saving RingManager.ts...');
ringManagerFile.saveSync();
console.log(`Saved: ${ringManagerFile.getFilePath()}`);

console.log('\n' + '='.repeat(80));
console.log('EXTRACTION COMPLETE');
console.log('='.repeat(80));
console.log(`Extracted ${methodsExtracted.length} methods (~766 lines)`);
console.log(`Moved ${ringRelatedProperties.length} properties`);
console.log('\nNEXT STEPS:');
console.log('1. Review generated src/RingManager.ts');
console.log('2. Fix "this." references to use "this.drawer." for external properties');
console.log('3. Update DrawerBase.ts to use RingManager');
console.log('4. Run: npx tsc && npm run test:regression');
