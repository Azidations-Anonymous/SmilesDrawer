#!/usr/bin/env node

const { Project } = require('ts-morph');
const path = require('path');

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

console.log('Updating DrawerBase.ts to use RingManager...\n');

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

console.log('Step 1: Adding RingManager import...');
const existingImport = drawerBaseFile.getImportDeclaration(imp =>
  imp.getModuleSpecifierValue() === './RingManager'
);

if (!existingImport) {
  drawerBaseFile.addImportDeclaration({
    moduleSpecifier: './RingManager',
    namedImports: ['RingManager']
  });
  console.log('  ✓ Added import');
} else {
  console.log('  ✓ Import already exists');
}

console.log('Step 2: Adding ringManager property...');
const ringManagerProp = classDeclaration.getProperty('ringManager');
if (!ringManagerProp) {
  classDeclaration.addProperty({
    name: 'ringManager',
    type: 'RingManager',
    scope: 'private'
  });
  console.log('  ✓ Added ringManager property');
} else {
  console.log('  ✓ ringManager property already exists');
}

console.log('Step 3: Initializing ringManager in constructor...');
const constructor = classDeclaration.getConstructors()[0];
if (constructor) {
  const bodyText = constructor.getBodyText() || '';
  if (!bodyText.includes('this.ringManager = new RingManager(this)')) {
    constructor.addStatements('this.ringManager = new RingManager(this);');
    console.log('  ✓ Added ringManager initialization');
  } else {
    console.log('  ✓ ringManager already initialized');
  }
}

console.log('Step 4: Converting methods to delegate to ringManager...');
let methodsConverted = 0;

for (const methodName of ringRelatedMethods) {
  const method = classDeclaration.getMethod(methodName);
  if (method) {
    const params = method.getParameters().map(p => p.getName()).join(', ');
    const returnType = method.getReturnType().getText();
    const needsReturn = returnType !== 'void';

    const delegationCode = needsReturn
      ? `return this.ringManager.${methodName}(${params});`
      : `this.ringManager.${methodName}(${params});`;

    method.setBodyText(delegationCode);
    methodsConverted++;
  }
}

console.log(`  ✓ Converted ${methodsConverted} methods to delegate to ringManager`);

console.log('Step 5: Converting properties to accessors...');
let propertiesConverted = 0;

for (const propName of ringRelatedProperties) {
  const prop = classDeclaration.getProperty(propName);
  if (prop) {
    const typeText = prop.getType().getText();

    prop.remove();

    classDeclaration.addGetAccessor({
      name: propName,
      returnType: typeText,
      statements: `return this.ringManager.${propName};`
    });

    classDeclaration.addSetAccessor({
      name: propName,
      parameters: [{ name: 'value', type: typeText }],
      statements: `this.ringManager.${propName} = value;`
    });

    propertiesConverted++;
  }
}

console.log(`  ✓ Converted ${propertiesConverted} properties to accessors`);

console.log('Step 6: Saving DrawerBase.ts...');
drawerBaseFile.saveSync();
console.log(`  ✓ Saved: ${drawerBaseFile.getFilePath()}`);

console.log('\n' + '='.repeat(80));
console.log('UPDATE COMPLETE');
console.log('='.repeat(80));
console.log(`Converted ${methodsConverted} methods to delegate to RingManager`);
console.log(`Converted ${propertiesConverted} properties to accessors`);
console.log('\nNEXT STEPS:');
console.log('1. Run: npx tsc');
console.log('2. Fix any TypeScript errors');
console.log('3. Run: npm run test:regression');
