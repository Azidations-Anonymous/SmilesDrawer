import {
  IMoleculeOptions,
  IUserOptions,
  IThemeMap
} from './IOptions';
import packageJson = require('../../package.json');

const themeDefaults: IThemeMap = {
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
    BACKGROUND: '#141414'
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
    BACKGROUND: '#fff'
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
    BACKGROUND: '#fff'
  },
  "solarized": {
    C: "#586e75",
    O: "#dc322f",
    N: "#268bd2",
    F: "#859900",
    CL: "#16a085",
    BR: "#cb4b16",
    I: "#6c71c4",
    P: "#d33682",
    S: "#b58900",
    B: "#2aa198",
    SI: "#2aa198",
    H: "#657b83",
    BACKGROUND: "#fff"
  },
  "solarized-dark": {
    C: "#93a1a1",
    O: "#dc322f",
    N: "#268bd2",
    F: "#859900",
    CL: "#16a085",
    BR: "#cb4b16",
    I: "#6c71c4",
    P: "#d33682",
    S: "#b58900",
    B: "#2aa198",
    SI: "#2aa198",
    H: "#839496",
    BACKGROUND: "#fff"
  },
  "matrix": {
    C: "#678c61",
    O: "#2fc079",
    N: "#4f7e7e",
    F: "#90d762",
    CL: "#82d967",
    BR: "#23755a",
    I: "#409931",
    P: "#c1ff8a",
    S: "#faff00",
    B: "#50b45a",
    SI: "#409931",
    H: "#426644",
    BACKGROUND: "#fff"
  },
  "github": {
    C: "#24292f",
    O: "#cf222e",
    N: "#0969da",
    F: "#2da44e",
    CL: "#6fdd8b",
    BR: "#bc4c00",
    I: "#8250df",
    P: "#bf3989",
    S: "#d4a72c",
    B: "#fb8f44",
    SI: "#bc4c00",
    H: "#57606a",
    BACKGROUND: "#fff"
  },
  "carbon": {
    C: "#161616",
    O: "#da1e28",
    N: "#0f62fe",
    F: "#198038",
    CL: "#007d79",
    BR: "#fa4d56",
    I: "#8a3ffc",
    P: "#ff832b",
    S: "#f1c21b",
    B: "#8a3800",
    SI: "#e67e22",
    H: "#525252",
    BACKGROUND: "#fff"
  },
  "cyberpunk": {
    C: "#ea00d9",
    O: "#ff3131",
    N: "#0abdc6",
    F: "#00ff9f",
    CL: "#00fe00",
    BR: "#fe9f20",
    I: "#ff00ff",
    P: "#fe7f00",
    S: "#fcee0c",
    B: "#ff00ff",
    SI: "#ffffff",
    H: "#913cb1",
    BACKGROUND: "#fff"
  },
  "gruvbox": {
    C: "#665c54",
    O: "#cc241d",
    N: "#458588",
    F: "#98971a",
    CL: "#79740e",
    BR: "#d65d0e",
    I: "#b16286",
    P: "#af3a03",
    S: "#d79921",
    B: "#689d6a",
    SI: "#427b58",
    H: "#7c6f64",
    BACKGROUND: "#fbf1c7"
  },
  "gruvbox-dark": {
    C: "#ebdbb2",
    O: "#cc241d",
    N: "#458588",
    F: "#98971a",
    CL: "#b8bb26",
    BR: "#d65d0e",
    I: "#b16286",
    P: "#fe8019",
    S: "#d79921",
    B: "#8ec07c",
    SI: "#83a598",
    H: "#bdae93",
    BACKGROUND: "#282828"
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
    BACKGROUND: '#fff'
  }
};

const defaultGaussianColormap = [
  "#c51b7d",
  "#de77ae",
  "#f1b6da",
  "#fde0ef",
  "#ffffff",
  "#e6f5d0",
  "#b8e186",
  "#7fbc41",
  "#4d9221"
];

const cloneThemes = (): IThemeMap => JSON.parse(JSON.stringify(themeDefaults));

export function getLegacyDefaultOptions(): IMoleculeOptions {
  return {
    version: packageJson.version,
    width: 500,
    height: 500,
    scale: 0.0,
    bondThickness: 1.0,
    bondLength: 30,
    shortBondLength: 0.7,
    bondSpacing: 0.17 * 30,
    atomVisualization: 'default',
    isomeric: true,
    debug: false,
    terminalCarbons: false,
    explicitHydrogens: false,
    aromaticPiSystemInset: 7,
    overlapSensitivity: 0.42,
    overlapResolutionIterations: 1,
    finetuneOverlap: true,
    finetuneOverlapMaxSteps: 64,
    finetuneOverlapMaxDurationMs: 50,
    showAtomAnnotations: false,
    atomAnnotationColor: '#ff4081',
    atomAnnotationFontSize: 9,
    atomAnnotationOffset: 12,
    atomAnnotationFormatter: null,
    compactDrawing: true,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSizeLarge: 11,
    fontSizeSmall: 5,
    labelOutlineWidth: 1,
    labelMaskRadiusScale: 0.8,
    labelMaskRadiusScaleWide: 0.8,
    padding: 10.0,
    kkThreshold: 0.1,
    kkInnerThreshold: 0.1,
    kkMaxIteration: 20000,
    kkMaxInnerIteration: 50,
    kkMaxEnergy: 1e9,
    weights: {
      colormap: null,
      additionalPadding: 20.0,
      sigma: 10,
      interval: 0.0,
      opacity: 1.0,
    },
    themes: cloneThemes()
  };
}

export function getDefaultUserOptions(): IUserOptions {
  return {
    meta: {
      version: packageJson.version,
      schemaRevision: 1,
      debug: false
    },
    canvas: {
      width: 500,
      height: 500,
      scale: 0.0,
      padding: 10.0
    },
    rendering: {
      bonds: {
        bondThickness: 1.0,
        bondLength: 30,
        shortBondLength: 0.7,
        bondSpacing: 0.17 * 30,
        dashPattern: [3, 2]
      },
      atoms: {
        atomVisualization: 'default',
        terminalCarbons: false,
        explicitHydrogens: false,
        ballRadiusBondFraction: 1 / 4.5,
        pointRadius: 0.75,
        pointMaskRadius: 1.5
      },
      stereochemistry: {
        isomeric: true,
        shadowShortenPx: 5.0,
        wedgeTipPaddingPx: 3.0,
        wedgeTipFontScale: 0.25,
        wedgeSidePaddingPx: 1.5,
        dashedStepFactor: 1.25,
        dashedWidthFactorSvg: 0.5,
        dashedWidthFactorCanvas: 1.5,
        dashedColorSwitchThreshold: 0.5,
        dashedInsetPx: 1.0
      },
      aromatic: {
        piSystemInset: 7,
        overlayInset: 7,
        overlayClampRatio: 0.5
      }
    },
    layout: {
      graph: {
        compactDrawing: true,
        overlapSensitivity: 0.42,
        overlapResolutionIterations: 1,
        defaultBranchAngleRad: 1.0472,
        linearBondToleranceRad: 0.1,
        rotationSnapIncrementDeg: 30,
        rotationSnapDeadzoneDeg: 15,
        finetuneRotationOffsetDeg: 1,
        centerOfMassRadiusFactor: 2.0,
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
        kkMaxEnergy: 1e9,
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
        isotopeMultiplier: 1.0,
        hydrogenMultiplier: 1.0,
        hydrogenCountMultiplier: 0.0
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
        canvasRadiusFactor: 2 / 3
      }
    },
    visualizations: {
      weights: {
        colormap: null,
        additionalPadding: 20.0,
        sigma: 10,
        interval: 0.0,
        opacity: 1.0
      },
      gaussianDefaults: {
        defaultSigma: 0.3,
        domainMin: -1.0,
        domainMax: 1.0,
        defaultColormap: [...defaultGaussianColormap]
      }
    },
    reactions: {
      scale: null,
      spacing: {
        bondLengthMultiplier: 10 / 30
      },
      font: {
        scale: 0.8,
        family: null
      },
      plus: {
        sizeBondLengthMultiplier: 9 / 30,
        thicknessBondThicknessMultiplier: 1.0
      },
      arrow: {
        lengthBondLengthMultiplier: 4.0,
        headSizeBondLengthMultiplier: 6 / 30,
        thicknessBondThicknessMultiplier: 1.0,
        marginBondLengthMultiplier: 3 / 30
      },
      weights: {
        normalize: false
      }
    },
    appearance: {
      themes: cloneThemes(),
      highlights: {
        fallbackColor: '#03fc9d',
        fallbackRadiusFactor: 1 / 3
      }
    },
    pixelExport: {
      viewboxYOffset: -0.5
    }
  };
}

export default getLegacyDefaultOptions;
