# IUserOptions Migration Plan

This plan describes how we will introduce the nested `IUserOptions` shape, keep the legacy `IMoleculeOptions` contract for backwards compatibility, and update SmilesDrawer to treat the new structure as the source of truth.

## 1. Goals & Non-Goals
- **Goals**
  - Design a grouped/nested configuration surface (`IUserOptions`) that better communicates related settings.
  - Provide a translation layer so callers that specify `version < 3.0.0` (or omit the version) continue to work without code changes.
  - Ensure all internal consumers (drawers, preprocessors, reactions) work exclusively with the nested structure after normalization.
  - Make computed values (derived lengths, fonts, etc.) explicit and keep them out of user-overridable input.
- **Non-Goals**
  - Changing the semantics or defaults of existing options.
  - Touching `IReactionOptions` or reaction-specific configuration.
  - Removing `IMoleculeOptions` entirely; it stays as the legacy DTO.

## 2. Proposed `IUserOptions` Structure

| Group | Fields (current source) | Notes |
| --- | --- | --- |
| `meta` | `version`, new `schemaRevision?`, `debug` flag | `version` determines parsing path; `debug` feels global. |
| `canvas` | `width`, `height`, `scale`, `padding` | Everything related to viewport size/scale. |
| `rendering.bonds` | `bondThickness`, `bondLength`, `shortBondLength`, `bondSpacing` | Derived values (half spacing, squared length) move to `derived`. |
| `rendering.atoms` | `atomVisualization`, `terminalCarbons`, `explicitHydrogens`, `aromaticPiSystemInset`, `showAtomAnnotations` flag? (see annotations) | Visual decisions per atom. |
| `rendering.stereochemistry` | `isomeric` | Kept separate for future expansion. |
| `layout.graph` | `compactDrawing`, `overlapSensitivity`, `overlapResolutionIterations` | Graph-level heuristics. |
| `layout.finetune` | `finetuneOverlap`, `finetuneOverlapMaxSteps`, `finetuneOverlapMaxDurationMs` | Controls for the secondary optimization pass. |
| `layout.force` | `kkThreshold`, `kkInnerThreshold`, `kkMaxIteration`, `kkMaxInnerIteration`, `kkMaxEnergy` | Kamada-Kawai parameters live under layout. |
| `annotations` | `showAtomAnnotations`, `atomAnnotationColor`, `atomAnnotationFontSize`, `atomAnnotationOffset`, `atomAnnotationFormatter` | Kept separate so we can gate UI toggles. |
| `typography` | `fontFamily`, `fontSizeLarge`, `fontSizeSmall`, `labelOutlineWidth`, `labelMaskRadiusScale`, `labelMaskRadiusScaleWide` | `derived.fontSizeHalf/Quarter/Fifth` derived from these. |
| `visualizations.weights` | `weights` (unchanged structure) | Already nested but moved under `visualizations`. |
| `appearance.themes` | `themes` dictionary + new per-theme `highlight` color (and future accent tokens) | Move highlight colour here so palettes control it. |
| `derived` (internal only) | `halfBondSpacing`, `bondLengthSq`, `halfFontSizeLarge`, `quarterFontSizeLarge`, `fifthFontSizeSmall` | Not part of `IUserOptions` input; computed inside `OptionsManager`. |

Open question (see §8): should `meta.version` remain required? For now we will accept undefined and treat it as legacy `<3.0`.

## 3. Version Detection & Translation Strategy
1. Add `normalizeUserOptions(rawOptions: Partial<IMoleculeOptions> \| Partial<IUserOptions> \| undefined)` in `src/config/OptionsNormalizer.ts`.
2. Determine the declared version:
   - Prefer `rawOptions?.version`.
   - If the new shape uses `meta.version`, fall back to `rawOptions?.meta?.version`.
   - If still missing, treat as `"0.0.0"` (legacy).
3. Use a lightweight semver compare helper (either import `semver`—already a dependency via dev tooling—or implement a tiny comparator) to check `>= 3.0.0`.
4. **Legacy path (`version < 3.0`):**
   - Instantiate legacy defaults via existing `getDefaultOptions()` (renamed to `getLegacyDefaultOptions()` to clarify intent).
   - Deep-merge user overrides with `Options.extend(true, ...)` to obtain a full `IMoleculeOptions`.
   - Convert to the nested shape via `translateLegacyToUser(legacy: IMoleculeOptions): IUserOptions`, mapping each field according to the table above. Computed fields go into a separate `buildDerivedValues(user: IUserOptions)`.
5. **Modern path (`version >= 3.0`):**
   - Build the nested defaults via a new `getDefaultUserOptions()` function that returns the grouped structure.
   - Deep-merge user overrides (structure-aware, e.g., `Options.extend(true, defaults, rawUser)`).
   - Ensure `meta.version` is set (if missing, use `package.json.version`).
6. In both paths, call `attachDerived(user: IUserOptions)` to create a read-only `derived` subtree or augment the object with computed numbers required by existing algorithms.
7. Expose a single normalized object (`INormalizedOptions`) that includes `{ user: IUserOptions; derived: IDerivedOptions; legacySnapshot?: IMoleculeOptions }`. Having the legacy snapshot at hand simplifies debugging when we compare old/new states.

## 4. Code Touchpoints
- `src/config/IOptions.ts`
  - Define `IUserOptions` and nested helper interfaces (`ICanvasOptions`, `IRenderingOptions`, etc.).
  - Mark `IMoleculeOptions` with a `/** @deprecated */` JSDoc to steer new code away from it.
- `src/config/DefaultOptions.ts`
  - Rename existing export to `getLegacyDefaultOptions`.
  - Add a sibling `getDefaultUserOptions` that returns the nested structure (internally reusing the same base constants so defaults stay in sync).
- `src/config/OptionsManager.ts`
  - Replace the constructor signature with `constructor(userOptions?: Partial<IMoleculeOptions> | Partial<IUserOptions>)`.
  - Delegate to `normalizeUserOptions` and store `this.opts` as `IUserOptions`.
  - Update any dependent fields (`this.theme`) by reading from `this.opts.appearance.themes`.
- `src/SmilesDrawer.ts`, `src/drawing/*`, `src/preprocessing/*`, `src/reactions/*`
  - Update imports and type annotations from `IMoleculeOptions` to `IUserOptions`.
  - Rewrite property access to follow the nested path (e.g., `opts.canvas.width` instead of `opts.width`).
  - Where derived values are used, reference `opts.derived` instead of ad-hoc fields.
- Tests and samples under `test/`, `example/`, and `pages/`
  - Update fixtures to either declare `version: '3.0.0'` and adopt the nested structure or intentionally exercise the legacy path by pinning `version: '2.1.0'`.

## 5. Implementation Roadmap

1. **Schema & Types (PR 1)**
   - Introduce new interface definitions plus `IDerivedOptions`.
   - Add `getLegacyDefaultOptions`, `getDefaultUserOptions`, and `OptionsNormalizer` with legacy-to-new translation logic.
   - Provide unit tests covering translation (e.g., ensure `legacy.fontSizeLarge` equals `user.typography.fontSize.large`).
2. **Manager & Entry Points (PR 2)**
   - Update `OptionsManager`, `SmilesDrawer`, and any exported constructors to use `IUserOptions`.
   - Ensure `theme` resolution works with nested paths.
3. **Rendering & Preprocessing Consumers (PR 3)**
   - Systematically migrate files referencing `IMoleculeOptions`. Suggested order: preprocessing (`src/preprocessing`), drawing (`src/drawing`), reactions (`src/reactions`), misc helpers.
   - Keep commits manageable by rewriting one subsystem per PR, backed by TypeScript compile + unit tests.
4. **Cleanup & Deprecation Messaging (PR 4)**
   - Update documentation (README, docs-notes) to showcase the new grouped options.
   - Add runtime warnings when a legacy options object without `version >= 3.0` is detected (optional but helpful).
   - Ensure TypeScript declaration files export both interfaces with clear comments about their roles.

## 6. Validation Strategy
- **Unit tests**
  - New tests for `OptionsNormalizer` verifying: (a) legacy input merges defaults, (b) derived values computed correctly, (c) nested overrides deep-merge as expected.
  - Adjust existing tests that rely on `.width`-style access to check the new paths.
- **Integration tests**
  - Re-run existing rendering and preprocessing test suites (`npm test`, `npm run test:node`, etc.) after each subsystem migration to catch regressions early.
  - Add a targeted regression test that feeds both legacy (`version: '2.1.0'`) and modern (`meta.version: '3.0.0'`) option blobs into `OptionsManager` and asserts identical downstream behavior (e.g., same `opts.rendering.bonds.bondLength`).
- **Manual verification**
  - Render the demo gallery using default options plus a legacy config snippet to ensure runtime conversion works in browsers.
  - Smoke-test the `SmilesDrawer.apply` helper with inline `data-smiles` attributes while forcing both legacy and modern option payloads.

## 7. Documentation Deliverables
- Update `README.md` / `doc/configuration.md` (or create if missing) to describe the nested structure with code samples.
- Add a migration guide snippet summarizing how each legacy field maps to the new tree.
- Document the version-detection behavior so downstream integrations know to set `meta.version = '3.x'` when adopting the new structure.

## 8. Open Questions & Risks
- **Version source of truth** – Should a missing `version` default to the package version (currently 3.0.0) or be treated as legacy? Treating it as legacy is safer but may surprise new users who omit the field; we might use `package.json.version` only when we know the object already follows the nested layout (e.g., by checking for `canvas`).
- **Runtime size impact** – Nesting introduces minor property access overhead; consider caching frequently used values (e.g., `const { typography } = opts`) inside tight loops.
- **Third-party typings** – Consumers referencing our published `.d.ts` files will see both interfaces. We should clearly label `IMoleculeOptions` as deprecated to discourage new code from depending on it.
- **Theme mutability** – Currently `themes` lives directly under options; when we nest under `appearance`, ensure no code assumes `opts.themes`. Add transitional getters if needed.

With this plan, we can iteratively land the new structure without breaking existing integrations while positioning SmilesDrawer for cleaner configuration management post-3.0.
