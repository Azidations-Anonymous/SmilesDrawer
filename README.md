# SmilesDrawer

No server, no images, no templates — just a SMILES string in, a structure out.

<table style="width: 100%; table-layout: fixed">
    <tbody>
        <tr>
            <td><a href="https://azidations-anonymous.github.io/SmilesDrawer/">Molecules</a></td>
            <td><a href="https://azidations-anonymous.github.io/SmilesDrawer/">Reactions & Highlights</a></td>
        </tr>
        <tr>
            <td><a href="https://azidations-anonymous.github.io/SmilesDrawer/"><img src="https://github.com/Azidations-Anonymous/SmilesDrawer/raw/master/readme/main.png"></img></a></td>
            <td><a href="https://azidations-anonymous.github.io/SmilesDrawer/"><img src="https://github.com/Azidations-Anonymous/SmilesDrawer/raw/master/readme/rxn_highlight.png"></img></a></td>
        </tr>
        <tr>
            <td><a href="https://azidations-anonymous.github.io/SmilesDrawer/playground/index.html">Playground</a></td>
            <td></td>
        </tr>
        <tr>
            <td><a href="https://azidations-anonymous.github.io/SmilesDrawer/playground/index.html"><img src="https://github.com/Azidations-Anonymous/SmilesDrawer/raw/master/readme/style.png"></img></a></td>
            <td></td>
        </tr>
    </tbody>
</table>

## Quick Start

```bash
npm install smiles-drawer
```

```html
<canvas id="output" width="500" height="500"></canvas>

<script src="https://unpkg.com/smiles-drawer@3.0.0/dist/smiles-drawer.min.js"></script>
<script>
    const smiDrawer = new SmilesDrawer.SmiDrawer({ canvas: { width: 500, height: 500 } });
    smiDrawer.draw('c1ccccc1', '#output', 'light');
</script>
```

## Installation

npm or yarn:

```bash
npm install smiles-drawer
# or
yarn add smiles-drawer
```

CDN:

```
https://unpkg.com/smiles-drawer@3.0.0/dist/smiles-drawer.min.js
```

## API

### Modern API (`SmiDrawer`)

The simplest way to draw molecules. Pass a SMILES string directly — no separate parse step needed.

```javascript
const drawer = new SmilesDrawer.SmiDrawer(moleculeOptions, reactionOptions);

// Draw to an existing element (canvas, SVG, or img) by selector or reference
drawer.draw('CCO', '#output', 'light');

// Draw to a new SVG element
const svg = drawer.draw('CCO', 'svg', 'dark');

// Auto-apply to all elements with a data-smiles attribute
SmilesDrawer.apply({ canvas: { width: 400, height: 400 } }, {}, 'canvas[data-smiles]', 'light');
```

The `target` parameter accepts:

| Value | Behaviour |
| --- | --- |
| CSS selector string | Draws on the matching element |
| `HTMLCanvasElement` / `SVGElement` / `HTMLImageElement` | Draws directly on the element |
| `'svg'`, `'canvas'`, `'img'` | Creates and returns a new element |
| `null` | Creates and returns a new SVG element |

### Legacy namespace API

The callback-based API from v2 still works:

```javascript
const drawer = new SmilesDrawer.Drawer({ canvas: { width: 500, height: 500 } });

SmilesDrawer.parse('c1ccccc1', function (tree) {
    drawer.draw(tree, 'output-canvas', 'light');
}, function (err) {
    console.log(err);
});
```

Other legacy entry points: `SmilesDrawer.SvgDrawer`, `SmilesDrawer.ReactionDrawer`, `SmilesDrawer.GaussDrawer`.

### `getMolecularFormula()`

Returns the molecular formula (e.g. `C6H6`) of the most recently drawn molecule.

### `getPositionData()`

Returns an `IMolecularData` interface with full access to the positioned graph — vertices (atoms), edges (bonds), rings, and the helper methods used by the internal renderer. Useful for building custom renderers.

```javascript
const drawer = new SmilesDrawer.Drawer({ canvas: { width: 500, height: 500 } });

SmilesDrawer.parse('c1ccccc1', function (tree) {
    drawer.draw(tree, 'output-canvas', 'light');

    const molData = drawer.getPositionData();

    molData.graph.vertices.forEach(v => {
        console.log(`${v.value.element} at (${v.position.x}, ${v.position.y})`);
    });

    molData.graph.edges.forEach(e => {
        console.log(`${e.bondType} from ${e.sourceId} to ${e.targetId}`);
    });

    console.log('Aromatic?', molData.isRingAromatic(molData.rings[0]));
});
```

**Properties:** `graph`, `rings`, `ringConnections`, `opts`, `bridgedRing`, `highlight_atoms`

**Helper methods:** `getEdgeNormals(edge)`, `isRingAromatic(ring)`, `areVerticesInSameRing(a, b)`, `chooseSide(a, b, sides)`, `getLargestOrAromaticCommonRing(a, b)`, `getMolecularFormula()`, `getTotalOverlapScore()`

## Options

Options use a nested structure. You only need to supply the keys you want to override — everything else uses the defaults shown below.

```javascript
const drawer = new SmilesDrawer.SmiDrawer({
    canvas: { width: 300, height: 200 },
    rendering: { atoms: { terminalCarbons: true } },
});
```

The default options are defined as follows (auto-generated via `node scripts/update-readme-default-options.js`):

<!-- AUTO-GENERATED:DEFAULT_OPTIONS_START -->

```javascript
{
  meta: {
    version: '3.0.0',
    schemaRevision: 1,
    debug: false,
    debugTextOutline: 3
  },
  canvas: {
    width: 500,
    height: 500,
    scale: 0,
    padding: 10
  },
  rendering: {
    bonds: {
      bondThickness: 1,
      bondLength: 30,
      shortBondLength: 0.7,
      bondSpacing: 5.1,
      dashPattern: [3, 2],
      tripleBondSpacingDivider: 1.5,
      dashedStepFactor: 1.25,
      dashedWedgeSpacingMultiplier: 3,
      dashedWidthFactorSvg: 0.5,
      dashedWidthFactorCanvas: 1.5,
      dashedColorSwitchThreshold: 0.5,
      dashedInsetPx: 1
    },
    stereochemistry: {
      isomeric: true,
      shadowShortenPx: 5,
      wedgeTipPaddingPx: 3,
      wedgeTipFontScale: 0.25,
      wedgeSidePaddingPx: 1.5,
      wedgeBaseWidthPx: 1
    },
    atoms: {
      atomVisualization: 'default',
      terminalCarbons: false,
      explicitHydrogens: false,
      pointRadius: 0.75,
      pointMaskRadius: 1.5
    },
    aromatic: {
      piSystemInset: 7,
      overlayInset: 7,
      overlayClampRatio: 0.5,
      overlayColor: 'C'
    }
  },
  layout: {
    graph: {
      compactDrawing: true,
      overlapSensitivity: 0.42,
      overlapResolutionIterations: 1,
      defaultBranchAngleRad: 2.094395102393,
      linearBondToleranceRad: 0.1,
      rotationSnapIncrementDeg: 30,
      rotationSnapDeadzoneDeg: 15,
      finetuneRotationOffsetDeg: 1,
      centerOfMassRadiusFactor: 2,
      rotationJitterEpsilon: 0.001
    },
    finetune: {
      enabled: true,
      maxSteps: 256,
      maxDurationMs: 250
    },
    force: {
      kkThreshold: 0.1,
      kkInnerThreshold: 0.1,
      kkMaxIteration: 20000,
      kkMaxInnerIteration: 50,
      kkMaxEnergy: 1000000000,
      hessianMinimum: 0.1
    },
    overlap: {
      ringDivisionSegments: 6,
      finetuneClashDistanceFactor: 0.8,
      rotatableEdgeCenteringFactor: 0.5,
      terminalPushAngleDeg: 20
    }
  },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSizeLarge: 11,
    fontSizeSmall: 5,
    labelOutlineWidth: 1,
    svgBaselineShiftEm: 0.35,
    measurementLineHeight: 0.9,
    isotopeOffsetFactor: 0.5,
    labelSpacing: {
      baseUnitScale: 0.1,
      chargeMultiplier: 0.5,
      isotopeMultiplier: 1,
      hydrogenMultiplier: 1,
      hydrogenCountMultiplier: 0
    }
  },
  annotations: {
    enabled: false,
    color: '#ff4081',
    fontSize: 9,
    offset: 12,
    formatter: null,
    mask: {
      baseScale: 0.8,
      wideScale: 0.8,
      canvasRadiusFactor: 0.666666666667
    }
  },
  visualizations: {
    weights: {
      colormap: null,
      additionalPadding: 20,
      sigma: 10,
      interval: 0,
      opacity: 1
    },
    gaussianDefaults: {
      defaultSigma: 0.3,
      domainMin: -1,
      domainMax: 1,
      defaultColormap: [
        '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef',
        '#ffffff',
        '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221'
      ]
    }
  },
  reactions: {
    scale: null,
    spacing: { bondLengthMultiplier: 0.333333333333 },
    font: { scale: 0.8, family: null },
    plus: { sizeBondLengthMultiplier: 0.3, thicknessBondThicknessMultiplier: 1 },
    arrow: {
      lengthBondLengthMultiplier: 4,
      headSizeBondLengthMultiplier: 0.2,
      thicknessBondThicknessMultiplier: 1,
      marginBondLengthMultiplier: 0.1
    },
    weights: { normalize: false }
  },
  appearance: {
    themes: {
      dark: { ... },
      light: { ... },
      oldschool: { ... },
      solarized: { ... },
      'solarized-dark': { ... },
      matrix: { ... },
      github: { ... },
      carbon: { ... },
      cyberpunk: { ... },
      gruvbox: { ... },
      'gruvbox-dark': { ... },
      custom: { ... }
    },
    highlights: {
      fallbackColor: '#03fc9d',
      fallbackRadiusFactor: 0.333333333333
    }
  },
  pixelExport: {
    viewboxYOffset: -0.5
  }
}
```

<!-- AUTO-GENERATED:DEFAULT_OPTIONS_END -->

Each theme maps element symbols (`C`, `O`, `N`, `F`, `CL`, `BR`, `I`, `P`, `S`, `B`, `SI`, `H`) plus `BACKGROUND` and `HIGHLIGHT` to hex colours. See the source in `src/config/DefaultOptions.ts` for the full colour definitions, or use the `custom` theme as a starting point.

## Atom Annotations

SmilesDrawer can persist arbitrary metadata per atom via `registerAtomAnnotation`, `setAtomAnnotation`, and `setAtomAnnotationByAtomIndex`. Set `annotations.enabled` to `true` to render values next to each atom, and optionally provide a `formatter` to customize the label text.

```javascript
const drawer = new SmilesDrawer.Drawer({
    annotations: {
        enabled: true,
        formatter: ({ annotations }) =>
            annotations.label ? `@${annotations.label}` : null,
    },
});

drawer.registerAtomAnnotation('label', 'Ligand');

SmilesDrawer.parse('c1ccccc1', function (tree) {
    drawer.draw(tree, 'output-svg', 'light');
});
```

## Framework Examples

<details>
    <summary>Svelte</summary>

```html
<!--file: Molecule.svelte-->
<script>
    import { afterUpdate } from "svelte";
    import SmilesDrawer from "smiles-drawer";

    export let smiles = "";

    const SETTINGS = {
        canvas: { width: 300, height: 200 },
    };
    let drawer = new SmilesDrawer.SvgDrawer(SETTINGS);
    let svgElement;

    afterUpdate(() => {
        SmilesDrawer.parse(smiles, function (tree) {
            drawer.draw(tree, svgElement, "light");
        });
    });
</script>

<div>
    <svg bind:this={svgElement} data-smiles={smiles} />
</div>

<style>
    svg {
        width: 300px;
        height: 200px;
    }
</style>

<!--usage-->
<Molecule smiles="CCCO" />
```

</details>

## Bridged Rings

Bridged rings are positioned using the Kamada-Kawai algorithm. When a bridged ring is present, explicitly defined aromatic rings are drawn with dashed gray lines where double bonds would be, rather than a circle inside the ring.

## Building

```bash
npm install
gulp
```

### GitHub Pages bundle

Generate a deploy-ready bundle with API docs and the interactive playground:

```bash
npm run build:pages
```

This creates `pages/` with a landing page, the playground, and JSDoc output. Publish the directory to whichever branch GitHub Pages consumes.

## Testing

### Smoke Testing

Generate SVG and JSON outputs without comparison (quick sanity check):

```bash
# Quick test with the fastregression dataset
npm run test:smoke

# Test a specific dataset
npm run test:smoke chembl

# Test all datasets
npm run test:smoke -- -all
```

Results are saved to `test/smoketest/`. Each HTML file includes the commit hash and git diff for debugging.

### Regression Testing

Compare rendering between code versions:

```bash
# Test against current HEAD
npm run test:regression

# Test against a specific commit or branch
npm run test:regression master

# Full comparison across all datasets
npm run test:regression master -- -all

# Fast fail-early check
npm run test:regression -- -failearly -novisual
```

Results are saved to `test/regression-results/` with side-by-side HTML comparisons and JSON diffs.

The regression JSON includes `ringDiagnostics`, `chiralDict`, and `cisTransDiagnostics` sections for detailed debugging. For focused investigation you can dump diagnostics for a single molecule:

```bash
node scripts/dump-rings.js --smiles "<SMILES>" --pretty
node scripts/dump-cis-trans.js --smiles "<SMILES>" --pretty
```

## Citation

If you use this code or application, please cite the original paper published by the Journal of Chemical Information and Modeling: [10.1021/acs.jcim.7b00425](http://dx.doi.org/10.1021/acs.jcim.7b00425)

## Contributors

Thank you for contributing:
- SRI International's CSE group (for the excellent SVG support)
- [ohardy](https://github.com/ohardy)
