import Atom = require('../../graph/Atom');
import ArrayHelper = require('../../utils/ArrayHelper');
import Vector2 = require('../../graph/Vector2');
import SvgDrawer = require('../SvgDrawer');
import Vertex = require('../../graph/Vertex');
import IDrawingSurface = require('../renderers/IDrawingSurface');

class SvgVertexDrawer {
  constructor(private drawer: SvgDrawer) {}



  /**
   * Draw the highlights for atoms to the canvas.
   *
   * @param {Boolean} debug
   */
  drawAtomHighlights(debug: boolean): void {
    let preprocessor = this.drawer.preprocessor;
    let opts = preprocessor.opts;
    let graph = preprocessor.graph;
    let rings = preprocessor.rings;
    let renderer = this.drawer.getRenderer();

    for (var i = 0; i < graph.vertices.length; i++) {
      let vertex = graph.vertices[i];
      let atom = vertex.value;

      for (var j = 0; j < preprocessor.highlight_atoms.length; j++) {
        let highlight = preprocessor.highlight_atoms[j]
        if (atom.class === highlight[0]) {
          renderer.drawAtomHighlight(vertex.position.x, vertex.position.y, highlight[1]);
        }
      }
    }
  }



  /**
   * Draws the vertices representing atoms to the canvas.
   *
   * @param {Boolean} debug A boolean indicating whether or not to draw debug messages to the canvas.
   */
  drawVertices(debug: boolean): void {
    let preprocessor = this.drawer.preprocessor,
      opts = preprocessor.opts,
      graph = preprocessor.graph,
      rings = preprocessor.rings,
      renderer = this.drawer.getRenderer();

    for (var i = 0; i < graph.vertices.length; i++) {
      let vertex = graph.vertices[i];
      let atom = vertex.value;
      let charge = 0;
      let isotope = 0;
      let bondCount = vertex.value.bondCount;
      let element = atom.element;
      let hydrogens = Atom.maxBonds[element] - bondCount;
      let dir = vertex.getTextDirection(graph.vertices, atom.hasAttachedPseudoElements);
      let isTerminal = opts.terminalCarbons || element !== 'C' || atom.hasAttachedPseudoElements ? vertex.isTerminal() : false;
      let isCarbon = atom.element === 'C';

      // This is a HACK to remove all hydrogens from nitrogens in aromatic rings, as this
      // should be the most common state. This has to be fixed by kekulization
      if (atom.element === 'N' && atom.isPartOfAromaticRing) {
        hydrogens = 0;
      }

      if (atom.bracket) {
        hydrogens = atom.bracket.hcount;
        charge = atom.bracket.charge;
        isotope = atom.bracket.isotope;
      }

      // If the molecule has less than 3 elements, always write the "C" for carbon
      // Likewise, if the carbon has a charge or an isotope, always draw it
      if (charge || isotope || graph.vertices.length < 3) {
        isCarbon = false;
      }

      if (opts.atomVisualization === 'allballs') {
        renderer.drawBall(vertex.position.x, vertex.position.y, element);
      } else if ((atom.isDrawn && (!isCarbon || atom.drawExplicit || isTerminal || atom.hasAttachedPseudoElements)) || graph.vertices.length === 1) {
        if (opts.atomVisualization === 'default') {
          let attachedPseudoElements = atom.getAttachedPseudoElements();

          // Draw to the right if the whole molecule is concatenated into one string
          if (atom.hasAttachedPseudoElements && graph.vertices.length === Object.keys(attachedPseudoElements).length + 1) {
            dir = 'right';
          }

          renderer.drawText(vertex.position.x, vertex.position.y,
            element, hydrogens, dir, isTerminal, charge, isotope, graph.vertices.length, attachedPseudoElements);
        } else if (opts.atomVisualization === 'balls') {
          renderer.drawBall(vertex.position.x, vertex.position.y, element);
        }
      } else if (vertex.getNeighbourCount() === 2 && vertex.forcePositioned == true) {
        // If there is a carbon which bonds are in a straight line, draw a dot
        let a = graph.vertices[vertex.neighbours[0]].position;
        let b = graph.vertices[vertex.neighbours[1]].position;
        let angle = Vector2.threePointangle(vertex.position, a, b);

        if (Math.abs(Math.PI - angle) < 0.1) {
          renderer.drawPoint(vertex.position.x, vertex.position.y, element);
        }
      }

      this.renderAnnotations(vertex, atom, renderer);

      if (debug) {
        let value = 'v: ' + vertex.id + ' ' + ArrayHelper.print(atom.ringbonds);
        renderer.drawDebugText(vertex.position.x, vertex.position.y, value);
      }
      // else {
      //   svgWrapper.drawDebugText(vertex.position.x, vertex.position.y, vertex.value.chirality);
      // }
    }

    // Draw the ring centers for debug purposes
    if (opts.debug) {
      for (var j = 0; j < rings.length; j++) {
        let center = rings[j].center;
        renderer.drawDebugPoint(center.x, center.y, 'r: ' + rings[j].id);
      }
    }
  }

  private renderAnnotations(vertex: Vertex, atom: Atom, renderer: IDrawingSurface): void {
    const opts = this.drawer.opts;
    if (!opts.showAtomAnnotations || typeof renderer.drawAnnotation !== 'function') {
      return;
    }

    const annotations = atom.annotations ? atom.annotations.toJSON() : {};
    const keys = Object.keys(annotations);

    if (keys.length === 0) {
      return;
    }

    const formatter = opts.atomAnnotationFormatter;
    const formatted = formatter
      ? formatter({ vertex, annotations })
      : this.defaultAnnotationFormatter(keys, annotations);

    if (!formatted) {
      return;
    }

    const fontSize = opts.atomAnnotationFontSize || opts.fontSizeSmall;
    const color = opts.atomAnnotationColor;
    const offset = opts.atomAnnotationOffset ?? 0;

    renderer.drawAnnotation!(
      vertex.position.x,
      vertex.position.y - offset,
      formatted,
      {
        fontSize,
        color
      }
    );
  }

  private defaultAnnotationFormatter(keys: string[], annotations: Record<string, unknown>): string {
    return keys
      .sort()
      .map((key) => {
        const value = annotations[key];
        if (value === null || value === undefined) {
          return `${key}`;
        }
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return `${key}: ${value}`;
        }
        try {
          return `${key}: ${JSON.stringify(value)}`;
        } catch {
          return `${key}: [object]`;
        }
      })
      .join('\n');
  }
}

export = SvgVertexDrawer;
