# Coordgen vs. SmilesDrawer

Notes on key implementation differences between Schrödinger’s Coordgen library (`../coordgenlibs`) and SmilesDrawer. These highlight why Coordgen consistently produces cleaner layouts, especially for fused or macrocyclic systems.

## Force Strategy
- **SmilesDrawer** only runs a Kamada–Kawai optimisation on the bridged-ring subgraph. That gives one deterministic spring layout and stops there.
- **Coordgen** builds a full molecular force field (stretch, bend, clash, stereo constraints) and minimises total energy for every fragment. It also caches the lowest-energy coordinates across iterations.
- **Why it matters:** Coordgen balances more objectives (angle regularity, stereo preservation, clash avoidance) than our spring-only pass, so layouts stay chemically plausible even when the graph distance metric would happily flatten things.

## Discrete Degree-of-Freedom Search
- **Coordgen** attaches explicit DOFs (flip, rotate, scale, invert bond, change parent bond length) to each fragment and performs exhaustive/local searches over their discrete states before the numerical minimiser runs (`CoordgenMinimizer::runSearch`). Each combination is scored for clashes, and the best state seeds the continuous optimisation.
- **SmilesDrawer** never explores alternate discrete states; whatever order atoms were processed in is the final starting pose.
- **Why it matters:** many overlaps can be eliminated by simply flipping a fragment or rotating a terminal chain. Coordgen finds those cheap fixes systematically, reducing the burden on the continuous solver and yielding cleaner results.

## Ring Placement and Templates
- **Coordgen**:
  - Detects fused systems, strips side rings, and places the “core” before reattaching sides with mirrored coordinate sets to keep rings outside the core (`CoordgenFragmentBuilder::simplifyRingSystem`).
  - For recognised scaffolds it loads prestored coordinates from `CoordgenTemplates.cpp` and marks the atoms rigid.
  - Macrocycles use `CoordgenMacrocycleBuilder`, which enumerates polyomino tilings, applies path restraints, and only falls back to generic polygons if no template matches.
- **SmilesDrawer** derives every fused/bridged layout from Kamada–Kawai with no template knowledge, so even classic motifs (e.g., anthracene) get re-solved each time.
- **Why it matters:** templating guarantees consistent ring shapes and spacing; without it we see warped hexagons or internal overlaps when the spring solution favours compactness over aesthetics.

## Constraints and Special Cases
- **Coordgen** automatically:
  - Rewrites certain metal bonds as zero-order to stabilise complexes.
  - Adds peptide-planarity, cis/trans, and chiral inversion constraints so stereochemistry survives flattening.
  - Runs marching-squares based residue placement when proteins are present.
- **SmilesDrawer** largely ignores these biochemical constraints and focuses on small-molecule 2D depiction.
- **Why it matters:** even for purely organic systems the same infrastructure enforces consistent double-bond depiction and prevents ZE inversions when rings are attached, leading to more chemically intuitive drawings.

## Takeaways for Later
1. Introduce a small template library (even for common fused aromatics) to normalise ring layouts before/after Kamada–Kawai.
2. Prototype a limited DOF search (fragment flips/rotations with overlap scoring) to mimic Coordgen’s discrete optimisation without re-implementing the full minimiser.
3. Evaluate whether additional constraints (e.g., peptide planarity, metal bond handling) should be ported to guard against obviously incorrect depictions.
