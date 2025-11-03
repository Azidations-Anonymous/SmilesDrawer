import { Project, SyntaxKind, MethodDeclaration, VariableDeclarationKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

// Get the source file
const graphFile = project.getSourceFile('src/graph/Graph.ts');
if (!graphFile) {
  throw new Error('Could not find Graph.ts');
}

// Create the new file for GraphMatrixOperations
const matrixOpsFile = project.createSourceFile(
  'src/graph/GraphMatrixOperations.ts',
  '',
  { overwrite: true }
);

// Add imports to the new file
matrixOpsFile.addImportDeclaration({
  moduleSpecifier: './Graph',
  namespaceImport: 'Graph'
});

// Add class documentation and declaration
matrixOpsFile.addClass({
  name: 'GraphMatrixOperations',
  isExported: false,
  docs: [{
    description: `A class providing matrix and list operations for molecular graphs.
Handles adjacency matrices, distance matrices, and adjacency lists.`
  }],
  ctors: [{
    parameters: [{
      name: 'graph',
      type: 'Graph',
      isReadonly: true,
      scope: undefined  // Make it private implicitly via the constructor parameter
    }],
    statements: []  // Empty since we're using parameter property
  }],
  methods: []  // We'll copy methods manually
});

// Get the Graph class
const graphClass = graphFile.getClass('Graph');
if (!graphClass) {
  throw new Error('Could not find Graph class');
}

// List of methods to extract to GraphMatrixOperations
const methodsToExtract = [
  'getAdjacencyMatrix',
  'getComponentsAdjacencyMatrix',
  'getSubgraphAdjacencyMatrix',
  'getDistanceMatrix',
  'getSubgraphDistanceMatrix',
  'getAdjacencyList',
  'getSubgraphAdjacencyList'
];

// Get the new class to add methods to
const matrixOpsClass = matrixOpsFile.getClass('GraphMatrixOperations');
if (!matrixOpsClass) {
  throw new Error('Could not create GraphMatrixOperations class');
}

// Extract each method
for (const methodName of methodsToExtract) {
  const method = graphClass.getMethod(methodName);
  if (!method) {
    console.warn(`Method ${methodName} not found in Graph class`);
    continue;
  }

  // Get the method text and recreate it
  const methodText = method.getText();

  // Add the method to the new class by inserting text
  matrixOpsClass.addMethod({
    name: methodName,
    returnType: method.getReturnType().getText(),
    parameters: method.getParameters().map(p => ({
      name: p.getName(),
      type: p.getType().getText()
    })),
    statements: method.getBodyText() || ''
  });

  console.log(`Extracted method: ${methodName}`);
}

// Now we need to transform `this.` references in the extracted methods
// to use `this.graph.` instead
const extractedMethods = matrixOpsClass.getMethods();
for (const method of extractedMethods) {
  const methodBody = method.getBodyText();
  if (!methodBody) continue;

  // Replace this.vertices -> this.graph.vertices
  // Replace this.edges -> this.graph.edges
  // Replace this.hasEdge -> this.graph.hasEdge
  // Replace this.getBridges -> this.graph.getBridges
  // Replace this.getSubgraphDistanceMatrix -> this.graph.getSubgraphDistanceMatrix
  // Replace this.getAdjacencyMatrix -> this.graph.getAdjacencyMatrix (for recursive calls)

  let newBody = methodBody
    .replace(/this\.vertices/g, 'this.graph.vertices')
    .replace(/this\.edges/g, 'this.graph.edges')
    .replace(/this\.hasEdge/g, 'this.graph.hasEdge')
    .replace(/this\.getBridges\(/g, 'this.graph.getBridges(')
    .replace(/this\.getSubgraphDistanceMatrix\(/g, 'this.getSubgraphDistanceMatrix(')  // Recursive call within class
    .replace(/this\.getSubgraphAdjacencyMatrix\(/g, 'this.getSubgraphAdjacencyMatrix(')  // Recursive call within class
    .replace(/this\.getAdjacencyMatrix\(/g, 'this.getAdjacencyMatrix(');  // Recursive call within class

  method.setBodyText(newBody);
}

// Add export statement
matrixOpsFile.addExportAssignment({
  expression: 'GraphMatrixOperations'
});

// Now update the Graph class to use the new helper
// Add import at the top of Graph.ts
const existingImport = graphFile.getImportDeclaration(decl =>
  decl.getModuleSpecifierValue() === './GraphMatrixOperations'
);

if (!existingImport) {
  graphFile.addImportDeclaration({
    moduleSpecifier: './GraphMatrixOperations',
    namespaceImport: 'GraphMatrixOperations'
  });
}

// Add matrixOps property to Graph class
const matrixOpsProperty = graphClass.getProperty('matrixOps');
if (!matrixOpsProperty) {
  graphClass.addProperty({
    name: 'matrixOps',
    type: 'GraphMatrixOperations'
  });
}

// Initialize matrixOps in constructor
const constructor = graphClass.getConstructors()[0];
if (constructor) {
  const constructorBody = constructor.getBodyText();
  if (constructorBody && !constructorBody.includes('this.matrixOps')) {
    // Add initialization after _init() call
    constructor.addStatements('this.matrixOps = new GraphMatrixOperations(this);');
  }
}

// Replace method implementations in Graph with delegation calls
for (const methodName of methodsToExtract) {
  const method = graphClass.getMethod(methodName);
  if (!method) continue;

  // Get parameter names
  const params = method.getParameters().map(p => p.getName()).join(', ');

  // Create delegation call
  const delegationBody = params
    ? `return this.matrixOps.${methodName}(${params});`
    : `return this.matrixOps.${methodName}();`;

  method.setBodyText(delegationBody);

  console.log(`Updated ${methodName} to delegate to matrixOps`);
}

// Save all changes
console.log('Saving changes...');
project.saveSync();
console.log('✓ GraphMatrixOperations extracted successfully!');
