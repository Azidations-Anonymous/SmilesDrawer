import MolecularPreprocessor from "./MolecularPreprocessor";
import Graph = require("../graph/Graph");

class InitializationManager {
    private drawer: MolecularPreprocessor;

    constructor(drawer: MolecularPreprocessor) {
        this.drawer = drawer;
    }

    initDraw(data: any, themeName: string, infoOnly: boolean, highlight_atoms: any): void {
        this.drawer.data = data;
        this.drawer.infoOnly = infoOnly;

        this.drawer.ringIdCounter = 0;
        this.drawer.ringConnectionIdCounter = 0;

        this.drawer.graph = new Graph(data, this.drawer.opts.isomeric);
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
    }

    initHydrogens(): void {
        // Do not draw hydrogens except when they are connected to a stereocenter connected to two or more rings.
        if (!this.drawer.opts.explicitHydrogens) {
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
