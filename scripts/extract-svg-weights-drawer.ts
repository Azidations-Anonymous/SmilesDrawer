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
  'drawWeights'
];

// Method signatures for delegation
const methodSignatures: Record<string, any> = {
  drawWeights: {
    parameters: [
      { name: 'weights', type: 'number[]' },
      { name: 'weightsNormalized', type: 'boolean' }
    ],
    returnType: 'void',
    statement: 'this.weightsDrawer.drawWeights(weights, weightsNormalized);'
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
  methodText = methodText.replace(/\bthis\.(preprocessor|svgWrapper|opts)\b/g, 'this.drawer.$1');

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
const helperClassContent = `import Vector2 = require('../../graph/Vector2');
import GaussDrawer = require('../GaussDrawer');
import SvgDrawer = require('../SvgDrawer');

class SvgWeightsDrawer {
  constructor(private drawer: SvgDrawer) {}

${methodTexts.join('\n\n')}
}

export = SvgWeightsDrawer;
`;

// Create the new helper file
project.createSourceFile('src/drawing/draw/SvgWeightsDrawer.ts', helperClassContent, {
  overwrite: true
});

// Add weightsDrawer field to SvgDrawer
drawerClass.insertProperty(drawerClass.getProperties().length, {
  name: 'weightsDrawer',
  type: 'SvgWeightsDrawer',
  scope: Scope.Private
});

// Initialize in constructor
const constructor = drawerClass.getConstructors()[0];
if (constructor) {
  const bodyText = constructor.getBodyText();
  constructor.setBodyText(bodyText + '\n    this.weightsDrawer = new SvgWeightsDrawer(this);');
}

// Add import
const imports = sourceFile.getImportDeclarations();
const lastImport = imports[imports.length - 1];
if (lastImport) {
  sourceFile.insertText(lastImport.getEnd(), '\nimport SvgWeightsDrawer = require(\'./draw/SvgWeightsDrawer\');');
}

console.log('Saving changes...');
project.saveSync();

console.log('Extraction complete!');
console.log('Created: src/drawing/draw/SvgWeightsDrawer.ts');
console.log('Modified: src/drawing/SvgDrawer.ts');
console.log(`Extracted ${methodsToExtract.length} method(s)`);
