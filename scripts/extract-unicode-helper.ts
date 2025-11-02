import { Project, MethodDeclaration, ClassDeclaration } from 'ts-morph';

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

// Create the helpers directory if it doesn't exist
const fs = require('fs');
const helpersDir = './src/drawing/helpers';
if (!fs.existsSync(helpersDir)) {
  fs.mkdirSync(helpersDir, { recursive: true });
}

// Methods to extract
const methodsToExtract = [
  'createUnicodeCharge',
  'createUnicodeSubscript',
  'createUnicodeSuperscript',
  'replaceNumbersWithSubscript'
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
const helperClassContent = `class SvgUnicodeHelper {
${methodTexts.join('\n\n')}
}

export = SvgUnicodeHelper;
`;

// Create the new helper file with the content
const helperFile = project.createSourceFile('src/drawing/helpers/SvgUnicodeHelper.ts', helperClassContent, {
  overwrite: true
});

// Add import to source file
sourceFile.addImportDeclaration({
  moduleSpecifier: './helpers/SvgUnicodeHelper',
  defaultImport: 'SvgUnicodeHelper'
});

// Update references in SvgWrapper from `SvgWrapper.methodName` to `SvgUnicodeHelper.methodName`
const sourceFileText = sourceFile.getFullText();
let updatedText = sourceFileText;

for (const methodName of methodsToExtract) {
  const regex = new RegExp(`SvgWrapper\\.${methodName}`, 'g');
  updatedText = updatedText.replace(regex, `SvgUnicodeHelper.${methodName}`);
}

sourceFile.replaceWithText(updatedText);

// Save all changes
console.log('Saving changes...');
project.saveSync();

console.log('Extraction complete!');
console.log('Created: src/drawing/helpers/SvgUnicodeHelper.ts');
console.log('Modified: src/drawing/SvgWrapper.ts');
