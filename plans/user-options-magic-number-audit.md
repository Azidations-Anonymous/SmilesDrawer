# Magic Number Audit for `IUserOptions`

This document inventories the hard-coded multipliers and thresholds that currently shape drawing, labelling, and layout behaviour. Each entry includes the file reference, a short rationale, and the proposed home for a future `IUserOptions` field so caller-configurable values replace the inline literals.

## 1. Bond & Edge Rendering

| Location | Literal | Behaviour | Proposed option |
| --- | --- | --- | --- |
| `src/drawing/DrawingManager.ts:184`<br>`src/drawing/draw/SvgEdgeDrawer.ts:146` | `opts.bondSpacing / 1.5` | Triple bonds squeeze the outer lines closer than double bonds via a fixed `1 / 1.5 ≈ 0.66` factor. | `rendering.bonds.tripleBondSpacingFactor` (multiplier applied to `bondSpacing`). |
| `src/drawing/draw/CanvasPrimitiveDrawer.ts:73`<br>`src/drawing/draw/CanvasWedgeDrawer.ts:27` | `line.clone().shorten(4.0)` / `shorten(5.0)` | Canvas lines/wedges trim a fixed number of pixels to create drop shadows; behaves differently at other scales. | `rendering.bonds.shadowShortenPx` and `rendering.stereochemistry.shadowShortenPx`. |
| `src/drawing/draw/CanvasPrimitiveDrawer.ts:92` | `lineWidth = bondThickness + 1.2` | Shadows grow bond lines by a hard-coded 1.2 px. | `rendering.bonds.shadowThicknessPadding`. |
| `src/drawing/draw/CanvasPrimitiveDrawer.ts:121`<br>`src/drawing/SvgWrapper.ts:571` | Dash pattern `[3, 2]` / `'3,2'` | All dashed bonds share this pattern; users cannot match external style guides. | `rendering.bonds.dashPattern` (tuple) exposed to both Canvas+SVG drawers. |
| `src/drawing/draw/CanvasPrimitiveDrawer.ts:116/118`<br>`src/drawing/draw/CanvasWedgeDrawer.ts:75-78`<br>`src/drawing/SvgWrapper.ts:222` | Gradient stops at `0.4/0.6` (Canvas) and `20%/100%` (SVG) | The fade between left/right atom colours is frozen, yielding inconsistent looks with wide bonds. | `rendering.bonds.gradientStopOffsets` with normalized offsets (apply to both Canvas and SVG). |
| `src/drawing/SvgWrapper.ts:347`<br>`src/drawing/draw/CanvasPrimitiveDrawer.ts:151` | `bondLength / 4.5` | “Ball-and-stick” mode scales spheres with a fixed divisor, independent of theme or zoom. | `rendering.atoms.ballRadiusBondFraction`. |

## 2. Stereochemistry & Wedges

| Location | Literal | Behaviour | Proposed option |
| --- | --- | --- | --- |
| `src/drawing/SvgWrapper.ts:397-398`<br>`src/drawing/draw/CanvasWedgeDrawer.ts:65-67` | `3.0 + fontSizeLarge / 4.0` and `1.5 + halfBondThickness` | Wedge tips/fins extend by fixed padding before tapering, affecting perceived depth. | `rendering.stereochemistry.wedgeTipPaddingPx`, `rendering.stereochemistry.wedgeTipFontScale`, and `rendering.stereochemistry.wedgeSidePaddingPx`. |
| `src/drawing/SvgWrapper.ts:456`<br>`src/drawing/draw/CanvasWedgeDrawer.ts:159` | `step = 1.25 / (length / (bondLength/10 or bondThickness*3))` | Dashed wedges sample along the edge with constant 1.25 multiplier, tying dash count to length heuristically. | `rendering.stereochemistry.dashedStepFactor` (dimensionless). |
| `src/drawing/SvgWrapper.ts:464`<br>`src/drawing/draw/CanvasWedgeDrawer.ts:165` | `width = fontSizeLarge/2 * t` (SVG) vs `width = 1.5 * t` (Canvas) | Satellite dash width scales with inconsistent constants between renderers. | `rendering.stereochemistry.dashedWidthFactorSvg` and `.dashedWidthFactorCanvas`. |
| `src/drawing/draw/CanvasWedgeDrawer.ts:168` | `if (!changed && t > 0.5)` | Dashed wedges switch from left-element to right-element colour halfway along the edge using a fixed 50% threshold. | `rendering.stereochemistry.dashedColorSwitchThreshold`. |
| `src/drawing/draw/CanvasWedgeDrawer.ts:134-145` | `shortenLeft/Right(1.0)` | Dashed wedge endpoints retract by 1 px before drawing, without accounting for DPI. | `rendering.stereochemistry.dashedInsetPx`. |

## 3. Atom Labels, Masks & Highlights

| Location | Literal | Behaviour | Proposed option |
| --- | --- | --- | --- |
| `src/drawing/renderers/SvgLabelRenderer.ts:56` | `dy="0.35em"` | Vertical baseline shift for every label is fixed, which misaligns with custom fonts. | `typography.svgBaselineShiftEm`. |
| `src/drawing/helpers/SvgTextHelper.ts:6` | `lineHeight = 0.9` | Canvas text measurement assumes 0.9 leading regardless of font metrics. | `typography.measurementLineHeight`. |
| `src/drawing/SvgWrapper.ts:905` | `smallOffset = fontSize * 0.5` | Isotope labels always sit at half the font height above the baseline. | `typography.isotopeOffsetFactor`. |
| `src/drawing/SvgWrapper.ts:1026-1034` | `fallback = fontSizeLarge * 0.1`, `spacing/4` | Charge/isotope spacing falls back to 10% of font size and divides that by four for charges. | `typography.labelSpacing.baseUnitScale` + per-category multipliers (`chargeMultiplier`, `isotopeMultiplier`, `hydrogenMultiplier`, `hydrogenCountMultiplier`). |
| `src/drawing/draw/CanvasTextDrawer.ts:89-95` | `r /= 1.5` | Canvas label masks shrink by 1/1.5 of the glyph width regardless of outline thickness. | `annotations.mask.canvasRadiusFactor`. |
| `src/drawing/SvgWrapper.ts:604-634`<br>`src/drawing/draw/CanvasPrimitiveDrawer.ts:174-182` | `point radius = 0.75`, mask radius `1.5` | Terminal “dot” atoms use constant radii. | `rendering.atoms.pointRadius` and `rendering.atoms.pointMaskRadius`. |
| `src/drawing/SvgWrapper.ts:346-354`<br>`src/drawing/draw/CanvasPrimitiveDrawer.ts:151` | `bondLength / 4.5` | Same ball radius constant as §1; include here for completeness. | `rendering.atoms.ballRadiusBondFraction`. |
| `src/drawing/SvgWrapper.ts:414-418` | Highlight defaults: color `#03fc9d`, radius `bondLength / 3` | Atom highlighting ignores themes. | Add `highlight` color (and optional radius factor) per theme entry, plus an `appearance.highlights.fallbackColor` / `fallbackRadiusFactor` pair used only when a theme omits the value. |
| `src/drawing/SvgWrapper.ts:982-983` | Fallback scales `0.75` and `1.1` | Label mask radii silently default even when the user provides typography overrides. | Move to `annotations.mask.baseScale` / `annotations.mask.wideScale` defaults fed by `IUserOptions`. |

## 4. Layout & Graph Heuristics

| Location | Literal | Behaviour | Proposed option |
| --- | --- | --- | --- |
| `src/drawing/DrawingManager.ts:264` | `abs(π - angle) < 0.1` | A vertex becomes a dot when bonds are within 0.1 rad (~5.7°) of straight. | `layout.graph.linearBondToleranceRad`. |
| `src/drawing/DrawingManager.ts:319-327` | Snap to `30°` (`0.523599` rad) with half-step threshold `0.2617995` | Whole-molecule rotation quantises to 30° increments. | `layout.graph.rotationSnapIncrementDeg` + `rotationSnapDeadzoneDeg`. |
| `src/preprocessing/PositioningManager.ts:233` | Default branch angle `±1.0472` rad (60°) | Tree expansion assumes ideal sp³ geometry regardless of atom type. | `layout.graph.defaultBranchAngleRad`. |
| `src/graph/Vertex.ts:255-257` | Hard-coded vertical snap at `≈1.57` rad and a `0.2` rad bias | Text direction jumps left/right when the mean angle is ~90°; both the snap threshold and correction are fixed. | `typography.verticalSnapAngleRad` and `typography.terminalLabelBiasRad`. |
| `src/graph/Vector2.ts:278-279` | Jitter `±0.001` before rotation | Numerical stabilisation uses a literal offset that could scale with bond length. | `layout.graph.rotationJitterEpsilon`. |
| `src/preprocessing/MolecularPreprocessor.ts:812-816` | Neighbourhood radius `bondLength * 2.0` | Center-of-mass lookups always scan a two-bond radius. | `layout.graph.centerOfMassRadiusFactor`. |
| `src/preprocessing/OverlapResolutionManager.ts:175` | `(2π - ringAngle) / 6.0` | Ring overlap resolution spreads substituents with a fixed 6-way split. | `layout.overlap.ringDivisionSegments`. |
| `src/algorithms/KamadaKawaiLayout.ts:228-230` | Hessian floors at `0.1` | Newton iterations clamp second derivatives to 0.1 to avoid zero determinants. | `layout.force.hessianMinimum`. |

## 5. Overlap Resolution & Overlays

| Location | Literal | Behaviour | Proposed option |
| --- | --- | --- | --- |
| `src/preprocessing/OverlapResolutionManager.ts:218` | `threshold = 0.8 * bondLengthSq` | Finetune pass only considers vertices closer than 0.8× bond length. | `layout.overlap.finetuneClashDistanceFactor`. |
| `src/preprocessing/OverlapResolutionManager.ts:237` | `averageDistance = path.length / 2.0` | The “best” rotatable edge sits around half the path; scale is implicit. | `layout.overlap.rotatableEdgeCenteringFactor`. |
| `src/rendering/AromaticOverlayRenderer.ts:14` | Default inset `7` px | Aromatic overlays shrink by 7 px if no explicit inset is provided. | `rendering.aromatic.insetPx`. |
| `src/rendering/AromaticOverlayRenderer.ts:64` | Clamp `distance * 0.5` | Overlay inset never exceeds half the vertex distance from the ring centre. | `rendering.aromatic.insetClampRatio`. |

## 6. Pixel Conversion Utilities

| Location | Literal | Behaviour | Proposed option |
| --- | --- | --- | --- |
| `src/utils/PixelsToSvg.ts:101` | `viewBox="0 -0.5 …"` | Raster-to-SVG conversion nudges the Y origin by −0.5 to align the pixel grid, but callers cannot adjust it for different sampling strategies. | `rendering.pixelExport.viewboxYOffset`. |

## 7. Reaction Arrowheads

| Location | Literal | Behaviour | Proposed option |
| --- | --- | --- | --- |
| `src/reactions/ReactionDrawer.ts:371-389` | Fixed CD arrowhead geometry (`sw = headSize * 7 / 4.5`, `refX/refY = 2.2`, path coordinates `7 2.25 … 0.735 … -1.084 … -2.28 … -2.22`) | The curved double-arrowhead uses hard-coded ratios and SVG path data, preventing alternative glyph styles. | Add `rendering.reactions.arrowhead` with fields like `cdScaleFactor`, `refPoint`, and a configurable `pathSegments` array (or allow supplying custom SVG path data). |
| `src/reactions/ReactionDrawer.ts:417` | `viewBox = l + headSize * (7 / 4.5)` | Arrow SVG width includes a hard-coded multiplier tied to the CD arrowhead. | Include `rendering.reactions.arrowhead.viewboxScaleFactor` (defaults to `7 / 4.5`) so callers can match custom head geometry. |

## 8. Heatmap / Weight Rendering

| Location | Literal | Behaviour | Proposed option |
| --- | --- | --- | --- |
| `src/drawing/GaussDrawer.ts:25` | `sigma = 0.3` fallback | The Gaussian drawer silently substitutes `0.3` when no sigma is provided, even though `weights.sigma` lives in options. | Drop the internal fallback or expose it as `visualizations.gaussian.defaultSigma` used only when options omit the value. |
| `src/drawing/GaussDrawer.ts:118` | `domain([-1.0, 1.0])` | Heatmap colours assume contributions are normalized to the range [-1, 1]; diverging datasets can clip. | `visualizations.gaussian.domainMin` / `domainMax`. |
| `src/drawing/GaussDrawer.ts:31-37` | Hard-coded PiYG palette array | When `weights.colormap` is `null`, GaussDrawer injects a specific palette instead of reading from options. | Add `visualizations.gaussian.defaultColormap` so themes can pick the fallback gradient. |

## Next Steps
1. Prioritise which of the above affect rendering correctness (triple-bond spacing, wedge geometry, overlap tolerances) vs. pure aesthetics (highlight colour, dash patterns).
2. For each adopted option, add a field inside the appropriate `IUserOptions` subtree (`rendering.bonds`, `rendering.stereochemistry`, `typography`, `layout`. etc.) and seed defaults from today’s literals to preserve behaviour.
3. Update Canvas + SVG implementations in tandem where both rely on the same multiplier to avoid diverging behaviour between renderers.
