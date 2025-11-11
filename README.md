# SmilesDrawer 2.0

No server, no images, no templates, just a SMILES 😊

Current Version: **2.1.10**

<table style="width: 100%; table-layout: fixed">
    <tbody>
        <tr>
            <td><a href="https://smilesdrawer.rocks">Molecules</a></td>
            <td><a href="https://smilesdrawer.rocks">Reactions & Highlights</a></td>
        </tr>
        <tr>
            <td><a href="https://smilesdrawer.rocks"><img src="https://github.com/reymond-group/smilesDrawer/raw/master/readme/main.png"></img></a></td>
            <td><a href="https://smilesdrawer.rocks"><img src="https://github.com/reymond-group/smilesDrawer/raw/master/readme/rxn_highlight.png"></img></a></td>
        </tr>
        <tr>
            <td><a href="https://smilesdrawer.surge.sh/use.html">Learn & Copy-Paste</a></td>
            <td><a href="https://smilesdrawer.surge.sh/playground.html">Style & Customize</a></td>
        </tr>
        <tr>
            <td><a href="https://smilesdrawer.surge.sh/use.html"><img src="https://github.com/reymond-group/smilesDrawer/raw/master/readme/learn.png"></img></a></td>
            <td><a href="https://smilesdrawer.surge.sh/playground.html"><img src="https://github.com/reymond-group/smilesDrawer/raw/master/readme/style.png"></img></a></td>
        </tr>
    </tbody>
</table>

### Examples in Specific Frameworks

<details>
    <summary>Svelte </summary>

```html
<!--file:Molecule.svlete-->
<!--Tested against v2.1.7 of smiles-drawer-->
<script>
    import { afterUpdate } from "svelte";
    import SmilesDrawer from "smiles-drawer";

    export let smiles = "";

    const SETTINGS = {
        width: 300,
        height: 200,
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

### Please cite

If you use this code or application, please cite the original paper published by the Journal of Chemical Information and Modeling: [10.1021/acs.jcim.7b00425](http://dx.doi.org/10.1021/acs.jcim.7b00425)

## Legacy Documentation

As of now, there is full backwards compatibility.

### Examples

An example using the light theme can be found [here](http://doc.gdb.tools/smilesDrawer/sd/example/index_light.html), while one using the dark theme can be found [here](http://doc.gdb.tools/smilesDrawer/sd/example/index.html) . The colors of SmilesDrawer are completely configurable.

Examples showing molecules from different databases:

- [Drugbank](http://doc.gdb.tools/smilesDrawer/sd/test/browser.html?set=drugbank)
- [GDB-17](http://doc.gdb.tools/smilesDrawer/sd/test/browser.html?set=gdb17)
- [FDB-17](http://doc.gdb.tools/smilesDrawer/sd/test/browser.html?set=fdb)
- [SureChEMBL](http://doc.gdb.tools/smilesDrawer/sd/test/browser.html?set=schembl)
- [ChEMBL](http://doc.gdb.tools/smilesDrawer/sd/test/browser.html?set=chembl)

A very simple JSFiddle example can be found [here](https://jsfiddle.net/zjdtkL57/1/). This example shows the `SmilesDrawer.apply()` functionality which draws the structure for every `canvas` element with a `data-smiles` attribute. E.g. `<canvas data-smiles="C1CCCCC1"></canvas>`

### SSSR Parity (PIKAChU)

SmilesDrawer now always uses the parity-correct SSSR ring detection pipeline (Johnson cycle enumeration plus canonical candidates), so complex ring systems no longer require a separate “experimental” toggle.

#### What changed?
- **Johnson cycle inventory** – every draw runs the TypeScript port of Johnson’s algorithm so both SSSR selection and aromaticity checks start from the full cycle catalog instead of just Floyd–Warshall paths.
- **Parity-aware sizing** – candidate ordering mirrors `pikachu/drawing/sssr.py`, storing even/odd length information explicitly (no more `d + 0.5` hack), which keeps sort stability and avoids floating noise.
- **Set-based deduplication** – bonds/paths are tracked via canonical serialisations, eliminating the nested-array normalisation fix-ups that used to drop macrocycles.
- **Ordered ring output** – rings are reconstructed along the molecular graph before returning, guaranteeing deterministic layouts and consistent aromaticity overlays.
- **One-extra guard** – collection stops only after PIKAChU’s “allow one extra candidate” condition (`> nSSSR`), which prevents undercounting fused rings.

Regression tests in `test/sssr.js` cover fused aromatics, adamantane cages, ferrioxamine macrocycles, and the Additional file 2 Fig. S2 macrocycle from the PIKAChU paper so the behaviour stays locked.

### "Installation"

SmilesDrawer is available from the unpkg content delivery network:

```
https://unpkg.com/smiles-drawer@1.2.0/dist/smiles-drawer.min.js
```

You can easily get smiles-drawer using yarn:

```
yarn add smiles-drawer
```

or you can just download the files from here.

### Building Smiles Drawer

If you decide not to use the ready-to-go scripts in `dist`, you can (edit and) build the project by running:

```bash
npm install
gulp
```

### GitHub Pages bundle

Generate a deploy-ready bundle that hosts both the API docs and the interactive playground:

```bash
npm run build:pages
```

This clears and recreates `pages/` with:
- `pages/index.html` – small landing hub linking to the playground and the docs
- `pages/playground/` – a direct copy of `example/smilesdrawer.surge.sh/`
- `pages/docs/` – the current JSDoc output

Behind the scenes the command runs `gulp build` (distribution bundle) and `gulp doc` (JSDoc) before writing everything into `pages/`, ensuring the published assets are always fresh.

Commit/publish the `pages/` directory to whichever branch or folder GitHub Pages consumes (e.g. `main` + `/pages` via GitHub Actions) to update the public site.

### Testing

SmilesDrawer includes comprehensive regression testing to detect rendering differences between code versions, and smoke testing for quick sanity checks.

#### Smoke Testing

Generate SVG and JSON outputs for current codebase without comparison (fast sanity check):

```bash
npm run test:smoke [dataset] -- [-all]
```

**Flags:**
- `-all` - Test all datasets (default: `fastregression` dataset only)
- `[dataset]` - Specify dataset: `chembl`, `drugbank`, `fdb`, `force`, `gdb17`, `schembl`

**Common Usage:**

```bash
# Quick test with fastregression dataset
npm run test:smoke

# Test specific dataset
npm run test:smoke chembl

# Test all datasets
npm run test:smoke -- -all
```

**Output:**

Results are saved to `test/smoketest/`:
- **`N.html`** - SVG rendering with JSON position data
- **`N.json`** - JSON position data only

Each HTML file includes commit hash and git diff of uncommitted src/ changes for debugging.

#### Regression Testing

Compare molecular structure rendering between code versions:

```bash
npm run test:regression [commit/branch] -- [-all] [-failearly] [-novisual]
```

**Flags:**
- `-all` - Test all datasets (default: fastregression dataset only)
- `-failearly` - Stop at first difference (default: collect all differences)
- `-novisual` - Skip SVG generation, JSON only (default: generate HTML + JSON)

**Common Usage:**

```bash
# Quick test against current HEAD (default)
npm run test:regression

# Test against a specific commit or branch
npm run test:regression master
npm run test:regression HEAD~1

# Test all datasets comprehensively
npm run test:regression -- -all

# Fast fail-early check (stops at first diff)
npm run test:regression -- -failearly -novisual

# Full comparison against master
npm run test:regression master -- -all
```

**Output:**

Results are saved to `test/regression-results/`:
- **`N.html`** - Side-by-side SVG visual comparison (unless `-novisual`)
- **`N.json`** - JSON data with `{old, new}` fields for detailed analysis

The JSON format enables both visual inspection (HTML) and programmatic diff analysis (JSON).

Every regression JSON now embeds a `ringDiagnostics` block (SSSR lists, cycle inventory, full `RingManager` state, and aromatic overlays) for both the baseline and the current build. Pair it with the per-edge `chiralDict` export and the new `cisTransDiagnostics` section (per double bond orientation checks) to see exactly which substituent pairs were tested and whether the drawing matched the stored intent. For focused investigations you can dump the same diagnostics without running the full regression harness:

```bash
# Ring inventory, SSSR, and per-atom ring membership
node scripts/dump-rings.js --smiles "<SMILES>" --pretty

# Cis/trans neighbour map and chiralDict entries for every stereo double bond
node scripts/dump-cis-trans.js --smiles "<SMILES>" --pretty
```

These helpers print directly to stdout (or `--output`), which makes it easy to diff SmilesDrawer against PIKAChU’s `pikachu-ring-dump`.

### Getting Started

To get a simple input box which lets the user enter a SMILES and then display it in a canvas, the following minimal example is sufficient.
In order to have nice consistent font rendering you have to include the droid sans font from google fonts.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <title>Smiles Drawer Example</title>
    <meta name="description" content="A minimal smiles drawer example." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <link
      href="https://fonts.googleapis.com/css?family=Droid+Sans:400,700"
      rel="stylesheet"
    />
  </head>
  <body>
    <input id="example-input" name="example-input" />
    <canvas id="example-canvas" width="500" height="500"></canvas>

    <script src="https://unpkg.com/smiles-drawer@1.0.10/dist/smiles-drawer.min.js"></script>
    <script>
      let input = document.getElementById("example-input");
      let options = {};

      // Initialize the drawer to draw to canvas
      let smilesDrawer = new SmilesDrawer.Drawer(options);
      // Alternatively, initialize the SVG drawer:
      // let svgDrawer = new SmilesDrawer.SvgDrawer(options);

      input.addEventListener("input", function() {
        // Clean the input (remove unrecognized characters, such as spaces and tabs) and parse it
        SmilesDrawer.parse(input.value, function(tree) {
          // Draw to the canvas
          smilesDrawer.draw(tree, "example-canvas", "light", false);
          // Alternatively, draw to SVG:
          // svgDrawer.draw(tree, 'output-svg', 'dark', false);
        });
      });
    </script>
  </body>
</html>
```

See the example folder for a more complete example.

### Options

The options are supplied to the constructor as shown in the example above.

```javascript
let options = { ... };
let smilesDrawer = new SmilesDrawer(options);
```

The following options are available:

| Option                                                          | Identifier                  | Data Type                           | Default Value |
| --------------------------------------------------------------- | --------------------------- | ----------------------------------- | ------------- |
| Drawing width                                                   | width                       | number                              | 500           |
| Drawing height                                                  | height                      | number                              | 500           |
| Bond thickness                                                  | bondThickness               | number                              | 0.6           |
| Bond length                                                     | bondLength                  | number                              | 15            |
| Short bond length (e.g. double bonds) in percent of bond length | shortBondLength             | number                              | 0.75          |
| Bond spacing (e.g. space between double bonds)                  | bondSpacing                 | number                              | 0.18 \* 15    |
| Atom Visualization                                              | atomVisualization           | string ['default', 'balls', 'none'] | 'default'     |
| Large Font Size (in pt for elements)                            | fontSizeLarge               | number                              | 6             |
| Small Font Size (in pt for numbers)                             | fontSizeSmall               | number                              | 4             |
| Label outline width (px)                                        | labelOutlineWidth           | number                              | 1             |
| Label mask radius scale                                         | labelMaskRadiusScale        | number                              | 0.75          |
| Label mask radius scale for multi-letter symbols                | labelMaskRadiusScaleWide    | number                              | 1.1           |
| Padding                                                         | padding                     | number                              | 20.0          |
| Show Terminal Carbons (CH3)                                     | terminalCarbons             | boolean                             | false         |
| Show explicit hydrogens                                         | explicitHydrogens           | boolean                             | false         |
| Overlap sensitivity                                             | overlapSensitivity          | number                              | 0.42          |
| # of overlap resolution iterations                              | overlapResolutionIterations | number                              | 1             |
| Enable overlap finetuning pass                                  | finetuneOverlap             | boolean                             | true          |
| Finetune overlap iteration cap (candidate edges per pass, 0 = skip) | finetuneOverlapMaxSteps     | number                              | 64            |
| Finetune overlap time budget (milliseconds per pass, 0 = unlimited) | finetuneOverlapMaxDurationMs| number                              | 50            |
| Enable atom annotation labels                                   | showAtomAnnotations         | boolean                             | false         |
| Draw concatenated terminals and pseudo elements                 | compactDrawing              | boolean                             | true          |
| Draw isometric SMILES if available                              | isometric                   | boolean                             | true          |
| Debug (draw debug information to canvas)                        | debug                       | boolean                             | false         |
| Color themes                                                    | themes                      | object                              | see below     |

The default options are defined as follows (auto-generated via `node scripts/update-readme-default-options.js`):

<!-- AUTO-GENERATED:DEFAULT_OPTIONS_START -->

```javascript
{
  meta: {
    version: '3.0.0',
    schemaRevision: 1,
    debug: false
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
      dashPattern: [
        3,
        2
      ],
      tripleBondSpacingDivider: 1.5
    },
    atoms: {
      atomVisualization: 'default',
      terminalCarbons: false,
      explicitHydrogens: false,
      ballRadiusBondFraction: 0.222222222222,
      pointRadius: 0.75,
      pointMaskRadius: 1.5
    },
    stereochemistry: {
      isomeric: true,
      shadowShortenPx: 5,
      wedgeTipPaddingPx: 3,
      wedgeTipFontScale: 0.25,
      wedgeSidePaddingPx: 1.5,
      dashedStepFactor: 1.25,
      dashedWidthFactorSvg: 0.5,
      dashedWidthFactorCanvas: 1.5,
      dashedColorSwitchThreshold: 0.5,
      dashedInsetPx: 1
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
      maxSteps: 64,
      maxDurationMs: 50
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
        '#c51b7d',
        '#de77ae',
        '#f1b6da',
        '#fde0ef',
        '#ffffff',
        '#e6f5d0',
        '#b8e186',
        '#7fbc41',
        '#4d9221'
      ]
    }
  },
  reactions: {
    scale: null,
    spacing: {
      bondLengthMultiplier: 0.333333333333
    },
    font: {
      scale: 0.8,
      family: null
    },
    plus: {
      sizeBondLengthMultiplier: 0.3,
      thicknessBondThicknessMultiplier: 1
    },
    arrow: {
      lengthBondLengthMultiplier: 4,
      headSizeBondLengthMultiplier: 0.2,
      thicknessBondThicknessMultiplier: 1,
      marginBondLengthMultiplier: 0.1
    },
    weights: {
      normalize: false
    }
  },
  appearance: {
    themes: {
      dark: {
        C: '#fff',
        O: '#e74c3c',
        N: '#3498db',
        F: '#27ae60',
        CL: '#16a085',
        BR: '#d35400',
        I: '#8e44ad',
        P: '#d35400',
        S: '#f1c40f',
        B: '#e67e22',
        SI: '#e67e22',
        H: '#aaa',
        BACKGROUND: '#141414',
        HIGHLIGHT: '#03fc9d'
      },
      light: {
        C: '#222',
        O: '#e74c3c',
        N: '#3498db',
        F: '#27ae60',
        CL: '#16a085',
        BR: '#d35400',
        I: '#8e44ad',
        P: '#d35400',
        S: '#f1c40f',
        B: '#e67e22',
        SI: '#e67e22',
        H: '#666',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      },
      oldschool: {
        C: '#000',
        O: '#000',
        N: '#000',
        F: '#000',
        CL: '#000',
        BR: '#000',
        I: '#000',
        P: '#000',
        S: '#000',
        B: '#000',
        SI: '#000',
        H: '#000',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      },
      solarized: {
        C: '#586e75',
        O: '#dc322f',
        N: '#268bd2',
        F: '#859900',
        CL: '#16a085',
        BR: '#cb4b16',
        I: '#6c71c4',
        P: '#d33682',
        S: '#b58900',
        B: '#2aa198',
        SI: '#2aa198',
        H: '#657b83',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      },
      'solarized-dark': {
        C: '#93a1a1',
        O: '#dc322f',
        N: '#268bd2',
        F: '#859900',
        CL: '#16a085',
        BR: '#cb4b16',
        I: '#6c71c4',
        P: '#d33682',
        S: '#b58900',
        B: '#2aa198',
        SI: '#2aa198',
        H: '#839496',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      },
      matrix: {
        C: '#678c61',
        O: '#2fc079',
        N: '#4f7e7e',
        F: '#90d762',
        CL: '#82d967',
        BR: '#23755a',
        I: '#409931',
        P: '#c1ff8a',
        S: '#faff00',
        B: '#50b45a',
        SI: '#409931',
        H: '#426644',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      },
      github: {
        C: '#24292f',
        O: '#cf222e',
        N: '#0969da',
        F: '#2da44e',
        CL: '#6fdd8b',
        BR: '#bc4c00',
        I: '#8250df',
        P: '#bf3989',
        S: '#d4a72c',
        B: '#fb8f44',
        SI: '#bc4c00',
        H: '#57606a',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      },
      carbon: {
        C: '#161616',
        O: '#da1e28',
        N: '#0f62fe',
        F: '#198038',
        CL: '#007d79',
        BR: '#fa4d56',
        I: '#8a3ffc',
        P: '#ff832b',
        S: '#f1c21b',
        B: '#8a3800',
        SI: '#e67e22',
        H: '#525252',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      },
      cyberpunk: {
        C: '#ea00d9',
        O: '#ff3131',
        N: '#0abdc6',
        F: '#00ff9f',
        CL: '#00fe00',
        BR: '#fe9f20',
        I: '#ff00ff',
        P: '#fe7f00',
        S: '#fcee0c',
        B: '#ff00ff',
        SI: '#ffffff',
        H: '#913cb1',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      },
      gruvbox: {
        C: '#665c54',
        O: '#cc241d',
        N: '#458588',
        F: '#98971a',
        CL: '#79740e',
        BR: '#d65d0e',
        I: '#b16286',
        P: '#af3a03',
        S: '#d79921',
        B: '#689d6a',
        SI: '#427b58',
        H: '#7c6f64',
        BACKGROUND: '#fbf1c7',
        HIGHLIGHT: '#03fc9d'
      },
      'gruvbox-dark': {
        C: '#ebdbb2',
        O: '#cc241d',
        N: '#458588',
        F: '#98971a',
        CL: '#b8bb26',
        BR: '#d65d0e',
        I: '#b16286',
        P: '#fe8019',
        S: '#d79921',
        B: '#8ec07c',
        SI: '#83a598',
        H: '#bdae93',
        BACKGROUND: '#282828',
        HIGHLIGHT: '#03fc9d'
      },
      custom: {
        C: '#222',
        O: '#e74c3c',
        N: '#3498db',
        F: '#27ae60',
        CL: '#16a085',
        BR: '#d35400',
        I: '#8e44ad',
        P: '#d35400',
        S: '#f1c40f',
        B: '#e67e22',
        SI: '#e67e22',
        H: '#666',
        BACKGROUND: '#fff',
        HIGHLIGHT: '#03fc9d'
      }
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

#### SVG text parity

Every glyph (element, charges, isotopes, hydrogens, attached pseudo-elements) is drawn as its own `<text>` node with explicit `x/y` coordinates so halos, highlights, and text stay perfectly aligned in every browser. For manual comparisons you can run `npm run sample:svg-labels`, which emits `temp-svg-label-samples/svg-label-sample.svg`. Open it in different browsers to inspect halo alignment and stacked hydrogens before rolling the change into production. When you just need a quick numerical diff against the reference implementation, run `npm run parity:svg-labels`; it renders a small set of single-atom SMILES with both SmilesDrawer and PIKAChU (through `../pikachu/pikachu-run`) and reports the delta between satellite offsets.

### Atom annotations

SmilesDrawer can persist arbitrary metadata per atom via `registerAtomAnnotation`, `setAtomAnnotation`, and `setAtomAnnotationByAtomIndex`. Set the `showAtomAnnotations` option to `true` to render those values next to each atom, and optionally provide `atomAnnotationFormatter` (or call `drawer.setAtomAnnotationFormatter`) to customize the label text. Additional knobs (`atomAnnotationColor`, `atomAnnotationFontSize`, `atomAnnotationOffset`) control the appearance.

```javascript
const drawer = new SmilesDrawer.Drawer({
    showAtomAnnotations: true,
    atomAnnotationFormatter: ({ annotations }) => annotations.label ? `@${annotations.label}` : null
});

drawer.registerAtomAnnotation('label', 'Ligand');

SmilesDrawer.parse('c1ccccc1', function(tree) {
    drawer.draw(tree, 'output-svg', 'light');
});
```

### Usage

An instance of SmilesDrawer is able to draw to multiple targets. Initialize SmilesDrawer once for each set of options (you would initialize two different objects if you were to draw in two different sizes).

```javascript
let smilesDrawer = new SmilesDrawer.Drawer({ width: 250, height: 250 });
```

In order to depict a SMILES string it has to be parsed using SmilesDrawer's SMILES parser, which is encapsulated in the static function `SmilesDrawer.parse()` where the first argument is the SMILES string and the second argument a callback for a successful parsing. The third argument provides a way to handle errors using a callback.

```javascript
SmilesDrawer.parse('C1CCCCC1', function (tree) {
    smilesDrawer.draw(tree, 'output-canvas', 'light', false);
}, function (err) {
    console.log(err);
}
```

The function `smilesDrawer.draw()` requires two and accepts up to four arguments. The first argument is the parse tree returned by the parse function (through the callback), the second is the `id` of a HTML canvas element on which the structure will be drawn. The two optional arguments are whether to use the light or dark theme (defaults to `'light'`) and whether to only compute properties such as ring count, hac, etc. and not depict the structure (defaults to `false`).

### API

The SmilesDrawer object exposes methods that can be used for purposes other than drawing chemical structures.

| Method                  | Description                                                                       | Returns  |
| ----------------------- | --------------------------------------------------------------------------------- | -------- |
| `getMolecularFormula()` | Returns the molecular formula, eg. C22H30N6O4S, of the currently loaded molecule. | `String` |
| `getPositionData()` | Returns an `IMolecularData` interface providing complete access to positioning, structural data, and rendering helper methods. Includes vertices (atoms) with positions/angles, edges (bonds) with types/stereochemistry, rings, and all the helper methods used by the internal renderer. Useful for implementing custom renderers that need the same computational tools as the built-in renderer. | `IMolecularData` |

#### Example: Using `getPositionData()` for Custom Rendering

The `getPositionData()` method returns an `IMolecularData` interface that provides both raw data and helper methods used by the internal renderer:

```javascript
let smilesDrawer = new SmilesDrawer.Drawer({ width: 500, height: 500 });

SmilesDrawer.parse('c1ccccc1', function(tree) {
    // Draw the molecule first (positions atoms)
    smilesDrawer.draw(tree, 'output-canvas', 'light');

    // Get the molecular data interface
    const molData = smilesDrawer.getPositionData();

    // Access raw data
    console.log('Atoms:', molData.graph.vertices.length);
    console.log('Bonds:', molData.graph.edges.length);
    console.log('Rings:', molData.rings.length);

    // Access atom positions
    molData.graph.vertices.forEach(v => {
        console.log(`Atom ${v.id}: ${v.value.element} at (${v.position.x}, ${v.position.y})`);
    });

    // Access bond information
    molData.graph.edges.forEach(e => {
        console.log(`Bond ${e.id}: ${e.bondType} from ${e.sourceId} to ${e.targetId}`);
    });

    // Use helper methods (same as internal renderer)
    const edge = molData.graph.edges[0];
    const normals = molData.getEdgeNormals(edge);  // Get perpendicular vectors for double bonds

    const ring = molData.rings[0];
    const isAromatic = molData.isRingAromatic(ring);  // Check if ring is aromatic
    console.log('Ring aromatic?', isAromatic);

    // Serialize to JSON for storage or transmission
    const jsonData = JSON.stringify(molData);  // Automatically uses toJSON()
});
```

The `IMolecularData` interface provides:

**Properties:**
- `graph`: Complete graph with vertices (atoms) and edges (bonds)
- `rings`: Array of ring structures with member atoms
- `ringConnections`: Connections between rings
- `opts`: Drawing options
- `bridgedRing`: Whether bridged ring handling is active
- `highlight_atoms`: Highlighted atom information

**Helper Methods:**
- `getEdgeNormals(edge)`: Get perpendicular vectors for bond positioning
- `isRingAromatic(ring)`: Check if a ring is aromatic
- `areVerticesInSameRing(vertexA, vertexB)`: Check if atoms share a ring
- `chooseSide(vertexA, vertexB, sides)`: Determine which side to draw double bonds
- `getLargestOrAromaticCommonRing(vertexA, vertexB)`: Find common ring between atoms
- `getMolecularFormula()`: Get molecular formula string
- `getTotalOverlapScore()`: Get overlap score for layout quality

### Bridged Rings

Bridged rings are positioned using the Kamada–Kawai algorithm. If there is a bridged ring in the molecule, explicitly defined aromatic rings are not drawn with a circle inside the ring, but with dashed gray lines where double bonds would be.

### Contributors

Thank you for contributing:
- SRI International's CSE group (For the excellent SVG support)
- [ohardy](https://github.com/ohardy)
