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

  private getWedgeHalfWidth(): number {
    const dashConfig = this.wrapper.userOpts.rendering.bonds;
    const factor = Number.isFinite(dashConfig.dashedWidthFactorCanvas) ? dashConfig.dashedWidthFactorCanvas : 1.5;
    return Math.max(factor, 0);
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



    drawWedge(line: Line, width: number = 1.0): void {
        this.renderWedge(line, { solid: true });
    }



    /**
     * Draw a dashed wedge on the canvas.
     *
     * @param {Line} line A line.
     */
    drawDashedWedge(line: Line): void {
        this.renderWedge(line, {
            solid: false,
        });
    }

    private renderWedge(line: Line, options: { solid: boolean }): void {
        if (isNaN(line.from.x) || isNaN(line.from.y) || isNaN(line.to.x) || isNaN(line.to.y)) {
            return;
        }

        const ctx = this.wrapper.ctx;
        const offsetX = this.wrapper.offsetX;
        const offsetY = this.wrapper.offsetY;
        const bondDash = this.wrapper.userOpts.rendering.bonds;
        const inset = Number.isFinite(bondDash.dashedInsetPx) ? Math.max(bondDash.dashedInsetPx, 0) : (options.solid ? 0 : 1.0);
        const geometry = this.computeWedgeGeometry(line, inset);
        const maxHalfWidth = this.getWedgeHalfWidth();
        const baseHalfWidth = options.solid ? 0 : maxHalfWidth;
        const tipHalfWidth = options.solid ? maxHalfWidth : 0;

        const basePoint = options.solid
            ? geometry.baseIsRight ? line.getRightVector().clone() : line.getLeftVector().clone()
            : geometry.basePoint.clone();
        const tipPoint = geometry.tipPoint.clone();

        const bondThickness = this.wrapper.userOpts.rendering.bonds.bondThickness || 1;
        const length = geometry.length;

        if (options.solid) {
            const baseA = Vector2.add(basePoint.clone(), Vector2.multiplyScalar(geometry.normals[0].clone(), baseHalfWidth));
            const baseB = Vector2.add(basePoint.clone(), Vector2.multiplyScalar(geometry.normals[1].clone(), baseHalfWidth));
            const tipA = Vector2.add(tipPoint.clone(), Vector2.multiplyScalar(geometry.normals[0].clone(), tipHalfWidth));
            const tipB = Vector2.add(tipPoint.clone(), Vector2.multiplyScalar(geometry.normals[1].clone(), tipHalfWidth));

            [baseA, tipA, tipB, baseB].forEach((point) => {
                point.x += offsetX;
                point.y += offsetY;
            });

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(baseA.x, baseA.y);
            ctx.lineTo(tipA.x, tipA.y);
            ctx.lineTo(tipB.x, tipB.y);
            ctx.lineTo(baseB.x, baseB.y);

            let gradient = this.wrapper.ctx.createRadialGradient(
                tipPoint.x + offsetX,
                tipPoint.y + offsetY,
                this.wrapper.userOpts.rendering.bonds.bondLength,
                tipPoint.x + offsetX,
                tipPoint.y + offsetY,
                0
            );
            gradient.addColorStop(0.4, geometry.baseColor);
            gradient.addColorStop(0.6, geometry.tipColor);

            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.restore();
            return;
        }

        const spacingMultiplierRaw = bondDash.dashedWedgeSpacingMultiplier;
        const spacingMultiplier = Number.isFinite(spacingMultiplierRaw) && spacingMultiplierRaw > 0 ? spacingMultiplierRaw : 3.0;
        const baseUnit = bondThickness * spacingMultiplier;
        const divisor = baseUnit !== 0 ? length / baseUnit : 0;
        const step = divisor !== 0 ? bondDash.dashedStepFactor / divisor : bondDash.dashedStepFactor;

        let start = basePoint.clone();
        let dir = geometry.direction.clone();
        start.x += offsetX;
        start.y += offsetY;
        const end = tipPoint.clone();
        end.x += offsetX;
        end.y += offsetY;

        ctx.save();
        const { baseColor, tipColor } = geometry;
        ctx.strokeStyle = baseColor;
        ctx.lineCap = 'round';
        ctx.lineWidth = bondThickness;
        ctx.beginPath();

        let changed = false;
        const rawThreshold = typeof bondDash.dashedColorSwitchThreshold === 'number' ? bondDash.dashedColorSwitchThreshold : 0.5;
        const switchThreshold = Math.min(Math.max(rawThreshold, 0), 1);
        for (let t = 0.0; t < 1.0; t += step) {
            let to = Vector2.multiplyScalar(dir.clone(), t * length);
            let startDash = Vector2.add(start.clone(), to);
            const width = tipHalfWidth + (baseHalfWidth - tipHalfWidth) * t;
            let dashOffset = Vector2.multiplyScalar(geometry.normals[0].clone(), width);

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
