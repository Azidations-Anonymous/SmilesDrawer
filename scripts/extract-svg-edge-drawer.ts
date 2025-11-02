import { Project, Scope } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

const sourceFile = project.getSourceFile('src/drawing/SvgDrawer.ts');
if (!sourceFile) {
  throw new Error('Could not find SvgDrawer.ts');
}

const drawerClass = sourceFile.getClass('SvgDrawer');
if (!drawerClass) {
  throw new Error('Could not find SvgDrawer class');
}

// Methods to extract
const methodsToExtract = [
  'drawAromaticityRing',
  'drawEdges',
  'drawEdge',
  'multiplyNormals'
];

// Method signatures for delegation
const methodSignatures: Record<string, any> = {
  drawAromaticityRing: {
    parameters: [{ name: 'ring', type: 'any' }],
    returnType: 'void',
    statement: 'this.edgeDrawer.drawAromaticityRing(ring);'
  },
  drawEdges: {
    parameters: [{ name: 'debug', type: 'boolean' }],
    returnType: 'void',
    statement: 'this.edgeDrawer.drawEdges(debug);'
  },
  drawEdge: {
    parameters: [
      { name: 'edgeId', type: 'number' },
      { name: 'debug', type: 'boolean' }
    ],
    returnType: 'void',
    statement: 'this.edgeDrawer.drawEdge(edgeId, debug);'
  },
  multiplyNormals: {
    parameters: [
      { name: 'normals', type: 'any[]' },
      { name: 'spacing', type: 'number' }
    ],
    returnType: 'void',
    statement: 'this.edgeDrawer.multiplyNormals(normals, spacing);'
  }
};

// Collect method texts
const methodTexts: string[] = [];

for (const methodName of methodsToExtract) {
  const method = drawerClass.getMethod(methodName);
  if (!method) {
    console.warn(`Could not find method ${methodName}`);
    continue;
  }

  let methodText = method.getFullText();

  // Transform `this.` references to `this.drawer.` for parent properties
  methodText = methodText.replace(/\bthis\.(preprocessor|svgWrapper|opts|bridgedRing)\b/g, 'this.drawer.$1');

  // Keep method calls within the same class as `this.`
  // drawEdges calls this.drawEdge - keep as is
  // drawEdge calls this.multiplyNormals - keep as is

  methodTexts.push(methodText);
}

// Remove the original methods
for (const methodName of methodsToExtract) {
  const method = drawerClass.getMethod(methodName);
  if (method) {
    method.remove();
  }
}

// Add delegation methods back
for (const methodName of methodsToExtract) {
  const sig = methodSignatures[methodName];
  if (sig) {
    drawerClass.addMethod({
      name: methodName,
      parameters: sig.parameters,
      returnType: sig.returnType,
      statements: sig.statement
    });
  }
}

// Build the helper class content
const helperClassContent = `import ArrayHelper = require('../../utils/ArrayHelper');
import Vector2 = require('../../graph/Vector2');
import Line = require('../../graph/Line');
import SvgDrawer = require('../SvgDrawer');

class SvgEdgeDrawer {
  constructor(private drawer: SvgDrawer) {}

${methodTexts.join('\n\n')}
}

export = SvgEdgeDrawer;
`;

// Create the new helper file
project.createSourceFile('src/drawing/draw/SvgEdgeDrawer.ts', helperClassContent, {
  overwrite: true
});

// Add edgeDrawer field to SvgDrawer
drawerClass.insertProperty(drawerClass.getProperties().length, {
  name: 'edgeDrawer',
  type: 'SvgEdgeDrawer',
  scope: Scope.Private
});

// Initialize in constructor
const constructor = drawerClass.getConstructors()[0];
if (constructor) {
  const bodyText = constructor.getBodyText();
  constructor.setBodyText(bodyText + '\n    this.edgeDrawer = new SvgEdgeDrawer(this);');
}

// Add import
const imports = sourceFile.getImportDeclarations();
const lastImport = imports[imports.length - 1];
if (lastImport) {
  sourceFile.insertText(lastImport.getEnd(), '\nimport SvgEdgeDrawer = require(\'./draw/SvgEdgeDrawer\');');
}

console.log('Saving changes...');
project.saveSync();

console.log('Extraction complete!');
console.log('Created: src/drawing/draw/SvgEdgeDrawer.ts');
console.log('Modified: src/drawing/SvgDrawer.ts');
console.log(`Extracted ${methodsToExtract.length} methods`);
