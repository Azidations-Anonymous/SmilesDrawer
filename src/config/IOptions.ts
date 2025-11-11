import { AtomVisualization } from '../types/CommonTypes';
import Vertex = require('../graph/Vertex');

type AtomAnnotationFormatter = (input: {
  vertex: Vertex;
  annotations: Record<string, unknown>;
}) => string | null;

/**
 * Color theme for rendering molecular structures
 */
interface IThemeColors {
  C: string;
  O: string;
  N: string;
  F: string;
  CL: string;
  BR: string;
  I: string;
  P: string;
  S: string;
  B: string;
  SI: string;
  H: string;
  BACKGROUND: string;
}

/**
 * Heatmap/weight visualization configuration
 */
interface IWeightOptions {
  colormap: string[] | null;
  additionalPadding: number;
  sigma: number;
  interval: number;
  opacity: number;
}

interface IThemeMap {
  dark: IThemeColors;
  light: IThemeColors;
  oldschool: IThemeColors;
  solarized: IThemeColors;
  "solarized-dark": IThemeColors;
  matrix: IThemeColors;
  github: IThemeColors;
  carbon: IThemeColors;
  cyberpunk: IThemeColors;
  gruvbox: IThemeColors;
  "gruvbox-dark": IThemeColors;
  custom: IThemeColors;
  [themeName: string]: IThemeColors;
}

/**
 * Molecular drawing options
 */
interface IMoleculeOptions {
  version: string;
  // Canvas dimensions
  width: number;
  height: number;
  scale: number;
  padding: number;

  // Bond rendering
  bondThickness: number;
  bondLength: number;
  shortBondLength: number;
  bondSpacing: number;

  // Atom rendering
  atomVisualization: AtomVisualization;
  terminalCarbons: boolean;
  explicitHydrogens: boolean;
  aromaticPiSystemInset?: number;

  // Stereochemistry
  isomeric: boolean;

  // Layout/algorithm options
  compactDrawing: boolean;
  overlapSensitivity: number;
  overlapResolutionIterations: number;
  finetuneOverlap: boolean;
  finetuneOverlapMaxSteps: number;
  finetuneOverlapMaxDurationMs: number;
  showAtomAnnotations: boolean;
  atomAnnotationColor: string;
  atomAnnotationFontSize: number;
  atomAnnotationOffset: number;
  atomAnnotationFormatter?: AtomAnnotationFormatter | null;

  // Kamada-Kawai force layout parameters
  kkThreshold: number;
  kkInnerThreshold: number;
  kkMaxIteration: number;
  kkMaxInnerIteration: number;
  kkMaxEnergy: number;

  // Typography
  fontFamily: string;
  fontSizeLarge: number;
  fontSizeSmall: number;
  labelOutlineWidth?: number;
  labelMaskRadiusScale?: number;
  labelMaskRadiusScaleWide?: number;

  // Debugging
  debug: boolean;

  // Weight visualization
  weights: IWeightOptions;

  // Themes
  themes: {
    dark: IThemeColors;
    light: IThemeColors;
    oldschool: IThemeColors;
    solarized: IThemeColors;
    "solarized-dark": IThemeColors;
    matrix: IThemeColors;
    github: IThemeColors;
    carbon: IThemeColors;
    cyberpunk: IThemeColors;
    gruvbox: IThemeColors;
    "gruvbox-dark": IThemeColors;
    custom: IThemeColors;
    [themeName: string]: IThemeColors; // Allow custom themes
  };

  // Computed properties (set by OptionsManager)
  halfBondSpacing?: number;
  bondLengthSq?: number;
  halfFontSizeLarge?: number;
  quarterFontSizeLarge?: number;
  fifthFontSizeSmall?: number;
}

/**
 * Arrow configuration for reaction diagrams
 */
interface IArrowOptions {
  length: number;
  headSize: number;
  thickness: number;
  margin: number;
}

/**
 * Plus sign configuration for reaction diagrams
 */
interface IPlusOptions {
  size: number;
  thickness: number;
}

/**
 * Reaction-specific weight options
 */
interface IReactionWeightOptions {
  normalize: boolean;
}

/**
 * Reaction drawing options
 */
interface IReactionOptions {
  scale: number;
  fontSize: number;
  fontFamily: string;
  spacing: number;
  plus: IPlusOptions;
  arrow: IArrowOptions;
  weights: IReactionWeightOptions;
}

/**
 * Attached pseudo element information for rendering
 */
interface IAttachedPseudoElement {
  element: string;
  count: number;
  hydrogenCount: number;
  previousElement: string;
  charge: number;
}

type AttachedPseudoElements = Record<string, IAttachedPseudoElement>;

interface IUserMetaOptions {
  version: string;
  schemaRevision: number;
  debug: boolean;
}

interface ICanvasOptions {
  width: number;
  height: number;
  scale: number;
  padding: number;
}

interface IRenderingBondOptions {
  bondThickness: number;
  bondLength: number;
  shortBondLength: number;
  bondSpacing: number;
}

interface IRenderingAtomOptions {
  atomVisualization: AtomVisualization;
  terminalCarbons: boolean;
  explicitHydrogens: boolean;
}

interface IRenderingStereochemistryOptions {
  isomeric: boolean;
  shadowShortenPx: number;
  wedgeTipPaddingPx: number;
  wedgeTipFontScale: number;
  wedgeSidePaddingPx: number;
  dashedStepFactor: number;
  dashedWidthFactorSvg: number;
  dashedWidthFactorCanvas: number;
  dashedColorSwitchThreshold: number;
  dashedInsetPx: number;
}

interface IRenderingAromaticOptions {
  piSystemInset: number;
  overlayInset: number;
  overlayClampRatio: number;
}

interface IRenderingOptions {
  bonds: IRenderingBondOptions;
  atoms: IRenderingAtomOptions;
  stereochemistry: IRenderingStereochemistryOptions;
  aromatic: IRenderingAromaticOptions;
}

interface ILayoutGraphOptions {
  compactDrawing: boolean;
  overlapSensitivity: number;
  overlapResolutionIterations: number;
  defaultBranchAngleRad: number;
  linearBondToleranceRad: number;
  rotationSnapIncrementDeg: number;
  rotationSnapDeadzoneDeg: number;
  centerOfMassRadiusFactor: number;
  rotationJitterEpsilon: number;
}

interface ILayoutFinetuneOptions {
  enabled: boolean;
  maxSteps: number;
  maxDurationMs: number;
}

interface ILayoutForceOptions {
  kkThreshold: number;
  kkInnerThreshold: number;
  kkMaxIteration: number;
  kkMaxInnerIteration: number;
  kkMaxEnergy: number;
  hessianMinimum: number;
}

interface ILayoutOverlapOptions {
  ringDivisionSegments: number;
  finetuneClashDistanceFactor: number;
  rotatableEdgeCenteringFactor: number;
}

interface ILayoutOptions {
  graph: ILayoutGraphOptions;
  finetune: ILayoutFinetuneOptions;
  force: ILayoutForceOptions;
  overlap: ILayoutOverlapOptions;
}

interface ITypographyOptions {
  fontFamily: string;
  fontSizeLarge: number;
  fontSizeSmall: number;
  labelOutlineWidth: number;
  svgBaselineShiftEm: number;
  measurementLineHeight: number;
  isotopeOffsetFactor: number;
  labelSpacing: {
    baseUnitScale: number;
    chargeMultiplier: number;
    isotopeMultiplier: number;
    hydrogenMultiplier: number;
    hydrogenCountMultiplier: number;
  };
}

interface IAnnotationMaskOptions {
  baseScale: number;
  wideScale: number;
  canvasRadiusFactor: number;
}

interface IAnnotationOptions {
  enabled: boolean;
  color: string;
  fontSize: number;
  offset: number;
  formatter: AtomAnnotationFormatter | null;
  mask: IAnnotationMaskOptions;
}

interface IAppearanceOptions {
  themes: IThemeMap;
  highlights: {
    fallbackColor: string;
    fallbackRadiusFactor: number;
  };
}

interface IVisualizationsOptions {
  weights: IWeightOptions;
  gaussianDefaults: {
    defaultSigma: number;
    domainMin: number;
    domainMax: number;
    defaultColormap: string[];
  };
}

interface IPixelExportOptions {
  viewboxYOffset: number;
}

interface IUserOptions {
  meta: IUserMetaOptions;
  canvas: ICanvasOptions;
  rendering: IRenderingOptions;
  layout: ILayoutOptions;
  typography: ITypographyOptions;
  annotations: IAnnotationOptions;
  visualizations: IVisualizationsOptions;
  appearance: IAppearanceOptions;
  pixelExport: IPixelExportOptions;
}

export {
  IThemeColors,
  IThemeMap,
  IWeightOptions,
  IMoleculeOptions,
  IUserOptions,
  IUserMetaOptions,
  ICanvasOptions,
  IRenderingOptions,
  ILayoutOptions,
  ITypographyOptions,
  IAnnotationOptions,
  IAppearanceOptions,
  IVisualizationsOptions,
  IPixelExportOptions,
  IArrowOptions,
  IPlusOptions,
  IReactionWeightOptions,
  IReactionOptions,
  IAttachedPseudoElement,
  AttachedPseudoElements,
  AtomAnnotationFormatter
};
