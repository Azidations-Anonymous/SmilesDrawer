import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

// Get the source file
const sourceFile = project.getSourceFile('src/drawing/SvgWrapper.ts');
if (!sourceFile) {
  throw new Error('Could not find SvgWrapper.ts');
}

// Get the SvgWrapper class
const svgWrapperClass = sourceFile.getClass('SvgWrapper');
if (!svgWrapperClass) {
  throw new Error('Could not find SvgWrapper class');
}

// Methods to extract
const methodsToExtract = [
  'measureText',
  'writeText'
];

// Collect method texts
const methodTexts: string[] = [];

for (const methodName of methodsToExtract) {
  const method = svgWrapperClass.getStaticMethod(methodName);
  if (!method) {
    console.warn(`Could not find static method ${methodName}`);
    continue;
  }

  // Get the full text of the method including JSDoc
  methodTexts.push(method.getFullText());

  // Remove from source class
  method.remove();
}

// Build the helper class content
const helperClassContent = `class SvgTextHelper {
${methodTexts.join('\n\n')}
}

export = SvgTextHelper;
`;

// Create the new helper file with the content
const helperFile = project.createSourceFile('src/drawing/helpers/SvgTextHelper.ts', helperClassContent, {
  overwrite: true
});

// Add import to source file
sourceFile.addImportDeclaration({
  moduleSpecifier: './helpers/SvgTextHelper',
  defaultImport: 'SvgTextHelper'
});

// Update references in SvgWrapper from `SvgWrapper.methodName` to `SvgTextHelper.methodName`
const sourceFileText = sourceFile.getFullText();
let updatedText = sourceFileText;

for (const methodName of methodsToExtract) {
  const regex = new RegExp(`SvgWrapper\\.${methodName}`, 'g');
  updatedText = updatedText.replace(regex, `SvgTextHelper.${methodName}`);
}

sourceFile.replaceWithText(updatedText);

// Also need to fix the import to use CommonJS style
const imports = sourceFile.getImportDeclarations();
for (const imp of imports) {
  if (imp.getModuleSpecifierValue() === './helpers/SvgTextHelper') {
    imp.remove();
    break;
  }
}

// Add CommonJS import after the SvgUnicodeHelper import
const allImports = sourceFile.getImportDeclarations();
if (allImports.length > 0) {
  const lastImport = allImports[allImports.length - 1];
  sourceFile.insertText(lastImport.getEnd(), '\nimport SvgTextHelper = require(\'./helpers/SvgTextHelper\');');
} else {
  // If no imports, add at the beginning
  sourceFile.insertText(0, 'import SvgTextHelper = require(\'./helpers/SvgTextHelper\');\n');
}

// Save all changes
console.log('Saving changes...');
project.saveSync();

console.log('Extraction complete!');
console.log('Created: src/drawing/helpers/SvgTextHelper.ts');
console.log('Modified: src/drawing/SvgWrapper.ts');
