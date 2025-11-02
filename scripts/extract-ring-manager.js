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

console.log('Starting ring manager extraction...');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, '..', 'tsconfig.json')
});

const drawerBaseFile = project.getSourceFile('src/DrawerBase.ts');
if (!drawerBaseFile) {
  console.error('Could not find src/DrawerBase.ts');
  process.exit(1);
}

console.log('Analyzing DrawerBase.ts...');

const classDeclaration = drawerBaseFile.getClass('DrawerBase');
if (!classDeclaration) {
  console.error('Could not find DrawerBase class');
  process.exit(1);
}

console.log('\nRing-related methods found in DrawerBase:');
const methodsToExtract = [];

for (const methodName of ringRelatedMethods) {
  const method = classDeclaration.getMethod(methodName);
  if (method) {
    const startLine = method.getStartLineNumber();
    const endLine = method.getEndLineNumber();
    const lineCount = endLine - startLine + 1;
    console.log(`  - ${methodName} (lines ${startLine}-${endLine}, ${lineCount} lines)`);
    methodsToExtract.push({
      name: methodName,
      method: method,
      startLine: startLine,
      endLine: endLine,
      lineCount: lineCount
    });
  } else {
    console.log(`  - ${methodName} (NOT FOUND)`);
  }
}

const totalLines = methodsToExtract.reduce((sum, m) => sum + m.lineCount, 0);
console.log(`\nTotal: ${methodsToExtract.length} methods, ~${totalLines} lines`);

console.log('\nAnalyzing property dependencies...');

const properties = classDeclaration.getProperties();
const ringRelatedProperties = properties.filter(prop => {
  const name = prop.getName();
  return name.includes('ring') || name.includes('Ring');
});

console.log('Ring-related properties:');
ringRelatedProperties.forEach(prop => {
  console.log(`  - ${prop.getName()}: ${prop.getType().getText()}`);
});

console.log('\nNext steps:');
console.log('1. Create RingManager class with these methods');
console.log('2. Pass DrawerBase instance to RingManager constructor');
console.log('3. Update all method calls in DrawerBase to use ringManager.methodName()');
console.log('4. Move ring-related properties to RingManager or keep as accessors');
