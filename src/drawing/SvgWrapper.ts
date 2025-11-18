import '../utils/Array';
import SvgConversionHelper = require('./helpers/SvgConversionHelper');
import SvgTextHelper = require('./helpers/SvgTextHelper');
import Line = require('../graph/Line');
import Vertex = require('../graph/Vertex');
import SvgUnicodeHelper = require('./helpers/SvgUnicodeHelper');
import Vector2 = require('../graph/Vector2');
import MathHelper = require('../utils/MathHelper');
import { IUserOptions, IDerivedOptions, AttachedPseudoElements } from '../config/IOptions';
import ThemeManager = require('../config/ThemeManager');
import { DEFAULT_POINT_RADIUS } from '../config/DefaultOptions';
import { TextDirection } from '../types/CommonTypes';
import IDrawingSurface = require('./renderers/IDrawingSurface');
import SvgLabelRenderer = require('./renderers/SvgLabelRenderer');
type LabelSegment = {
  display: string;
  element: string;
  kind: 'primary' | 'satellite';
  fontSize?: number;
  category?: LabelCategory;
  groupId?: string;
};

type LabelCategory = 'charge' | 'hydrogen' | 'hydrogenCount' | 'isotope' | 'main';

type LabelPlacement = {
  segment: LabelSegment;
  x: number;
  y: number;
  width: number;
  height: number;
};

function makeid(length: number): string {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

class SvgWrapper implements IDrawingSurface {
  svg: SVGElement;
  container: SVGElement | null;
  userOpts: IUserOptions;
  derivedOpts: IDerivedOptions;
  uid: string;
  gradientId: number;
  backgroundItems: SVGElement[];
  paths: SVGElement[];
  vertices: SVGElement[];
  gradients: SVGElement[];
  highlights: SVGElement[];
  drawingWidth: number;
  drawingHeight: number;
  halfBondThickness: number;
  themeManager: ThemeManager;
  maskElements: SVGElement[];
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  style: SVGStyleElement;
  labelRenderer: SvgLabelRenderer;

  constructor(themeManager: ThemeManager, target: string | SVGElement, userOptions: IUserOptions, derivedOptions: IDerivedOptions, clear: boolean = true) {
    if (typeof target === 'string') {
      this.svg = document.getElementById(target) as unknown as SVGElement;
    } else {
      this.svg = target;
    }

    this.container = null;
    this.userOpts = userOptions;
    this.derivedOpts = derivedOptions;
    this.themeManager = themeManager;
    this.labelRenderer = new SvgLabelRenderer(this.userOpts, () => this.themeManager.getColor('BACKGROUND'));
    this.uid = makeid(5);
    this.gradientId = 0;

    // maintain a list of line elements and their corresponding gradients
    // maintain a list of vertex elements
    // maintain a list of highlighting elements
    this.backgroundItems = []
    this.paths = [];
    this.vertices = [];
    this.gradients = [];
    this.highlights = [];

    // maintain the dimensions
    this.drawingWidth = 0;
    this.drawingHeight = 0;
    this.halfBondThickness = this.userOpts.rendering.bonds.bondThickness / 2.0;

    // create the mask
    this.maskElements = [];

    // min and max values of the coordinates
    this.maxX = -Number.MAX_VALUE;
    this.maxY = -Number.MAX_VALUE;
    this.minX = Number.MAX_VALUE;
    this.minY = Number.MAX_VALUE;

    // clear the svg element
    if (clear) {
      while (this.svg.firstChild) {
        this.svg.removeChild(this.svg.firstChild);
      }
    }

    // Create styles here as text measurement is done before constructSvg
    this.style = document.createElementNS('http://www.w3.org/2000/svg', 'style');

    // create the css styles
    this.style.appendChild(document.createTextNode(`
                .element {
                    font-family: ${this.userOpts.typography.fontFamily};
                }
                .sub {
                    font-family: ${this.userOpts.typography.fontFamily};
                }
                .annotation {
                    font-family: ${this.userOpts.typography.fontFamily};
                    font-size: ${this.userOpts.annotations.fontSize}pt;
                    text-anchor: middle;
                    dominant-baseline: text-after-edge;
                }
            `));

    if (this.svg) {
      this.svg.appendChild(this.style);
    } else {
      this.container = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      this.container.appendChild(this.style);
    }
  }

  constructSvg(): SVGElement | null {
    // TODO: add the defs element to put gradients in
    let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
      masks = document.createElementNS('http://www.w3.org/2000/svg', 'mask'),
      background = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
      highlights = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
      paths = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
      vertices = document.createElementNS('http://www.w3.org/2000/svg', 'g'),
      pathChildNodes = this.paths;


    let mask = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    mask.setAttributeNS(null, 'x', this.minX.toString());
    mask.setAttributeNS(null, 'y', this.minY.toString());
    mask.setAttributeNS(null, 'width', (this.maxX - this.minX).toString());
    mask.setAttributeNS(null, 'height', (this.maxY - this.minY).toString());
    mask.setAttributeNS(null, 'fill', 'white');

    masks.appendChild(mask);

    // give the mask an id
    masks.setAttributeNS(null, 'id', this.uid + '-text-mask');

    for (let path of pathChildNodes) {
      paths.appendChild(path);
    }

    for (let backgroundItem of this.backgroundItems) {
      background.appendChild(backgroundItem)
    }
    for (let highlight of this.highlights) {
      highlights.appendChild(highlight)
    }
    for (let vertex of this.vertices) {
      vertices.appendChild(vertex);
    }
    for (let mask of this.maskElements) {
      masks.appendChild(mask);
    }
    for (let gradient of this.gradients) {
      defs.appendChild(gradient);
    }

    paths.setAttributeNS(null, 'mask', 'url(#' + this.uid + '-text-mask)');

    this.updateViewbox(this.userOpts.canvas.scale);

    // Position the background
    background.setAttributeNS(null, 'style', `transform: translateX(${this.minX}px) translateY(${this.minY}px)`);

    if (this.svg) {
      this.svg.appendChild(defs);
      this.svg.appendChild(masks);
      this.svg.appendChild(background);
      this.svg.appendChild(highlights);
      this.svg.appendChild(paths);
      this.svg.appendChild(vertices);
    } else {
      this.container.appendChild(defs);
      this.container.appendChild(masks);
      this.container.appendChild(background);
      this.container.appendChild(paths);
      this.container.appendChild(vertices);
      return this.container;
    }
  }

  finalize(): void {
    this.constructSvg();
  }

  /**
   * Add a background to the svg.
   */
  addLayer(svg: SVGElement): void {
    this.backgroundItems.push(svg.firstChild as SVGElement);
  }

  /**
   * Create a linear gradient to apply to a line
   *
   * @param {Line} line the line to apply the gradiation to.
   */
  createGradient(line: Line): string {
    // create the gradient and add it
    let gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient'),
      gradientUrl = this.uid + `-line-${this.gradientId++}`,
      l = line.getLeftVector(),
      r = line.getRightVector(),
      fromX = l.x,
      fromY = l.y,
      toX = r.x,
      toY = r.y;

    gradient.setAttributeNS(null, 'id', gradientUrl);
    gradient.setAttributeNS(null, 'gradientUnits', 'userSpaceOnUse');
    gradient.setAttributeNS(null, 'x1', fromX.toString());
    gradient.setAttributeNS(null, 'y1', fromY.toString());
    gradient.setAttributeNS(null, 'x2', toX.toString());
    gradient.setAttributeNS(null, 'y2', toY.toString());

    let firstStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    firstStop.setAttributeNS(null, 'stop-color', this.themeManager.getColor(line.getLeftElement()) || this.themeManager.getColor('C'));
    firstStop.setAttributeNS(null, 'offset', '20%');

    let secondStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    secondStop.setAttributeNS(null, 'stop-color', this.themeManager.getColor(line.getRightElement() || this.themeManager.getColor('C')));
    secondStop.setAttributeNS(null, 'offset', '100%');

    gradient.appendChild(firstStop);
    gradient.appendChild(secondStop);

    this.gradients.push(gradient);

    return gradientUrl;
  }

  /**
   * Create a tspan element for sub or super scripts that styles the text
   * appropriately as one of those text types.
   *
   * @param {String} text the actual text
   * @param {String} shift the type of text, either 'sub', or 'super'
   */
  createSubSuperScripts(text: string, shift: string): SVGElement {
    let elem = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    elem.setAttributeNS(null, 'baseline-shift', shift);
    elem.appendChild(document.createTextNode(text));
    elem.setAttributeNS(null, 'class', 'sub');

    return elem;
  }

  /**
   * Determine drawing dimensiosn based on vertex positions.
   *
   * @param {Vertex[]} vertices An array of vertices containing the vertices associated with the current molecule.
   */
  determineDimensions(vertices: Vertex[]): void {
    for (var i = 0; i < vertices.length; i++) {
      if (!vertices[i].value.isDrawn) {
        continue;
      }

      let p = vertices[i].position;

      if (this.maxX < p.x) this.maxX = p.x;
      if (this.maxY < p.y) this.maxY = p.y;
      if (this.minX > p.x) this.minX = p.x;
      if (this.minY > p.y) this.minY = p.y;
    }

    // Add padding
    let padding = this.userOpts.canvas.padding;
    this.maxX += padding;
    this.maxY += padding;
    this.minX -= padding;
    this.minY -= padding;

    this.drawingWidth = this.maxX - this.minX;
    this.drawingHeight = this.maxY - this.minY;
  }

  getBounds(): IDrawingSurface.Bounds {
    return {
      minX: this.minX,
      minY: this.minY,
      maxX: this.maxX,
      maxY: this.maxY,
      width: this.drawingWidth,
      height: this.drawingHeight
    };
  }

  updateViewbox(scale: number): void {
    let x = this.minX;
    let y = this.minY;
    let width = this.maxX - this.minX;
    let height = this.maxY - this.minY;

    if (scale <= 0.0) {
      if (width > height) {
        let diff = width - height;
        height = width;
        y -= diff / 2.0;
      } else {
        let diff = height - width;
        width = height;
        x -= diff / 2.0;
      }
    } else {
      if (this.svg) {
        this.svg.style.width = scale * width + 'px';
        this.svg.style.height = scale * height + 'px';
      }
    }

    this.svg.setAttributeNS(null, 'viewBox', `${x} ${y} ${width} ${height}`);
  }

  /**
   * Draw an svg ellipse as a ball.
   *
   * @param {Number} x The x position of the text.
   * @param {Number} y The y position of the text.
   * @param {String} elementName The name of the element (single-letter).
   */
  drawBall(x: number, y: number, elementName: string): void {
    const radius = this.userOpts.rendering.atoms.pointRadius;
    const strokeBase = Math.max(0, this.userOpts.rendering.atoms.pointMaskRadius);
    const strokeScale = DEFAULT_POINT_RADIUS > 0 ? radius / DEFAULT_POINT_RADIUS : 1;
    const strokeWidth = strokeBase * strokeScale;
    const boundRadius = radius + strokeWidth / 2;

    if (x - boundRadius < this.minX) {
      this.minX = x - boundRadius;
    }

    if (x + boundRadius > this.maxX) {
      this.maxX = x + boundRadius;
    }

    if (y - boundRadius < this.minY) {
      this.minY = y - boundRadius;
    }

    if (y + boundRadius > this.maxY) {
      this.maxY = y + boundRadius;
    }

    const ball = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ball.setAttributeNS(null, 'cx', x.toString());
    ball.setAttributeNS(null, 'cy', y.toString());
    ball.setAttributeNS(null, 'r', radius.toString());
    ball.setAttributeNS(null, 'fill', this.themeManager.getColor(elementName));

    if (strokeWidth > 0) {
      const outline = this.themeManager.getColor('BACKGROUND');
      ball.setAttributeNS(null, 'stroke', outline);
      ball.setAttributeNS(null, 'stroke-width', strokeWidth.toString());
      ball.setAttributeNS(null, 'stroke-linejoin', 'round');
      ball.setAttributeNS(null, 'paint-order', 'stroke fill');
      ball.setAttributeNS(null, 'vector-effect', 'non-scaling-stroke');
    }

    this.vertices.push(ball);
  }

  /**
   * @param {Line} line the line object to create the wedge from
   */
  drawWedge(line: Line): void {
    const bondDash = this.userOpts.rendering.bonds;
    const inset = Number.isFinite(bondDash.dashedInsetPx) ? Math.max(bondDash.dashedInsetPx, 0) : 0;
    const geometry = this.computeWedgeGeometry(line, inset);
    const maxHalfWidth = this.getWedgeHalfWidth();
    const baseHalfWidth = 0;
    const tipHalfWidth = maxHalfWidth;
    const basePoint = geometry.baseIsRight ? line.getRightVector().clone() : line.getLeftVector().clone();

    let t = Vector2.add(basePoint.clone(), Vector2.multiplyScalar(geometry.normals[0].clone(), baseHalfWidth)),
      u = Vector2.add(geometry.tipPoint.clone(), Vector2.multiplyScalar(geometry.normals[0].clone(), tipHalfWidth)),
      v = Vector2.add(geometry.tipPoint.clone(), Vector2.multiplyScalar(geometry.normals[1].clone(), tipHalfWidth)),
      w = Vector2.add(basePoint.clone(), Vector2.multiplyScalar(geometry.normals[1].clone(), baseHalfWidth));

    let polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const gradientId = this.createWedgeGradient(line, geometry.basePoint.clone(), geometry.tipPoint.clone(), geometry.baseColor, geometry.tipColor);
    polygon.setAttributeNS(null, 'points', `${t.x},${t.y} ${u.x},${u.y} ${v.x},${v.y} ${w.x},${w.y}`);
    polygon.setAttributeNS(null, 'fill', `url('#${gradientId}')`);
    this.paths.push(polygon);
  }

  /* Draw a highlight for an atom
   *
   *  @param {Number} x The x position of the highlight
   *  @param {Number} y The y position of the highlight
   *  @param {string} color The color of the highlight, default #03fc9d
   */
  drawAtomHighlight(x: number, y: number, color?: string): void {
    let ball = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ball.setAttributeNS(null, 'cx', x.toString());
    ball.setAttributeNS(null, 'cy', y.toString());
    const highlightConfig = this.userOpts.appearance.highlights;
    const highlightRadius = highlightConfig.fallbackRadiusFactor * this.userOpts.rendering.bonds.bondLength;
    ball.setAttributeNS(null, 'r', highlightRadius.toString());
    const fillColor = color ?? this.themeManager.getHighlightColor(highlightConfig.fallbackColor);
    ball.setAttributeNS(null, 'fill', fillColor);

    this.highlights.push(ball);
  }

  /**
   * Draw a dashed wedge on the canvas.
   *
   * @param {Line} line A line.
   */
  drawDashedWedge(line: Line): void {
    if (isNaN(line.from.x) || isNaN(line.from.y) ||
      isNaN(line.to.x) || isNaN(line.to.y)) {
      return;
    }

    const bondDash = this.userOpts.rendering.bonds;
    const inset = Number.isFinite(bondDash.dashedInsetPx) ? Math.max(bondDash.dashedInsetPx, 0) : 1.0;
    const geometry = this.computeWedgeGeometry(line, inset);
    const maxHalfWidth = this.getWedgeHalfWidth();
    const baseHalfWidth = maxHalfWidth;
    const tipHalfWidth = 0;
    const length = geometry.length;
    if (!isFinite(length) || length <= 0) {
      return;
    }

    const dir = geometry.direction.clone();
    const bondThickness = this.userOpts.rendering.bonds.bondThickness || 1;
    const spacingMultiplierRaw = bondDash.dashedWedgeSpacingMultiplier;
    const spacingMultiplier = Number.isFinite(spacingMultiplierRaw) && spacingMultiplierRaw > 0 ? spacingMultiplierRaw : 3.0;
    const baseUnit = bondThickness * spacingMultiplier;
    const divisor = baseUnit !== 0 ? length / baseUnit : 0;
    const rawStep = divisor !== 0 ? bondDash.dashedStepFactor / divisor : bondDash.dashedStepFactor;
    const step = Math.max(rawStep, 1e-3);

    const gradientId = this.createWedgeGradient(line, geometry.basePoint.clone(), geometry.tipPoint.clone(), geometry.baseColor, geometry.tipColor);

    for (let t = 0.0; t < 1.0; t += step) {
      const to = Vector2.multiplyScalar(dir.clone(), t * length);
      const width = tipHalfWidth + (baseHalfWidth - tipHalfWidth) * t;
      const dashOffset = Vector2.multiplyScalar(geometry.normals[0].clone(), width);

      let startDash = Vector2.add(geometry.basePoint.clone(), to);
      startDash.subtract(dashOffset);
      let endDash = startDash.clone();
      endDash.add(Vector2.multiplyScalar(dashOffset, 2.0));

      this.drawLine(new Line(startDash.clone(), endDash.clone(), line.elementFrom, line.elementTo), false, gradientId, 'round');
    }
  }

  /**
   * Draws a debug dot at a given coordinate and adds text.
   *
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordindate.
   * @param {String} [debugText=''] A string.
   * @param {String} [color='#f00'] A color in hex form.
   */
  drawDebugPoint(x: number, y: number, debugText: string = '', color: string = '#f00'): void {
    let point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    point.setAttributeNS(null, 'cx', x.toString());
    point.setAttributeNS(null, 'cy', y.toString());
    point.setAttributeNS(null, 'r', '2');
    point.setAttributeNS(null, 'fill', '#f00');
    this.vertices.push(point);
    this.drawDebugText(x, y, debugText);
  }

  /**
   * Draws a debug text message at a given position
   *
   * @param {Number} x The x coordinate.
   * @param {Number} y The y coordinate.
   * @param {String} text The debug text.
   */
  drawDebugText(x: number, y: number, text: string): void {
    let textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElem.setAttributeNS(null, 'x', x.toString());
    textElem.setAttributeNS(null, 'y', y.toString());
    textElem.setAttributeNS(null, 'class', 'debug');
    textElem.setAttributeNS(null, 'fill', '#ff0000');
    const outlineWidth = this.userOpts.meta.debugTextOutline ?? 2;
    if (outlineWidth > 0) {
      const outlineColor = this.themeManager.getColor('BACKGROUND');
      textElem.setAttributeNS(null, 'stroke', outlineColor);
      textElem.setAttributeNS(null, 'stroke-width', outlineWidth.toString());
      textElem.setAttributeNS(null, 'stroke-linejoin', 'round');
      textElem.setAttributeNS(null, 'paint-order', 'stroke fill');
      textElem.setAttributeNS(null, 'vector-effect', 'non-scaling-stroke');
    }
    textElem.setAttributeNS(null, 'style', `
                font: 5px Droid Sans, sans-serif;
            `);
    textElem.appendChild(document.createTextNode(text));

    this.vertices.push(textElem);
  }

  drawAnnotation(x: number, y: number, text: string, options?: { fontSize?: number; color?: string }): void {
    const annotation = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const fontSize = options?.fontSize ?? this.userOpts.annotations.fontSize;
    annotation.setAttributeNS(null, 'x', x.toString());
    annotation.setAttributeNS(null, 'y', y.toString());
    annotation.setAttributeNS(null, 'class', 'annotation');
    annotation.setAttributeNS(null, 'text-anchor', 'middle');
    annotation.setAttributeNS(null, 'fill', options?.color ?? this.themeManager.getColor(null));
    annotation.setAttributeNS(null, 'font-size', `${fontSize}`);

    const lines = text.split('\n');
    lines.forEach((line, index) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      if (index > 0) {
        tspan.setAttributeNS(null, 'x', x.toString());
        tspan.setAttributeNS(null, 'dy', `${fontSize}`);
      }
      tspan.textContent = line;
      annotation.appendChild(tspan);
    });

    this.vertices.push(annotation);
  }


  /**
   * Draws a ring.
   *
   * @param {x} x The x coordinate of the ring.
   * @param {y} r The y coordinate of the ring.
   * @param {s} s The size of the ring.
   */
  drawRing(x: number, y: number, s: number): void {
    let circleElem = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    let radius = MathHelper.apothemFromSideLength(this.userOpts.rendering.bonds.bondLength, s);
    circleElem.setAttributeNS(null, 'cx', x.toString());
    circleElem.setAttributeNS(null, 'cy', y.toString());
    circleElem.setAttributeNS(null, 'r', (radius - this.userOpts.rendering.bonds.bondSpacing).toString());
    circleElem.setAttributeNS(null, 'stroke', this.themeManager.getColor('C'));
    circleElem.setAttributeNS(null, 'stroke-width', this.userOpts.rendering.bonds.bondThickness.toString());
    circleElem.setAttributeNS(null, 'fill', 'none');
    this.paths.push(circleElem);
  }


  /**
   * Draws a line.
   *
   * @param {Line} line A line.
   * @param {Boolean} dashed defaults to false.
   * @param {String} gradient gradient url. Defaults to null.
   */
  drawLine(line: Line, dashed: boolean = false, gradient: string | null = null, linecap: string = 'round', strokeColor?: string): void {
    let stylesArr = [
        ['stroke-width', this.userOpts.rendering.bonds.bondThickness],
        ['stroke-linecap', linecap],
        ['stroke-dasharray', dashed ? this.userOpts.rendering.bonds.dashPattern.join(',') : 'none'],
      ],
      l = line.getLeftVector(),
      r = line.getRightVector(),
      fromX = l.x,
      fromY = l.y,
      toX = r.x,
      toY = r.y;

    let styles = stylesArr.map(sub => sub.join(':')).join(';'),
      lineElem = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    lineElem.setAttributeNS(null, 'x1', fromX.toString());
    lineElem.setAttributeNS(null, 'y1', fromY.toString());
    lineElem.setAttributeNS(null, 'x2', toX.toString());
    lineElem.setAttributeNS(null, 'y2', toY.toString());
    lineElem.setAttributeNS(null, 'style', styles);
    this.paths.push(lineElem);

    if (strokeColor) {
      lineElem.setAttributeNS(null, 'stroke', this.resolveStrokeColor(strokeColor));
      return;
    }

    if (gradient == null) {
      gradient = this.createGradient(line);
    }
    lineElem.setAttributeNS(null, 'stroke', `url('#${gradient}')`);
  }

  /**
   * Draw a point.
   *
   * @param {Number} x The x position of the point.
   * @param {Number} y The y position of the point.
   * @param {String} elementName The name of the element (single-letter).
   */
  drawPoint(x: number, y: number, elementName: string): void {
    const radius = this.userOpts.rendering.atoms.pointRadius;
    const strokeBase = Math.max(0, this.userOpts.rendering.atoms.pointMaskRadius);
    const strokeScale = DEFAULT_POINT_RADIUS > 0 ? radius / DEFAULT_POINT_RADIUS : 1;
    const strokeWidth = strokeBase * strokeScale;
    const boundRadius = radius + strokeWidth / 2;

    if (x - boundRadius < this.minX) {
      this.minX = x - boundRadius;
    }

    if (x + boundRadius > this.maxX) {
      this.maxX = x + boundRadius;
    }

    if (y - boundRadius < this.minY) {
      this.minY = y - boundRadius;
    }

    if (y + boundRadius > this.maxY) {
      this.maxY = y + boundRadius;
    }

    const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    point.setAttributeNS(null, 'cx', x.toString());
    point.setAttributeNS(null, 'cy', y.toString());
    point.setAttributeNS(null, 'r', radius.toString());
    point.setAttributeNS(null, 'fill', this.themeManager.getColor(elementName));

    if (strokeWidth > 0) {
      const outline = this.themeManager.getColor('BACKGROUND');
      point.setAttributeNS(null, 'stroke', outline);
      point.setAttributeNS(null, 'stroke-width', strokeWidth.toString());
      point.setAttributeNS(null, 'stroke-linejoin', 'round');
      point.setAttributeNS(null, 'paint-order', 'stroke fill');
      point.setAttributeNS(null, 'vector-effect', 'non-scaling-stroke');
    }

    this.vertices.push(point);
  }

  drawDashedPolygon(points: Vector2[], color?: string): void {
    if (!points || points.length < 2) {
      return;
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const segments = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`);
    path.setAttributeNS(null, 'd', `${segments.join(' ')} Z`);
    path.setAttributeNS(null, 'fill', 'none');
    path.setAttributeNS(null, 'stroke', this.resolveStrokeColor(color));
    path.setAttributeNS(null, 'stroke-width', this.userOpts.rendering.bonds.bondThickness.toString());
    path.setAttributeNS(null, 'stroke-linecap', 'round');
    path.setAttributeNS(null, 'stroke-linejoin', 'round');
    path.setAttributeNS(null, 'stroke-dasharray', this.userOpts.rendering.bonds.dashPattern.join(','));
    this.paths.push(path);
  }


  /**
   * Draw a text to the canvas.
   *
   * @param {Number} x The x position of the text.
   * @param {Number} y The y position of the text.
   * @param {String} elementName The name of the element (single-letter).
   * @param {Number} hydrogens The number of hydrogen atoms.
   * @param {String} direction The direction of the text in relation to the associated vertex.
   * @param {Boolean} isTerminal A boolean indicating whether or not the vertex is terminal.
   * @param {Number} charge The charge of the atom.
   * @param {Number} isotope The isotope number.
   * @param {Number} totalVertices The total number of vertices in the graph.
   * @param {Object} attachedPseudoElement A map with containing information for pseudo elements or concatinated elements. The key is comprised of the element symbol and the hydrogen count.
   * @param {String} attachedPseudoElement.element The element symbol.
   * @param {Number} attachedPseudoElement.count The number of occurences that match the key.
   * @param {Number} attachedPseudoElement.hyrogenCount The number of hydrogens attached to each atom matching the key.
   */
  drawText(x: number, y: number, elementName: string, hydrogens: number, direction: TextDirection, isTerminal: boolean, charge: number, isotope: number, totalVertices: number, attachedPseudoElement: AttachedPseudoElements = {}): void {
    const segments: LabelSegment[] = [];
    let display = elementName;

    let hydrogenGroupCounter = 0;
    const nextHydrogenGroupId = (): string => `hydrogen-${hydrogenGroupCounter++}`;

    if (charge !== 0 && charge !== null) {
      display += SvgUnicodeHelper.createUnicodeCharge(charge);
    }

    if (isotope !== 0 && isotope !== null) {
      display = SvgUnicodeHelper.createUnicodeSuperscript(isotope) + display;
    }

    const mainSegment: LabelSegment = {
      display: elementName,
      element: elementName,
      kind: 'primary',
      fontSize: this.userOpts.typography.fontSizeLarge,
      category: 'main'
    };

    if (isotope !== 0 && isotope !== null) {
      segments.push({
        display: isotope.toString(),
        element: elementName,
        kind: 'satellite',
        fontSize: this.userOpts.typography.fontSizeSmall,
        category: 'isotope'
      });
    }

    segments.push(mainSegment);

    if (charge !== 0 && charge !== null) {
      segments.push({
        display: SvgUnicodeHelper.createUnicodeCharge(charge),
        element: elementName,
        kind: 'satellite',
        fontSize: this.userOpts.typography.fontSizeLarge,
        category: 'charge'
      });
    }

    if (hydrogens > 0) {
      const hydrogenGroupId = nextHydrogenGroupId();
      segments.push({ display: 'H', element: 'H', kind: 'satellite', fontSize: this.userOpts.typography.fontSizeLarge, category: 'hydrogen', groupId: hydrogenGroupId });
      if (hydrogens > 1) {
        segments.push({
          display: SvgUnicodeHelper.createUnicodeSubscript(hydrogens),
          element: 'H',
          kind: 'satellite',
          fontSize: this.userOpts.typography.fontSizeLarge,
          category: 'hydrogenCount',
          groupId: hydrogenGroupId
        });
      }
    }

    // TODO: Better handle exceptions
    // Exception for nitro (draw nitro as NO2 instead of N+O-O)
    if (charge === 1 && elementName === 'N' && attachedPseudoElement.hasOwnProperty('0O') &&
      attachedPseudoElement.hasOwnProperty('0O-1')) {
      attachedPseudoElement = { '0O': { element: 'O', count: 2, hydrogenCount: 0, previousElement: 'C', charge: 0 } };
      charge = 0;
    }

    for (let key in attachedPseudoElement) {
      if (!attachedPseudoElement.hasOwnProperty(key)) {
        continue;
      }

      let pe = attachedPseudoElement[key];
      let pseudoDisplay = pe.element;

      if (pe.count > 1) {
        pseudoDisplay += SvgUnicodeHelper.createUnicodeSubscript(pe.count);
      }

      segments.push({
        display: pseudoDisplay,
        element: pe.element,
        kind: 'satellite',
        fontSize: this.userOpts.typography.fontSizeLarge,
        category: 'main'
      });

      if (pe.charge !== 0) {
        segments.push({
          display: SvgUnicodeHelper.createUnicodeCharge(pe.charge),
          element: pe.element,
          kind: 'satellite',
          fontSize: this.userOpts.typography.fontSizeSmall,
          category: 'charge'
        });
      }

      if (pe.hydrogenCount > 0) {
        const hydrogenGroupId = nextHydrogenGroupId();
        segments.push({ display: 'H', element: 'H', kind: 'satellite', fontSize: this.userOpts.typography.fontSizeLarge, category: 'hydrogen', groupId: hydrogenGroupId });
        if (pe.hydrogenCount > 1) {
          segments.push({
            display: SvgUnicodeHelper.createUnicodeSubscript(pe.hydrogenCount),
            element: 'H',
            kind: 'satellite',
            fontSize: this.userOpts.typography.fontSizeSmall,
            category: 'hydrogenCount',
            groupId: hydrogenGroupId
          });
        }
      }
    }

    this.writeAbsoluteLabels(segments, direction, x, y, totalVertices === 1);
  }

  private writeAbsoluteLabels(segments: LabelSegment[], direction: TextDirection, x: number, y: number, singleVertex: boolean): void {
    if (!segments.length) {
      return;
    }

    const outlinePadding = this.userOpts.typography.labelOutlineWidth ?? 0;
    const metricsCache = new Map<string, { width: number; height: number }>();
    const measurementLineHeight = this.userOpts.typography.measurementLineHeight ?? 0.9;
    const measure = (segment: LabelSegment): { width: number; height: number } => {
      const fontSize = segment.fontSize ?? this.userOpts.typography.fontSizeLarge;
      const key = `${segment.display}@${fontSize}`;
      if (!metricsCache.has(key)) {
        const base = SvgTextHelper.measureText(segment.display, fontSize, this.userOpts.typography.fontFamily, measurementLineHeight);
        metricsCache.set(key, {
          width: base.width + outlinePadding,
          height: base.height + outlinePadding
        });
      }
      return metricsCache.get(key)!;
    };

    const needsReverse = direction === 'left' || direction === 'up';
    const orderedSegments = needsReverse ? segments.slice().reverse() : segments.slice();
    const chargeSegments = orderedSegments.filter((segment) => segment.category === 'charge');
    const isotopeSegments = orderedSegments.filter((segment) => segment.category === 'isotope');
    const hydrogenCountSegments = orderedSegments.filter((segment) => segment.category === 'hydrogenCount');
    const layoutSegments = orderedSegments.filter((segment) => segment.category !== 'charge' && segment.category !== 'isotope' && segment.category !== 'hydrogenCount');
    const baseFontSizeMap = new Map<LabelCategory | undefined, number>();
    orderedSegments.forEach((segment) => {
      if (!baseFontSizeMap.has(segment.category)) {
        baseFontSizeMap.set(segment.category, segment.fontSize ?? this.userOpts.typography.fontSizeLarge);
      }
    });
    const placements: LabelPlacement[] = [];

    const hasSatellites = segments.some((segment) => segment.kind === 'satellite');

    const hydrogenPlacementsByGroup = new Map<string, LabelPlacement>();

    if (['up', 'down'].contains(direction)) {
      const lineHeight = this.userOpts.typography.fontSizeLarge + (this.userOpts.typography.labelOutlineWidth ?? 0);
      let currentY = y;

      layoutSegments.forEach((segment, index) => {
        if (index > 0) {
          currentY += direction === 'up' ? -lineHeight : lineHeight;
        }

        const metrics = measure(segment);
        const placement: LabelPlacement = {
          segment,
          x,
          y: currentY,
          width: metrics.width,
          height: metrics.height
        };
        placements.push(placement);
        if (segment.category === 'hydrogen' && segment.groupId) {
          hydrogenPlacementsByGroup.set(segment.groupId, placement);
        }
      });
    } else {
      const metricsList = layoutSegments.map((segment) => measure(segment));
      const spacingValues = layoutSegments.map((segment, index) => {
        if (index === 0) {
          return 0;
        }
        return this.getCategorySpacing(layoutSegments[index - 1].category, segment.category);
      });
      const totalWidth = metricsList.reduce((sum, metrics) => sum + metrics.width, 0) +
        spacingValues.reduce((sum, spacing) => sum + spacing, 0);
      let cursor = x - totalWidth / 2;

      layoutSegments.forEach((segment, index) => {
        const spacing = spacingValues[index];
        if (spacing > 0) {
          cursor += spacing;
        }
        const metrics = metricsList[index];
        const centerX = cursor + metrics.width / 2;
        const placement: LabelPlacement = {
          segment,
          x: centerX,
          y,
          width: metrics.width,
          height: metrics.height
        };
        placements.push(placement);
        if (segment.category === 'hydrogen' && segment.groupId) {
          hydrogenPlacementsByGroup.set(segment.groupId, placement);
        }
        cursor += metrics.width;
      });
    }

    const primaryPlacement = placements.find((placement) => placement.segment.kind === 'primary');
    if (primaryPlacement) {
      const offsetX = x - primaryPlacement.x;
      const offsetY = y - primaryPlacement.y;
      if (offsetX !== 0 || offsetY !== 0) {
        placements.forEach((placement) => {
          placement.x += offsetX;
          placement.y += offsetY;
        });
      }
      this.createLabelMask(primaryPlacement.x, primaryPlacement.y, primaryPlacement.segment, hasSatellites);
    } else {
      this.createLabelMask(x, y, segments[0], hasSatellites);
    }

    const primaryLeftEdge = primaryPlacement ? primaryPlacement.x - primaryPlacement.width / 2 : x;
    const primaryRightEdge = primaryPlacement ? primaryPlacement.x + primaryPlacement.width / 2 : x;
    const primaryBaseline = primaryPlacement ? primaryPlacement.y : y;

    if (isotopeSegments.length > 0) {
      const smallOffset = (isotopeSegments[0].fontSize) * 0.5;
      const isotopeY = primaryBaseline - smallOffset;
      let isotopeCursor = primaryLeftEdge;
      const isotopeSpacing = this.getCategorySpacing('main', 'isotope');

      isotopeSegments.forEach((segment) => {
        const metrics = measure(segment);
        isotopeCursor -= isotopeSpacing;
        isotopeCursor -= metrics.width / 2;
        placements.push({
          segment,
          x: isotopeCursor,
          y: isotopeY,
          width: metrics.width,
          height: metrics.height
        });
        isotopeCursor -= metrics.width / 2;
      });
    }

    if (chargeSegments.length > 0) {
      const chargeY = primaryBaseline;
      let chargeCursor = primaryRightEdge;
      const chargeSpacing = this.getCategorySpacing('main', 'charge');

      chargeSegments.forEach((segment) => {
        const metrics = measure(segment);
        chargeCursor += chargeSpacing;
        chargeCursor += metrics.width / 2;
        placements.push({
          segment,
          x: chargeCursor,
          y: chargeY,
          width: metrics.width,
          height: metrics.height
        });
        chargeCursor += metrics.width / 2;
      });
    }

    if (hydrogenCountSegments.length > 0) {
      const hydrogenSpacing = this.getCategorySpacing('hydrogen', 'hydrogenCount');
      hydrogenCountSegments.forEach((segment) => {
        const basePlacement = segment.groupId ? hydrogenPlacementsByGroup.get(segment.groupId) : undefined;
        if (!basePlacement) {
          return;
        }
        const metrics = measure(segment);
        const baselineY = basePlacement.y;
        if (primaryPlacement && basePlacement.x < primaryPlacement.x && Math.abs(basePlacement.y - primaryPlacement.y) < this.userOpts.typography.fontSizeLarge) {
          basePlacement.x -= hydrogenSpacing + metrics.width;
        }
        const countX = basePlacement.x + basePlacement.width / 2 + hydrogenSpacing + metrics.width / 2;
        placements.push({
          segment,
          x: countX,
          y: baselineY,
          width: metrics.width,
          height: metrics.height
        });
      });
    }

    placements.forEach((placement) => {
      const color = this.themeManager.getColor(placement.segment.element);
      const fontSize = placement.segment.fontSize ?? this.userOpts.typography.fontSizeLarge;
      const textElem = placement.segment.kind === 'primary'
        ? this.labelRenderer.drawPrimaryLabel(placement.x, placement.y, placement.segment.display, color, fontSize)
        : this.labelRenderer.drawSatellite(placement.x, placement.y, placement.segment.display, color, fontSize, placement.segment.category);

      this.vertices.push(textElem);
    });

    this.updateBoundsFromPlacements(placements, singleVertex);
  }

  private createLabelMask(cx: number, cy: number, segment: LabelSegment, hasSatellites: boolean): void {
    const baseScale = this.userOpts.annotations.mask.baseScale ?? 0.75;
    const wideScale = this.userOpts.annotations.mask.wideScale ?? 1.1;
    const shouldUseWide = segment.kind === 'primary' && hasSatellites;
    const maskRadius = this.userOpts.typography.fontSizeLarge * (shouldUseWide ? wideScale : baseScale);

    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    mask.setAttributeNS(null, 'cx', cx.toString());
    mask.setAttributeNS(null, 'cy', cy.toString());
    mask.setAttributeNS(null, 'r', maskRadius.toString());
    mask.setAttributeNS(null, 'fill', 'black');

    this.maskElements.push(mask);
  }

  private updateBoundsFromPlacements(placements: LabelPlacement[], _singleVertex: boolean): void {
    if (!placements.length) {
      return;
    }

    let localMinX = Number.POSITIVE_INFINITY;
    let localMaxX = -Number.POSITIVE_INFINITY;
    let localMinY = Number.POSITIVE_INFINITY;
    let localMaxY = -Number.POSITIVE_INFINITY;

    placements.forEach((placement) => {
      const halfWidth = placement.width / 2;
      const halfHeight = placement.height / 2;

      localMinX = Math.min(localMinX, placement.x - halfWidth);
      localMaxX = Math.max(localMaxX, placement.x + halfWidth);
      localMinY = Math.min(localMinY, placement.y - halfHeight);
      localMaxY = Math.max(localMaxY, placement.y + halfHeight);
    });

    this.minX = Math.min(this.minX, localMinX);
    this.maxX = Math.max(this.maxX, localMaxX);
    this.minY = Math.min(this.minY, localMinY);
    this.maxY = Math.max(this.maxY, localMaxY);

    if (_singleVertex) {
      return;
    }
  }

  private getCategorySpacing(inner: LabelCategory, outer: LabelCategory): number {
    const base = this.userOpts.typography.labelOutlineWidth;
    const fallback = this.userOpts.typography.fontSizeLarge * this.userOpts.typography.labelSpacing.baseUnitScale;
    const spacing = Math.max(base ?? 0, fallback);

    const spacingConfig = this.userOpts.typography.labelSpacing;
    const pair = `${inner}:${outer}`;
    switch (pair) {
      case 'main:charge':
        return spacing * spacingConfig.chargeMultiplier;
      case 'main:isotope':
        return spacing * spacingConfig.isotopeMultiplier;
      case 'main:hydrogen':
        return spacing * spacingConfig.hydrogenMultiplier;
      case 'charge:charge':
        return spacing * spacingConfig.chargeMultiplier;
      case 'hydrogen:hydrogenCount':
      case 'hydrogenCount:hydrogen':
        return spacing * spacingConfig.hydrogenCountMultiplier;
      default:
        return 0;
    }
  }

  /**
   * Draw the wrapped SVG to a canvas.
   * @param {HTMLCanvasElement} canvas The canvas element to draw the svg to.
   */
  toCanvas(canvas: string | HTMLCanvasElement, width: number, height: number): void {
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas) as HTMLCanvasElement;
    }

    let image = new Image();

    image.onload = function () {
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    };

    image.src = 'data:image/svg+xml;charset-utf-8,' + encodeURIComponent(this.svg.outerHTML);
  }

  private resolveStrokeColor(preference?: string): string {
    if (!preference) {
      return this.themeManager.getColor('C');
    }

    const trimmed = preference.trim();
    if (!trimmed) {
      return this.themeManager.getColor('C');
    }

    const lower = trimmed.toLowerCase();
    if (trimmed.startsWith('#') ||
      lower.startsWith('rgb') ||
      lower.startsWith('hsl') ||
      trimmed.startsWith('var(') ||
      lower === 'currentcolor') {
      return trimmed;
    }

    return this.themeManager.getColor(trimmed);
  }

  private createWedgeGradient(line: Line, start: Vector2, end: Vector2, baseColor: string, tipColor: string): string {
    const gradientId = this.uid + `-wedge-${this.gradientId++}`;
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttributeNS(null, 'id', gradientId);
    gradient.setAttributeNS(null, 'gradientUnits', 'userSpaceOnUse');
    gradient.setAttributeNS(null, 'x1', start.x.toString());
    gradient.setAttributeNS(null, 'y1', start.y.toString());
    gradient.setAttributeNS(null, 'x2', end.x.toString());
    gradient.setAttributeNS(null, 'y2', end.y.toString());
    const firstStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    firstStop.setAttributeNS(null, 'stop-color', baseColor);
    firstStop.setAttributeNS(null, 'offset', '20%');
    const secondStop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    secondStop.setAttributeNS(null, 'stop-color', tipColor);
    secondStop.setAttributeNS(null, 'offset', '100%');
    gradient.appendChild(firstStop);
    gradient.appendChild(secondStop);
    this.gradients.push(gradient);
    return gradientId;
  }

  private resolveWedgeContext(line: Line): {
    baseIsRight: boolean;
    baseColor: string;
    tipColor: string;
    leftVector: Vector2;
    rightVector: Vector2;
  } {
    const leftVector = line.getLeftVector();
    const rightVector = line.getRightVector();
    const chiralVector = line.chiralFrom ? line.from : (line.chiralTo ? line.to : null);
    const baseIsRight = chiralVector ? rightVector === chiralVector : line.getRightChiral();
    const defaultColor = this.themeManager.getColor('C');
    const leftElement = line.getLeftElement();
    const rightElement = line.getRightElement();
    const leftColor = leftElement ? this.themeManager.getColor(leftElement) : defaultColor;
    const rightColor = rightElement ? this.themeManager.getColor(rightElement) : defaultColor;
    return {
      baseIsRight,
      baseColor: baseIsRight ? rightColor : leftColor,
      tipColor: baseIsRight ? leftColor : rightColor,
      leftVector,
      rightVector,
    };
  }

  private getWedgeHalfWidth(): number {
    const bondDash = this.userOpts.rendering.bonds;
    const widthFactor = Number.isFinite(bondDash.dashedWidthFactorSvg) ? bondDash.dashedWidthFactorSvg : 0.5;
    return this.userOpts.typography.fontSizeLarge * widthFactor;
  }

  private computeWedgeGeometry(line: Line, inset: number = 0): {
    basePoint: Vector2;
    tipPoint: Vector2;
    normals: Vector2[];
    direction: Vector2;
    length: number;
    baseColor: string;
    tipColor: string;
    baseIsRight: boolean;
  } {
    const context = this.resolveWedgeContext(line);
    const workingLine = line.clone();
    if (inset > 0) {
      if (context.baseIsRight) {
        workingLine.shortenRight(inset);
      } else {
        workingLine.shortenLeft(inset);
      }
    }

    const basePoint = context.baseIsRight ? workingLine.getRightVector().clone() : workingLine.getLeftVector().clone();
    const tipPoint = context.baseIsRight ? workingLine.getLeftVector().clone() : workingLine.getRightVector().clone();
    const normals = Vector2.normals(basePoint.clone(), tipPoint.clone());
    normals[0].normalize();
    normals[1].normalize();
    const direction = Vector2.subtract(tipPoint.clone(), basePoint.clone());
    const length = direction.length();
    direction.normalize();

    return {
      basePoint,
      tipPoint,
      normals,
      direction,
      length,
      baseColor: context.baseColor,
      tipColor: context.tipColor,
      baseIsRight: context.baseIsRight,
    };
  }
}

export = SvgWrapper;
