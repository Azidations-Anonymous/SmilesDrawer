# SVG Text Layout Parity

SmilesDrawer’s SVG drawer now mirrors PIKAChU’s `_draw_text` flow so the halo masks, labels, and highlights stay aligned in every browser. This note summarises the behaviour and how to configure it.

## Behaviour

* **One glyph per `<text>` node** – the main atom, hydrogens, charges, isotopes, and pseudo-elements all render individually with explicit `x/y` coordinates. No parent `<g transform>` wrappers are used.
* **Centered baselines** – `text-anchor="middle"` and `dominant-baseline="central"` keep every glyph centered on its anchor. A nested `<tspan dy="0.35em">` replicates PIKAChU’s baseline offset.
* **Halo placement** – the mask circle is created once per anchor before drawing glyphs, reusing the same coordinates so the “ball” overlay cannot drift when zooming.
* **Directional offsets** – existing width/height heuristics (shared with the canvas drawer) are reused, but converted into absolute coordinates rather than `<tspan dy>` stacks.

## Configuration

* `svgTextParity: 'pikachu'` (default) enables the new behaviour.
* `svgTextParity: 'legacy'` switches back to the original block renderer (single `<text>`, stacked `<tspan>` lines, `<g transform="translate(x,y)">`).

Only the SVG drawer respects this flag; canvas rendering is unchanged.

## Verification checklist

1. Draw a charged nitrogen with rightward hydrogens and confirm each glyph has its own `<text>` with `x`/`y` attributes (no `transform`) and that the halo circle shares those coordinates.
2. Draw an up/down hydrogen stack (terminal atom) to verify vertical offsets match PIKAChU (accounting for SVG’s inverted Y-axis).
3. Toggle `svgTextParity` between `pikachu` and `legacy` to ensure both paths remain functional.
4. Run `npm run sample:svg-labels` to emit ready-made inspection files (`temp-svg-label-samples/svg-label-sample-{pikachu,legacy}.svg`) and open them in Chrome/Firefox/Safari to confirm halos stay glued to their anchors at different zoom levels.
5. Use `npm run parity:svg-labels` for a quick numerical diff: it renders representative single-atom SMILES with both SmilesDrawer and PIKAChU (through `../pikachu/pikachu-run`) and prints the delta between each satellite’s offset before you do the manual review.
