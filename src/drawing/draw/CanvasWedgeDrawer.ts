import Vector2 = require('../../graph/Vector2');
import CanvasDrawer = require('../CanvasDrawer');
import Line = require('../../graph/Line');

class CanvasWedgeDrawer {
  constructor(private wrapper: CanvasDrawer) {}



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

        let l = line.getLeftVector().clone();
        let r = line.getRightVector().clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        ctx.save();

        let normals = Vector2.normals(l, r);

        normals[0].normalize();
        normals[1].normalize();

        let isRightChiralCenter = line.getRightChiral();

        let start = l;
        let end = r;

        if (isRightChiralCenter) {
            start = r;
            end = l;
        }

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

        let gradient = this.wrapper.ctx.createRadialGradient(r.x, r.y, this.wrapper.userOpts.rendering.bonds.bondLength, r.x, r.y, 0);
        gradient.addColorStop(0.4, this.wrapper.themeManager.getColor(line.getLeftElement()) ||
            this.wrapper.themeManager.getColor('C'));
        gradient.addColorStop(0.6, this.wrapper.themeManager.getColor(line.getRightElement()) ||
            this.wrapper.themeManager.getColor('C'));

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

        let l = line.getLeftVector().clone();
        let r = line.getRightVector().clone();

        l.x += offsetX;
        l.y += offsetY;

        r.x += offsetX;
        r.y += offsetY;

        ctx.save();

        let normals = Vector2.normals(l, r);

        normals[0].normalize();
        normals[1].normalize();


        let isRightChiralCenter = line.getRightChiral();

        let start;
        let end;
        let sStart;
        let sEnd;

        const stereo = this.wrapper.userOpts.rendering.stereochemistry;
        let shortLine = line.clone();

        if (isRightChiralCenter) {
            start = r;
            end = l;

            shortLine.shortenRight(stereo.dashedInsetPx ?? 1.0);

            sStart = shortLine.getRightVector().clone();
            sEnd = shortLine.getLeftVector().clone();
        } else {
            start = l;
            end = r;

            shortLine.shortenLeft(stereo.dashedInsetPx ?? 1.0);

            sStart = shortLine.getLeftVector().clone();
            sEnd = shortLine.getRightVector().clone();
        }

        sStart.x += offsetX;
        sStart.y += offsetY;
        sEnd.x += offsetX;
        sEnd.y += offsetY;

        let dir = Vector2.subtract(end, start).normalize();
        ctx.strokeStyle = this.wrapper.themeManager.getColor('C');
        ctx.lineCap = 'round';
        const bondThickness = this.wrapper.userOpts.rendering.bonds.bondThickness;
        const spacingMultiplierRaw = this.wrapper.userOpts.rendering.stereochemistry.dashedSpacingMultiplier;
        const spacingMultiplier = Number.isFinite(spacingMultiplierRaw) && spacingMultiplierRaw > 0 ? spacingMultiplierRaw : 3.0;
        ctx.lineWidth = bondThickness;
        ctx.beginPath();
        let length = line.getLength();
        const baseUnit = bondThickness * spacingMultiplier;
        const divisor = baseUnit !== 0 ? length / baseUnit : 0;
        const step = divisor !== 0 ? stereo.dashedStepFactor / divisor : stereo.dashedStepFactor;

        let changed = false;
        for (var t = 0.0; t < 1.0; t += step) {
            let to = Vector2.multiplyScalar(dir, t * length);
            let startDash = Vector2.add(start, to);
            let width = stereo.dashedWidthFactorCanvas * t;
            let dashOffset = Vector2.multiplyScalar(normals[0], width);

            if (!changed && t > stereo.dashedColorSwitchThreshold) {
                ctx.stroke();
                ctx.beginPath();
                ctx.strokeStyle = this.wrapper.themeManager.getColor(line.getRightElement()) || this.wrapper.themeManager.getColor('C');
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
