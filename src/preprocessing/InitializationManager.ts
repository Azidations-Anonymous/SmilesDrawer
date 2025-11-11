import MolecularPreprocessor from "./MolecularPreprocessor";
import Graph = require("../graph/Graph");
import { AtomHighlight } from "./MolecularDataTypes";

type ParseTree = any;

class InitializationManager {
    private drawer: MolecularPreprocessor;

    constructor(drawer: MolecularPreprocessor) {
        this.drawer = drawer;
    }

    initDraw(data: ParseTree, themeName: string, infoOnly: boolean, highlight_atoms: AtomHighlight[]): void {
        this.drawer.data = data;
        this.drawer.infoOnly = infoOnly;

        this.drawer.ringIdCounter = 0;
        this.drawer.ringConnectionIdCounter = 0;

        this.drawer.graph = new Graph(
            data,
            this.drawer.userOpts.rendering.stereochemistry.isomeric
        );
        this.drawer.rings = Array();
        this.drawer.ringConnections = Array();

        this.drawer.originalRings = Array();
        this.drawer.originalRingConnections = Array();

        this.drawer.bridgedRing = false;

        // Reset those, in case the previous drawn SMILES had a dangling \ or /
        this.drawer.doubleBondConfigCount = null;
        this.drawer.doubleBondConfig = null;

        this.drawer.highlight_atoms = highlight_atoms

        this.drawer.initRings();
        this.initHydrogens();
        this.drawer.buildCisTransMetadata();
    }

    initHydrogens(): void {
        // Do not draw hydrogens except when they are connected to a stereocenter connected to two or more rings.
        if (!this.drawer.userOpts.rendering.atoms.explicitHydrogens) {
          for (var i = 0; i < this.drawer.graph.vertices.length; i++) {
            let vertex = this.drawer.graph.vertices[i];

            if (vertex.value.element !== 'H') {
              continue;
            }

            // Hydrogens should have only one neighbour, so just take the first
            // Also set hasHydrogen true on connected atom
            let neighbour = this.drawer.graph.vertices[vertex.neighbours[0]];
            neighbour.value.hasHydrogen = true;

            if (!neighbour.value.isStereoCenter || neighbour.value.rings.length < 2 && !neighbour.value.bridgedRing ||
              neighbour.value.bridgedRing && neighbour.value.originalRings.length < 2) {
              vertex.value.isDrawn = false;
            }
          }
        }
    }
}
export = InitializationManager;
