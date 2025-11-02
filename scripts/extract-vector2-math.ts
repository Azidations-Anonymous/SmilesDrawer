import { Project, Scope } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

const sourceFile = project.getSourceFile('src/graph/Vector2.ts');
if (!sourceFile) {
  throw new Error('Could not find Vector2.ts');
}

const vector2Class = sourceFile.getClass('Vector2');
if (!vector2Class) {
  throw new Error('Could not find Vector2 class');
}

// Static methods to extract
const staticMethodsToExtract = [
  'add',
  'subtract',
  'multiply',
  'multiplyScalar',
  'midpoint',
  'normals',
  'units',
  'divide',
  'divideScalar',
  'dot',
  'angle',
  'threePointangle',
  'scalarProjection',
  'averageDirection'
];

// Static method signatures for delegation
const staticMethodSignatures: Record<string, any> = {
  add: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'Vector2',
    statement: 'return Vector2Math.add(vecA, vecB);'
  },
  subtract: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'Vector2',
    statement: 'return Vector2Math.subtract(vecA, vecB);'
  },
  multiply: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'Vector2',
    statement: 'return Vector2Math.multiply(vecA, vecB);'
  },
  multiplyScalar: {
    parameters: [
      { name: 'vec', type: 'Vector2' },
      { name: 'scalar', type: 'number' }
    ],
    returnType: 'Vector2',
    statement: 'return Vector2Math.multiplyScalar(vec, scalar);'
  },
  midpoint: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'Vector2',
    statement: 'return Vector2Math.midpoint(vecA, vecB);'
  },
  normals: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'Vector2[]',
    statement: 'return Vector2Math.normals(vecA, vecB);'
  },
  units: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'Vector2[]',
    statement: 'return Vector2Math.units(vecA, vecB);'
  },
  divide: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'Vector2',
    statement: 'return Vector2Math.divide(vecA, vecB);'
  },
  divideScalar: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 's', type: 'number' }
    ],
    returnType: 'Vector2',
    statement: 'return Vector2Math.divideScalar(vecA, s);'
  },
  dot: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'number',
    statement: 'return Vector2Math.dot(vecA, vecB);'
  },
  angle: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'number',
    statement: 'return Vector2Math.angle(vecA, vecB);'
  },
  threePointangle: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' },
      { name: 'vecC', type: 'Vector2' }
    ],
    returnType: 'number',
    statement: 'return Vector2Math.threePointangle(vecA, vecB, vecC);'
  },
  scalarProjection: {
    parameters: [
      { name: 'vecA', type: 'Vector2' },
      { name: 'vecB', type: 'Vector2' }
    ],
    returnType: 'number',
    statement: 'return Vector2Math.scalarProjection(vecA, vecB);'
  },
  averageDirection: {
    parameters: [
      { name: 'vecs', type: 'Vector2[]' }
    ],
    returnType: 'Vector2',
    statement: 'return Vector2Math.averageDirection(vecs);'
  }
};

// Collect static method texts
const staticMethodTexts: string[] = [];

for (const methodName of staticMethodsToExtract) {
  const method = vector2Class.getStaticMethod(methodName);
  if (!method) {
    console.warn(`Could not find static method ${methodName}`);
    continue;
  }

  let methodText = method.getFullText();
  staticMethodTexts.push(methodText);
}

// Remove the original static methods
for (const methodName of staticMethodsToExtract) {
  const method = vector2Class.getStaticMethod(methodName);
  if (method) {
    method.remove();
  }
}

// Add delegation methods back
for (const methodName of staticMethodsToExtract) {
  const sig = staticMethodSignatures[methodName];
  if (sig) {
    vector2Class.addMethod({
      name: methodName,
      isStatic: true,
      parameters: sig.parameters,
      returnType: sig.returnType,
      statements: sig.statement
    });
  }
}

// Build the helper class content
const helperClassContent = `import Vector2 = require('./Vector2');

class Vector2Math {
${staticMethodTexts.join('\n\n')}
}

export = Vector2Math;
`;

// Create the helpers directory if it doesn't exist
const helperDir = project.getDirectory('src/graph/helpers');
if (!helperDir) {
  project.createDirectory('src/graph/helpers');
}

// Create the new helper file
project.createSourceFile('src/graph/helpers/Vector2Math.ts', helperClassContent, {
  overwrite: true
});

// Add import to Vector2.ts (at the top since Vector2 has no imports currently)
sourceFile.insertText(0, 'import Vector2Math = require(\'./helpers/Vector2Math\');\n\n');

console.log('Saving changes...');
project.saveSync();

console.log('Extraction complete!');
console.log('Created: src/graph/helpers/Vector2Math.ts');
console.log('Modified: src/graph/Vector2.ts');
console.log(`Extracted ${staticMethodsToExtract.length} static methods`);
