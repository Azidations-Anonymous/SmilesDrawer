import Options = require('./Options');
import {
  IMoleculeOptions,
  IUserOptions,
  IDerivedOptions
} from './IOptions';
import {
  getLegacyDefaultOptions,
  getDefaultUserOptions
} from './DefaultOptions';

type UserOrLegacy =
  | Partial<IMoleculeOptions>
  | Partial<IUserOptions>;

function isUserOptionsShape(input: unknown): input is Partial<IUserOptions> {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const candidate = input as Record<string, unknown>;
  return 'canvas' in candidate || 'meta' in candidate;
}

export function translateLegacyToUser(legacy: IMoleculeOptions): IUserOptions {
  const defaults = getDefaultUserOptions();

  return {
    meta: {
      ...defaults.meta,
      debug: legacy.debug,
      version: legacy.version
    },
    canvas: {
      ...defaults.canvas,
      width: legacy.width,
      height: legacy.height,
      scale: legacy.scale,
      padding: legacy.padding
    },
    rendering: {
      bonds: {
        ...defaults.rendering.bonds,
        bondThickness: legacy.bondThickness,
        bondLength: legacy.bondLength,
        shortBondLength: legacy.shortBondLength,
        bondSpacing: legacy.bondSpacing
      },
      atoms: {
        ...defaults.rendering.atoms,
        atomVisualization: legacy.atomVisualization,
        terminalCarbons: legacy.terminalCarbons,
        explicitHydrogens: legacy.explicitHydrogens
      },
      stereochemistry: {
        ...defaults.rendering.stereochemistry,
        isomeric: legacy.isomeric
      },
      aromatic: {
        ...defaults.rendering.aromatic,
        piSystemInset: legacy.aromaticPiSystemInset ?? defaults.rendering.aromatic.piSystemInset
      }
    },
    layout: {
      graph: {
        ...defaults.layout.graph,
        compactDrawing: legacy.compactDrawing,
        overlapSensitivity: legacy.overlapSensitivity,
        overlapResolutionIterations: legacy.overlapResolutionIterations ?? defaults.layout.graph.overlapResolutionIterations
      },
      finetune: {
        ...defaults.layout.finetune,
        enabled: legacy.finetuneOverlap,
        maxSteps: legacy.finetuneOverlapMaxSteps,
        maxDurationMs: legacy.finetuneOverlapMaxDurationMs
      },
      force: {
        ...defaults.layout.force,
        kkThreshold: legacy.kkThreshold,
        kkInnerThreshold: legacy.kkInnerThreshold,
        kkMaxIteration: legacy.kkMaxIteration,
        kkMaxInnerIteration: legacy.kkMaxInnerIteration,
        kkMaxEnergy: legacy.kkMaxEnergy
      },
      overlap: {
        ...defaults.layout.overlap
      }
    },
    typography: {
      ...defaults.typography,
      fontFamily: legacy.fontFamily,
      fontSizeLarge: legacy.fontSizeLarge,
      fontSizeSmall: legacy.fontSizeSmall,
      labelOutlineWidth: legacy.labelOutlineWidth ?? defaults.typography.labelOutlineWidth,
      labelSpacing: {
        ...defaults.typography.labelSpacing
      }
    },
    annotations: {
      ...defaults.annotations,
      enabled: legacy.showAtomAnnotations,
      color: legacy.atomAnnotationColor,
      fontSize: legacy.atomAnnotationFontSize,
      offset: legacy.atomAnnotationOffset,
      formatter: legacy.atomAnnotationFormatter ?? null,
      mask: {
        ...defaults.annotations.mask,
        baseScale: legacy.labelMaskRadiusScale ?? defaults.annotations.mask.baseScale,
        wideScale: legacy.labelMaskRadiusScaleWide ?? defaults.annotations.mask.wideScale
      }
    },
    visualizations: {
      weights: {
        ...defaults.visualizations.weights,
        ...legacy.weights
      },
      gaussianDefaults: {
        ...defaults.visualizations.gaussianDefaults
      }
    },
    appearance: {
      ...defaults.appearance,
      themes: legacy.themes
    },
    pixelExport: {
      ...defaults.pixelExport
    }
  };
}

export function computeDerivedOptions(user: IUserOptions): IDerivedOptions {
  const bondLength = user.rendering.bonds.bondLength;
  const bondSpacing = user.rendering.bonds.bondSpacing;
  const fontSizeLarge = user.typography.fontSizeLarge;
  const fontSizeSmall = user.typography.fontSizeSmall;

  return {
    bondLengthSq: bondLength * bondLength,
    halfBondSpacing: bondSpacing / 2,
    halfFontSizeLarge: fontSizeLarge / 2,
    quarterFontSizeLarge: fontSizeLarge / 4,
    fifthFontSizeSmall: fontSizeSmall / 5
  };
}

export function materializeLegacyOptions(user: IUserOptions): IMoleculeOptions {
  const derived = computeDerivedOptions(user);
  const legacyDefaults = getLegacyDefaultOptions();

  return {
    version: user.meta.version,
    width: user.canvas.width,
    height: user.canvas.height,
    scale: user.canvas.scale,
    padding: user.canvas.padding,
    bondThickness: user.rendering.bonds.bondThickness,
    bondLength: user.rendering.bonds.bondLength,
    shortBondLength: user.rendering.bonds.shortBondLength,
    bondSpacing: user.rendering.bonds.bondSpacing,
    atomVisualization: user.rendering.atoms.atomVisualization,
    terminalCarbons: user.rendering.atoms.terminalCarbons,
    explicitHydrogens: user.rendering.atoms.explicitHydrogens,
    aromaticPiSystemInset: user.rendering.aromatic.piSystemInset,
    isomeric: user.rendering.stereochemistry.isomeric,
    compactDrawing: user.layout.graph.compactDrawing,
    overlapSensitivity: user.layout.graph.overlapSensitivity,
    overlapResolutionIterations: user.layout.graph.overlapResolutionIterations,
    finetuneOverlap: user.layout.finetune.enabled,
    finetuneOverlapMaxSteps: user.layout.finetune.maxSteps,
    finetuneOverlapMaxDurationMs: user.layout.finetune.maxDurationMs,
    showAtomAnnotations: user.annotations.enabled,
    atomAnnotationColor: user.annotations.color,
    atomAnnotationFontSize: user.annotations.fontSize,
    atomAnnotationOffset: user.annotations.offset,
    atomAnnotationFormatter: user.annotations.formatter,
    fontFamily: user.typography.fontFamily,
    fontSizeLarge: user.typography.fontSizeLarge,
    fontSizeSmall: user.typography.fontSizeSmall,
    labelOutlineWidth: user.typography.labelOutlineWidth,
    labelMaskRadiusScale: user.annotations.mask.baseScale,
    labelMaskRadiusScaleWide: user.annotations.mask.wideScale,
    debug: user.meta.debug,
    kkThreshold: user.layout.force.kkThreshold,
    kkInnerThreshold: user.layout.force.kkInnerThreshold,
    kkMaxIteration: user.layout.force.kkMaxIteration,
    kkMaxInnerIteration: user.layout.force.kkMaxInnerIteration,
    kkMaxEnergy: user.layout.force.kkMaxEnergy,
    weights: {
      ...user.visualizations.weights
    },
    themes: user.appearance.themes || legacyDefaults.themes,
    halfBondSpacing: derived.halfBondSpacing,
    bondLengthSq: derived.bondLengthSq,
    halfFontSizeLarge: derived.halfFontSizeLarge,
    quarterFontSizeLarge: derived.quarterFontSizeLarge,
    fifthFontSizeSmall: derived.fifthFontSizeSmall
  };
}

export function normalizeUserOptions(
  input?: UserOrLegacy
): IUserOptions {
  if (!input) {
    return getDefaultUserOptions();
  }

  if (isUserOptionsShape(input)) {
    return Options.extend<IUserOptions>(true, getDefaultUserOptions(), input);
  }

  const legacy = Options.extend<IMoleculeOptions>(
    true,
    getLegacyDefaultOptions(),
    input
  );

  return translateLegacyToUser(legacy);
}
