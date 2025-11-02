import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json'
});

const moveMap: Record<string, string> = {
  // graph/
  'src/Atom.ts': 'src/graph/Atom.ts',
  'src/Edge.ts': 'src/graph/Edge.ts',
  'src/Graph.ts': 'src/graph/Graph.ts',
  'src/Line.ts': 'src/graph/Line.ts',
  'src/Ring.ts': 'src/graph/Ring.ts',
  'src/RingConnection.ts': 'src/graph/RingConnection.ts',
  'src/Vector2.ts': 'src/graph/Vector2.ts',
  'src/Vertex.ts': 'src/graph/Vertex.ts',

  // parsing/
  'src/Parser.ts': 'src/parsing/Parser.ts',
  'src/ReactionParser.ts': 'src/parsing/ReactionParser.ts',

  // preprocessing/
  'src/MolecularPreprocessor.ts': 'src/preprocessing/MolecularPreprocessor.ts',
  'src/GraphProcessingManager.ts': 'src/preprocessing/GraphProcessingManager.ts',
  'src/InitializationManager.ts': 'src/preprocessing/InitializationManager.ts',
  'src/MolecularInfoManager.ts': 'src/preprocessing/MolecularInfoManager.ts',
  'src/OverlapResolutionManager.ts': 'src/preprocessing/OverlapResolutionManager.ts',
  'src/PositioningManager.ts': 'src/preprocessing/PositioningManager.ts',
  'src/PseudoElementManager.ts': 'src/preprocessing/PseudoElementManager.ts',
  'src/RingManager.ts': 'src/preprocessing/RingManager.ts',
  'src/StereochemistryManager.ts': 'src/preprocessing/StereochemistryManager.ts',

  // handlers/
  'src/BridgedRingHandler.ts': 'src/handlers/BridgedRingHandler.ts',

  // drawing/
  'src/Drawer.ts': 'src/drawing/Drawer.ts',
  'src/DrawingManager.ts': 'src/drawing/DrawingManager.ts',
  'src/GaussDrawer.ts': 'src/drawing/GaussDrawer.ts',
  'src/SvgDrawer.ts': 'src/drawing/SvgDrawer.ts',
  'src/CanvasWrapper.ts': 'src/drawing/CanvasWrapper.ts',
  'src/SvgWrapper.ts': 'src/drawing/SvgWrapper.ts',

  // reactions/
  'src/Reaction.ts': 'src/reactions/Reaction.ts',
  'src/ReactionDrawer.ts': 'src/reactions/ReactionDrawer.ts',

  // algorithms/
  'src/SSSR.ts': 'src/algorithms/SSSR.ts',

  // config/
  'src/Options.ts': 'src/config/Options.ts',
  'src/DefaultOptions.ts': 'src/config/DefaultOptions.ts',
  'src/OptionsManager.ts': 'src/config/OptionsManager.ts',
  'src/ThemeManager.ts': 'src/config/ThemeManager.ts',

  // utils/
  'src/ArrayHelper.ts': 'src/utils/ArrayHelper.ts',
  'src/MathHelper.ts': 'src/utils/MathHelper.ts',
  'src/UtilityFunctions.ts': 'src/utils/UtilityFunctions.ts',
  'src/FormulaToCommonName.ts': 'src/utils/FormulaToCommonName.ts',
  'src/PixelsToSvg.ts': 'src/utils/PixelsToSvg.ts',
};

async function reorganize() {
  console.log('Starting file reorganization...\n');

  for (const [oldPath, newPath] of Object.entries(moveMap)) {
    const sourceFile = project.getSourceFile(oldPath);

    if (!sourceFile) {
      console.log(`⚠️  File not found: ${oldPath}`);
      continue;
    }

    console.log(`Moving: ${oldPath} → ${newPath}`);

    sourceFile.move(newPath);
  }

  console.log('\nSaving all changes and updating imports...');
  await project.save();

  console.log('✅ Reorganization complete!');
  console.log('\nNext steps:');
  console.log('1. Run: npx tsc');
  console.log('2. Run tests');
  console.log('3. Commit changes');
}

reorganize().catch(console.error);
