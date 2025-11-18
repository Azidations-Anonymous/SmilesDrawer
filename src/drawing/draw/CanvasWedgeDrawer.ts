import Vector2 = require('../../graph/Vector2');
import CanvasDrawer = require('../CanvasDrawer');
import Line = require('../../graph/Line');

class CanvasWedgeDrawer {
  constructor(private wrapper: CanvasDrawer) {}

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
    const defaultColor = this.wrapper.themeManager.getColor('C');
    const leftElement = line.getLeftElement();
    const rightElement = line.getRightElement();
    const leftColor = leftElement ? this.wrapper.themeManager.getColor(leftElement) : defaultColor;
    const rightColor = rightElement ? this.wrapper.themeManager.getColor(rightElement) : defaultColor;
    return {
      baseIsRight,
      baseColor: baseIsRight ? rightColor : leftColor,
      tipColor: baseIsRight ? leftColor : rightColor,
      leftVector,
      rightVector,
    };
  }



    /**
     * Draw a wedge on the canvas.
     *
     * @param {Line} line A line.
     * @param {Number} width The wedge width.
     */
    drawWedge(line: Line, width: number = 1.0): void {
        if (isNaN(line.from.x) || isNaN(line.from.y) ||
            isNaN(line.to.x) || isNaN(line.to.y)) {
            return;
        }

        let ctx = this.wrapper.ctx;
        let offsetX = this.wrapper.offsetX;
        let offsetY = this.wrapper.offsetY;

        const wedge = this.resolveWedgeContext(line);
        let l = wedge.leftVector.clone();
        let r = wedge.rightVector.clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        ctx.save();

        let normals = Vector2.normals(l, r);

        normals[0].normalize();
        normals[1].normalize();

        let start = wedge.baseIsRight ? r : l;
        let end = wedge.baseIsRight ? l : r;

        const stereo = this.wrapper.userOpts.rendering.stereochemistry;
        const tipPadding = stereo.wedgeTipPaddingPx;
        const sidePadding = stereo.wedgeSidePaddingPx;
        let t = Vector2.add(start, Vector2.multiplyScalar(normals[0], this.wrapper.halfBondThickness));
        let u = Vector2.add(end, Vector2.multiplyScalar(normals[0], tipPadding + this.wrapper.halfBondThickness));
        let v = Vector2.add(end, Vector2.multiplyScalar(normals[1], tipPadding + this.wrapper.halfBondThickness));
        let w = Vector2.add(start, Vector2.multiplyScalar(normals[1], sidePadding + this.wrapper.halfBondThickness));

        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.lineTo(w.x, w.y);

        const { baseColor, tipColor } = wedge;
        let gradient = this.wrapper.ctx.createRadialGradient(r.x, r.y, this.wrapper.userOpts.rendering.bonds.bondLength, r.x, r.y, 0);
        gradient.addColorStop(0.4, baseColor);
        gradient.addColorStop(0.6, tipColor);

        ctx.fillStyle = gradient;

        ctx.fill();
        ctx.restore();
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

        let ctx = this.wrapper.ctx;
        let offsetX = this.wrapper.offsetX;
        let offsetY = this.wrapper.offsetY;

        const wedge = this.resolveWedgeContext(line);
        let l = wedge.leftVector.clone();
        let r = wedge.rightVector.clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        ctx.save();

        let normals = Vector2.normals(l, r);

        normals[0].normalize();
        normals[1].normalize();
        let start;
        let end;
        let shortLine = line.clone();

        const bondDash = this.wrapper.userOpts.rendering.bonds;
        const inset = Number.isFinite(bondDash.dashedInsetPx) ? Math.max(bondDash.dashedInsetPx, 0) : 1.0;

        if (wedge.baseIsRight) {
            start = r;
            end = l;

            shortLine.shortenRight(inset);
        } else {
            start = l;
            end = r;

            shortLine.shortenLeft(inset);
        }

        let dir = Vector2.subtract(end, start).normalize();
        const { baseColor, tipColor } = wedge;
        ctx.strokeStyle = baseColor;
        ctx.lineCap = 'round';
        const bondThickness = this.wrapper.userOpts.rendering.bonds.bondThickness;
        ctx.lineWidth = bondThickness;
        ctx.beginPath();
        let length = line.getLength();
        const spacingMultiplierRaw = bondDash.dashedWedgeSpacingMultiplier;
        const spacingMultiplier = Number.isFinite(spacingMultiplierRaw) && spacingMultiplierRaw > 0 ? spacingMultiplierRaw : 3.0;
        const baseUnit = bondThickness * spacingMultiplier;
        const divisor = baseUnit !== 0 ? length / baseUnit : 0;
        const step = divisor !== 0 ? bondDash.dashedStepFactor / divisor : bondDash.dashedStepFactor;

        let changed = false;
        const rawThreshold = typeof bondDash.dashedColorSwitchThreshold === 'number' ? bondDash.dashedColorSwitchThreshold : 0.5;
        const switchThreshold = Math.min(Math.max(rawThreshold, 0), 1);
        for (var t = 0.0; t < 1.0; t += step) {
            let to = Vector2.multiplyScalar(dir, t * length);
            let startDash = Vector2.add(start, to);
            const widthFactor = Number.isFinite(bondDash.dashedWidthFactorCanvas) ? bondDash.dashedWidthFactorCanvas : 1.5;
            let width = widthFactor * t;
            let dashOffset = Vector2.multiplyScalar(normals[0], width);

            if (!changed && t >= switchThreshold) {
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = tipColor;
                changed = true;
            }

            startDash.subtract(dashOffset);
            ctx.moveTo(startDash.x, startDash.y);
            startDash.add(Vector2.multiplyScalar(dashOffset, 2.0));
            ctx.lineTo(startDash.x, startDash.y);
        }

        ctx.stroke();
        ctx.restore();
    }
}

export = CanvasWedgeDrawer;
