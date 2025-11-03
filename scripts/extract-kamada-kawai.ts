import { Project, Scope } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

// Get the source file
const graphFile = project.getSourceFile('src/graph/Graph.ts');
if (!graphFile) {
  throw new Error('Could not find Graph.ts');
}

// Create the new file for KamadaKawaiLayout
const layoutFile = project.createSourceFile(
  'src/algorithms/KamadaKawaiLayout.ts',
  '',
  { overwrite: true }
);

// Add imports to the new file
layoutFile.addImportDeclaration({
  moduleSpecifier: '../graph/Graph',
  defaultImport: 'Graph'
});
layoutFile.addImportDeclaration({
  moduleSpecifier: '../graph/Vector2',
  defaultImport: 'Vector2'
});
layoutFile.addImportDeclaration({
  moduleSpecifier: '../graph/Ring',
  defaultImport: 'Ring'
});
layoutFile.addImportDeclaration({
  moduleSpecifier: '../utils/MathHelper',
  defaultImport: 'MathHelper'
});

// Add class documentation and declaration
layoutFile.addClass({
  name: 'KamadaKawaiLayout',
  isExported: false,
  docs: [{
    description: `Implements the Kamada-Kawai force-directed graph layout algorithm.
Used for positioning bridged ring systems.

Reference: https://pdfs.semanticscholar.org/b8d3/bca50ccc573c5cb99f7d201e8acce6618f04.pdf`
  }],
  ctors: [{
    parameters: [{
      name: 'graph',
      type: 'Graph',
      isReadonly: true,
      scope: Scope.Private
    }]
  }]
});

// Get the Graph class
const graphClass = graphFile.getClass('Graph');
if (!graphClass) {
  throw new Error('Could not find Graph class');
}

// Get the kkLayout method
const kkLayoutMethod = graphClass.getMethod('kkLayout');
if (!kkLayoutMethod) {
  throw new Error('Could not find kkLayout method in Graph class');
}

// Get the new class to add methods to
const layoutClass = layoutFile.getClass('KamadaKawaiLayout');
if (!layoutClass) {
  throw new Error('Could not create KamadaKawaiLayout class');
}

// Add the layout method
layoutClass.addMethod({
  name: 'layout',
  returnType: kkLayoutMethod.getReturnType().getText(),
  parameters: kkLayoutMethod.getParameters().map(p => ({
    name: p.getName(),
    type: p.getType().getText()
  })),
  statements: kkLayoutMethod.getBodyText() || ''
});

console.log('Extracted method: layout (kkLayout)');

// Transform `this.` references in the extracted method
const layoutMethod = layoutClass.getMethod('layout');
if (layoutMethod) {
  const methodBody = layoutMethod.getBodyText();
  if (methodBody) {
    // Replace this.vertices -> this.graph.vertices
    // Replace this.getSubgraphDistanceMatrix -> this.graph.getSubgraphDistanceMatrix
    let newBody = methodBody
      .replace(/this\.vertices/g, 'this.graph.vertices')
      .replace(/this\.getSubgraphDistanceMatrix\(/g, 'this.graph.getSubgraphDistanceMatrix(');

    layoutMethod.setBodyText(newBody);
  }
}

// Add export statement
layoutFile.addExportAssignment({
  expression: 'KamadaKawaiLayout'
});

// Now update the Graph class to use the new helper
const existingImport = graphFile.getImportDeclaration(decl =>
  decl.getModuleSpecifierValue() === '../algorithms/KamadaKawaiLayout'
);

if (!existingImport) {
  graphFile.addImportDeclaration({
    moduleSpecifier: '../algorithms/KamadaKawaiLayout',
    defaultImport: 'KamadaKawaiLayout'
  });
}

// Add layout property to Graph class
const layoutProperty = graphClass.getProperty('layout');
if (!layoutProperty) {
  graphClass.addProperty({
    name: 'layout',
    type: 'KamadaKawaiLayout'
  });
}

// Initialize layout in constructor
const constructor = graphClass.getConstructors()[0];
if (constructor) {
  const constructorBody = constructor.getBodyText();
  if (constructorBody && !constructorBody.includes('this.layout')) {
    constructor.addStatements('this.layout = new KamadaKawaiLayout(this);');
  }
}

// Replace kkLayout implementation in Graph with delegation call
if (kkLayoutMethod) {
  // Get parameter names
  const params = kkLayoutMethod.getParameters().map(p => p.getName()).join(', ');

  // Create delegation call
  const delegationBody = `return this.layout.layout(${params});`;

  kkLayoutMethod.setBodyText(delegationBody);

  console.log('Updated kkLayout to delegate to layout');
}

// Save all changes
console.log('Saving changes...');
project.saveSync();
console.log('✓ KamadaKawaiLayout extracted successfully!');
