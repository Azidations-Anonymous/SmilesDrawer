import Vector2 = require('../../graph/Vector2');
import GaussDrawer = require('../GaussDrawer');
import SvgDrawer = require('../SvgDrawer');

class SvgWeightsDrawer {
  constructor(private drawer: SvgDrawer) {}



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

    if (weights.length !== this.drawer.preprocessor.graph.atomIdxToVertexId.length) {
      throw new Error('The number of weights supplied must be equal to the number of (heavy) atoms in the molecule.');
    }

    let points = [];

    for (const atomIdx of this.drawer.preprocessor.graph.atomIdxToVertexId) {
      let vertex = this.drawer.preprocessor.graph.vertices[atomIdx];
      points.push(new Vector2(
        vertex.position.x - this.drawer.svgWrapper.minX,
        vertex.position.y - this.drawer.svgWrapper.minY)
      );
    }

    let gd = new GaussDrawer(
      points, weights, this.drawer.svgWrapper.drawingWidth, this.drawer.svgWrapper.drawingHeight,
      this.drawer.opts.weights.sigma, this.drawer.opts.weights.interval, this.drawer.opts.weights.colormap,
      this.drawer.opts.weights.opacity, weightsNormalized
    );

    gd.draw();
    this.drawer.svgWrapper.addLayer(gd.getSVG());
  }
}

export = SvgWeightsDrawer;
