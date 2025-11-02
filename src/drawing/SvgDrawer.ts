// we use the drawer to do all the preprocessing. then we take over the drawing
// portion to output to svg
import ArrayHelper = require('../utils/ArrayHelper');
import Atom = require('../graph/Atom');
import MolecularPreprocessor = require('../preprocessing/MolecularPreprocessor');
import Graph = require('../graph/Graph');
import Line = require('../graph/Line');
import SvgWrapper = require('./SvgWrapper');
import ThemeManager = require('../config/ThemeManager');
import Vector2 = require('../graph/Vector2');
import GaussDrawer = require('./GaussDrawer');
import SvgEdgeDrawer = require('./draw/SvgEdgeDrawer');

class SvgDrawer {
  preprocessor: any;
  opts: any;
  clear: boolean;
  svgWrapper: any;
  themeManager: any;
  bridgedRing: boolean;
    private edgeDrawer: SvgEdgeDrawer;

  constructor(options: any, clear: boolean = true) {
      this.preprocessor = new MolecularPreprocessor(options);
      this.opts = this.preprocessor.opts;
      this.clear = clear;
      this.svgWrapper = null;
          this.edgeDrawer = new SvgEdgeDrawer(this);
  }

  /**
   * Draws the parsed smiles data to an svg element.
   *
   * @param {Object} data The tree returned by the smiles parser.
   * @param {?(String|SVGElement)} target The id of the HTML svg element the structure is drawn to - or the element itself.
   * @param {String} themeName='dark' The name of the theme to use. Built-in themes are 'light' and 'dark'.
   * @param {Boolean} infoOnly=false Only output info on the molecule without drawing anything to the canvas.
   *
   * @returns {SVGElement} The svg element
   */
  draw(data: any, target: string | SVGElement | null, themeName: string = 'light', weights: any = null, infoOnly: boolean = false, highlight_atoms: any[] = [], weightsNormalized: boolean = false): SVGElement {
    if (target === null || target === 'svg') {
      target = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      target.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      target.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      target.setAttributeNS(null, 'width', this.opts.width.toString());
      target.setAttributeNS(null, 'height', this.opts.height.toString());
    } else if (typeof target === 'string') {
      target = document.getElementById(target) as unknown as SVGElement;
    }

    let optionBackup = {
      padding: this.opts.padding,
      compactDrawing: this.opts.compactDrawing
    };

    // Overwrite options when weights are added
    if (weights !== null) {
      this.opts.padding += this.opts.weights.additionalPadding;
      this.opts.compactDrawing = false;
    }

    let preprocessor = this.preprocessor;

    preprocessor.initDraw(data, themeName, infoOnly, highlight_atoms);

    if (!infoOnly) {
      this.themeManager = new ThemeManager(this.opts.themes, themeName);
      if (this.svgWrapper === null || this.clear) {
        this.svgWrapper = new SvgWrapper(this.themeManager, target, this.opts, this.clear);
      }
    }

    preprocessor.processGraph();

    // Set the canvas to the appropriate size
    this.svgWrapper.determineDimensions(preprocessor.graph.vertices);

    // Do the actual drawing
    this.drawAtomHighlights(preprocessor.opts.debug);
    this.drawEdges(preprocessor.opts.debug);
    this.drawVertices(preprocessor.opts.debug);

    if (weights !== null) {
      this.drawWeights(weights, weightsNormalized);
    }

    if (preprocessor.opts.debug) {
      console.log(preprocessor.graph);
      console.log(preprocessor.rings);
      console.log(preprocessor.ringConnections);
    }

    this.svgWrapper.constructSvg();

    // Reset options in case weights were added.
    if (weights !== null) {
      this.opts.padding = optionBackup.padding;
      this.opts.compactDrawing = optionBackup.padding;
    }

    return target;
  }

  /**
 * Draws the parsed smiles data to a canvas element.
 *
 * @param {Object} data The tree returned by the smiles parser.
 * @param {(String|HTMLCanvasElement)} target The id of the HTML canvas element the structure is drawn to - or the element itself.
 * @param {String} themeName='dark' The name of the theme to use. Built-in themes are 'light' and 'dark'.
 * @param {Boolean} infoOnly=false Only output info on the molecule without drawing anything to the canvas.
 */
  drawCanvas(data: any, target: string | HTMLCanvasElement, themeName: string = 'light', infoOnly: boolean = false): string | HTMLCanvasElement {
    let canvas = null;
    if (typeof target === 'string') {
      canvas = document.getElementById(target);
    } else {
      canvas = target;
    }

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    // 500 as a size is arbritrary, but the canvas is scaled when drawn to the canvas anyway
    svg.setAttributeNS(null, 'viewBox', '0 0 ' + 500 + ' ' + 500);
    svg.setAttributeNS(null, 'width', 500 + '');
    svg.setAttributeNS(null, 'height', 500 + '');
    svg.setAttributeNS(null, 'style', 'visibility: hidden: position: absolute; left: -1000px');
    document.body.appendChild(svg);
    // KNOWN BUG: infoOnly is incorrectly passed as the 4th parameter (weights) instead of 5th.
    // This causes infoOnly to be interpreted as weights when true, triggering incorrect weight-related
    // code paths, and the actual infoOnly parameter defaults to false.
    // Correct call would be: this.draw(data, svg, themeName, null, infoOnly);
    // Preserving buggy behavior for backward compatibility during TypeScript migration.
    this.draw(data, svg, themeName, infoOnly as any);
    this.svgWrapper.toCanvas(canvas, this.opts.width, this.opts.height);
    document.body.removeChild(svg);
    return target;
  }

  /**
   * Draw the highlights for atoms to the canvas.
   *
   * @param {Boolean} debug
   */
  drawAtomHighlights(debug: boolean): void {
    let preprocessor = this.preprocessor;
    let opts = preprocessor.opts;
    let graph = preprocessor.graph;
    let rings = preprocessor.rings;
    let svgWrapper = this.svgWrapper;

    for (var i = 0; i < graph.vertices.length; i++) {
      let vertex = graph.vertices[i];
      let atom = vertex.value;

      for (var j = 0; j < preprocessor.highlight_atoms.length; j++) {
        let highlight = preprocessor.highlight_atoms[j]
        if (atom.class === highlight[0]) {
          svgWrapper.drawAtomHighlight(vertex.position.x, vertex.position.y, highlight[1]);
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
    let preprocessor = this.preprocessor,
      opts = preprocessor.opts,
      graph = preprocessor.graph,
      rings = preprocessor.rings,
      svgWrapper = this.svgWrapper;

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
        svgWrapper.drawBall(vertex.position.x, vertex.position.y, element);
      } else if ((atom.isDrawn && (!isCarbon || atom.drawExplicit || isTerminal || atom.hasAttachedPseudoElements)) || graph.vertices.length === 1) {
        if (opts.atomVisualization === 'default') {
          let attachedPseudoElements = atom.getAttachedPseudoElements();

          // Draw to the right if the whole molecule is concatenated into one string
          if (atom.hasAttachedPseudoElements && graph.vertices.length === Object.keys(attachedPseudoElements).length + 1) {
            dir = 'right';
          }

          svgWrapper.drawText(vertex.position.x, vertex.position.y,
            element, hydrogens, dir, isTerminal, charge, isotope, graph.vertices.length, attachedPseudoElements);
        } else if (opts.atomVisualization === 'balls') {
          svgWrapper.drawBall(vertex.position.x, vertex.position.y, element);
        }
      } else if (vertex.getNeighbourCount() === 2 && vertex.forcePositioned == true) {
        // If there is a carbon which bonds are in a straight line, draw a dot
        let a = graph.vertices[vertex.neighbours[0]].position;
        let b = graph.vertices[vertex.neighbours[1]].position;
        let angle = Vector2.threePointangle(vertex.position, a, b);

        if (Math.abs(Math.PI - angle) < 0.1) {
          svgWrapper.drawPoint(vertex.position.x, vertex.position.y, element);
        }
      }

      if (debug) {
        let value = 'v: ' + vertex.id + ' ' + ArrayHelper.print(atom.ringbonds);
        svgWrapper.drawDebugText(vertex.position.x, vertex.position.y, value);
      }
      // else {
      //   svgWrapper.drawDebugText(vertex.position.x, vertex.position.y, vertex.value.chirality);
      // }
    }

    // Draw the ring centers for debug purposes
    if (opts.debug) {
      for (var j = 0; j < rings.length; j++) {
        let center = rings[j].center;
        svgWrapper.drawDebugPoint(center.x, center.y, 'r: ' + rings[j].id);
      }
    }
  }

  /**
   * Draw the weights on a background image.
   * @param {Number[]} weights The weights assigned to each atom.
   */
  drawWeights(weights: number[], weightsNormalized: boolean): void {

    if (!weights) {
      return;
    }

    if (weights.every(w => w === 0)) {
      return;
    }

    if (weights.length !== this.preprocessor.graph.atomIdxToVertexId.length) {
      throw new Error('The number of weights supplied must be equal to the number of (heavy) atoms in the molecule.');
    }

    let points = [];

    for (const atomIdx of this.preprocessor.graph.atomIdxToVertexId) {
      let vertex = this.preprocessor.graph.vertices[atomIdx];
      points.push(new Vector2(
        vertex.position.x - this.svgWrapper.minX,
        vertex.position.y - this.svgWrapper.minY)
      );
    }

    let gd = new GaussDrawer(
      points, weights, this.svgWrapper.drawingWidth, this.svgWrapper.drawingHeight,
      this.opts.weights.sigma, this.opts.weights.interval, this.opts.weights.colormap,
      this.opts.weights.opacity, weightsNormalized
    );

    gd.draw();
    this.svgWrapper.addLayer(gd.getSVG());
  }

  /**
   * Returns the total overlap score of the current molecule.
   *
   * @returns {Number} The overlap score.
   */
  getTotalOverlapScore(): number {
    return this.preprocessor.getTotalOverlapScore();
  }

  /**
   * Returns the molecular formula of the loaded molecule as a string.
   *
   * @returns {String} The molecular formula.
   */
  getMolecularFormula(graph: any = null): string {
    return this.preprocessor.getMolecularFormula(graph);
  }

    drawAromaticityRing(ring: any): void {
        this.edgeDrawer.drawAromaticityRing(ring);
    }

    drawEdges(debug: boolean): void {
        this.edgeDrawer.drawEdges(debug);
    }

    drawEdge(edgeId: number, debug: boolean): void {
        this.edgeDrawer.drawEdge(edgeId, debug);
    }

    multiplyNormals(normals: any[], spacing: number): void {
        this.edgeDrawer.multiplyNormals(normals, spacing);
    }
}

export = SvgDrawer;
