import Vector2 = require('../graph/Vector2');
import Line = require('../graph/Line');
import Vertex = require('../graph/Vertex');
import Ring = require('../graph/Ring');
import ThemeManager = require('../config/ThemeManager');
import { IUserOptions, IDerivedOptions, IThemeColors, AttachedPseudoElements } from '../config/IOptions';
import { TextDirection } from '../types/CommonTypes';
/**
 * A class wrapping a canvas element.
 *
 * @property {HTMLElement} canvas The HTML element for the canvas associated with this CanvasDrawer instance.
 * @property {CanvasRenderingContext2D} ctx The CanvasRenderingContext2D of the canvas associated with this CanvasDrawer instance.
 * @property {Object} colors The colors object as defined in the SmilesDrawer options.
 * @property {Object} opts The SmilesDrawer options.
 * @property {Number} drawingWidth The width of the canvas.
 * @property {Number} drawingHeight The height of the canvas.
 * @property {Number} offsetX The horizontal offset required for centering the drawing.
 * @property {Number} offsetY The vertical offset required for centering the drawing.
 * @property {Number} fontLarge The large font size in pt.
 * @property {Number} fontSmall The small font size in pt.
 */
declare class CanvasDrawer {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D | null;
    themeManager: ThemeManager;
    userOpts: IUserOptions;
    derivedOpts: IDerivedOptions;
    drawingWidth: number;
    drawingHeight: number;
    offsetX: number;
    offsetY: number;
    fontLarge: string;
    fontSmall: string;
    hydrogenWidth: number;
    halfHydrogenWidth: number;
    halfBondThickness: number;
    devicePixelRatio: number;
    backingStoreRatio: number;
    ratio: number;
    colors: IThemeColors;
    private wedgeDrawer;
    private primitiveDrawer;
    private textDrawer;
    /**
     * The constructor for the class CanvasWrapper.
     *
     * @param {(String|HTMLElement)} target The canvas id or the canvas HTMLElement.
     * @param {ThemeManager} themeManager Theme manager for setting proper colors.
     * @param {Object} options The smiles drawer options object.
     */
    constructor(target: string | HTMLCanvasElement, themeManager: ThemeManager, userOptions: IUserOptions, derivedOptions: IDerivedOptions);
    /**
     * Update the width and height of the canvas
     *
     * @param {Number} width
     * @param {Number} height
     */
    updateSize(width: number, height: number): void;
    /**
     * Sets a provided theme.
     *
     * @param {Object} theme A theme from the smiles drawer options.
     */
    setTheme(theme: IThemeColors): void;
    /**
     * Scale the canvas based on vertex positions.
     *
     * @param {Vertex[]} vertices An array of vertices containing the vertices associated with the current molecule.
     */
    scale(vertices: Vertex[]): void;
    /**
     * Resets the transform of the canvas.
     */
    reset(): void;
    /**
     * Returns the hex code of a color associated with a key from the current theme.
     *
     * @param {String} key The color key in the theme (e.g. C, N, BACKGROUND, ...).
     * @returns {String} A color hex value.
     */
    getColor(key: string): string;
    /**
     * Draws a dubug dot at a given coordinate and adds text.
     *
     * @param {Number} x The x coordinate.
     * @param {Number} y The y coordindate.
     * @param {String} [debugText=''] A string.
     * @param {String} [color='#f00'] A color in hex form.
     */
    drawDebugPoint(x: number, y: number, debugText?: string, color?: string): void;
    /**
     * Clear the canvas.
     *
     */
    clear(): void;
    drawWedge(line: Line, width?: number): void;
    drawDashedWedge(line: Line): void;
    drawCircle(x: number, y: number, radius: number, color: string, fill?: boolean, debug?: boolean, debugText?: string): void;
    drawLine(line: Line, dashed?: boolean, alpha?: number): void;
    drawBall(x: number, y: number, elementName: string): void;
    drawPoint(x: number, y: number, elementName: string): void;
    drawAromaticityRing(ring: Ring): void;
    drawDashedPolygon(points: Vector2[], color?: string): void;
    drawDebugText(x: number, y: number, text: string): void;
    drawText(x: number, y: number, elementName: string, hydrogens: number, direction: TextDirection, isTerminal: boolean, charge: number, isotope: number, vertexCount: number, attachedPseudoElement?: AttachedPseudoElements): void;
    getChargeText(charge: number): string;
}
export = CanvasDrawer;
//# sourceMappingURL=CanvasDrawer.d.ts.map