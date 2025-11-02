import { Project, Scope } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

// Get the source file
const sourceFile = project.getSourceFile('src/drawing/CanvasWrapper.ts');
if (!sourceFile) {
  throw new Error('Could not find CanvasWrapper.ts');
}

// Get the CanvasWrapper class
const wrapperClass = sourceFile.getClass('CanvasWrapper');
if (!wrapperClass) {
  throw new Error('Could not find CanvasWrapper class');
}

// Create helpers directory if needed
const fs = require('fs');
const helpersDir = './src/drawing/helpers';
if (!fs.existsSync(helpersDir)) {
  fs.mkdirSync(helpersDir, { recursive: true });
}

// Methods to extract
const methodsToExtract = [
  'drawWedge',
  'drawDashedWedge'
];

// Collect method texts
const methodTexts: string[] = [];

// First, collect the methods
for (const methodName of methodsToExtract) {
  const method = wrapperClass.getMethod(methodName);
  if (!method) {
    console.warn(`Could not find method ${methodName}`);
    continue;
  }

  // Get the full text of the method
  let methodText = method.getFullText();

  // Transform all `this.` references to `this.wrapper.`
  // Need to be careful not to transform things like `this.getChargeText` which should stay as method calls
  methodText = methodText.replace(/\bthis\.(ctx|offsetX|offsetY|opts|themeManager|halfBondThickness)/g, 'this.wrapper.$1');

  methodTexts.push(methodText);

  // Remove from source class
  method.remove();
}

// Build the helper class content
const helperClassContent = `import Vector2 = require('../../graph/Vector2');
import CanvasWrapper = require('../CanvasWrapper');

class CanvasWedgeDrawer {
  constructor(private wrapper: CanvasWrapper) {}

${methodTexts.join('\n\n')}
}

export = CanvasWedgeDrawer;
`;

// Create the new helper file
const helperFile = project.createSourceFile('src/drawing/helpers/CanvasWedgeDrawer.ts', helperClassContent, {
  overwrite: true
});

// Add import to source file
sourceFile.addImportDeclaration({
  moduleSpecifier: './helpers/CanvasWedgeDrawer',
  defaultImport: 'CanvasWedgeDrawer'
});

// Add wedgeDrawer field to CanvasWrapper
wrapperClass.insertProperty(wrapperClass.getProperties().length, {
  name: 'wedgeDrawer',
  type: 'CanvasWedgeDrawer',
  scope: Scope.Private
});

// Initialize in constructor - add at the end of constructor
const constructor = wrapperClass.getConstructors()[0];
if (constructor) {
  const bodyText = constructor.getBodyText();
  constructor.setBodyText(bodyText + '\n\n        this.wedgeDrawer = new CanvasWedgeDrawer(this);');
}

// Add delegation methods back to CanvasWrapper
for (const methodName of methodsToExtract) {
  wrapperClass.addMethod({
    name: methodName,
    parameters: methodName === 'drawWedge'
      ? [{ name: 'line', type: 'any' }, { name: 'width', type: 'number', initializer: '1.0' }]
      : [{ name: 'line', type: 'any' }],
    returnType: 'void',
    statements: methodName === 'drawWedge'
      ? `this.wedgeDrawer.drawWedge(line, width);`
      : `this.wedgeDrawer.drawDashedWedge(line);`
  });
}

// Make necessary properties public (they're accessed by helper)
const propertiesToMakePublic = ['ctx', 'offsetX', 'offsetY', 'opts', 'themeManager', 'halfBondThickness'];

for (const propName of propertiesToMakePublic) {
  const prop = wrapperClass.getProperty(propName);
  if (prop && prop.getScope() !== Scope.Public) {
    prop.setScope(Scope.Public);
  }
}

// Fix the import to use CommonJS style
const imports = sourceFile.getImportDeclarations();
for (const imp of imports) {
  if (imp.getModuleSpecifierValue() === './helpers/CanvasWedgeDrawer') {
    imp.remove();
    break;
  }
}

// Add CommonJS import
const lastImport = sourceFile.getImportDeclarations()[sourceFile.getImportDeclarations().length - 1];
if (lastImport) {
  sourceFile.insertText(lastImport.getEnd(), '\nimport CanvasWedgeDrawer = require(\'./helpers/CanvasWedgeDrawer\');');
}

// Save all changes
console.log('Saving changes...');
project.saveSync();

console.log('Extraction complete!');
console.log('Created: src/drawing/helpers/CanvasWedgeDrawer.ts');
console.log('Modified: src/drawing/CanvasWrapper.ts');
console.log('');
console.log('Properties made public: ' + propertiesToMakePublic.join(', '));
