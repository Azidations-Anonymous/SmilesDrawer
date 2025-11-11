import IDrawingSurface = require('../drawing/renderers/IDrawingSurface');
import IMolecularData = require('../preprocessing/IMolecularData');
import Ring = require('../graph/Ring');
import Vector2 = require('../graph/Vector2');

type PolygonRenderer = Pick<IDrawingSurface, 'drawDashedPolygon'> | null;

class AromaticOverlayRenderer {
    static render(molecule: IMolecularData, renderer: PolygonRenderer, insetOverride?: number): void {
        if (!renderer || molecule.bridgedRing) {
            return;
        }

        const userInset = insetOverride ?? molecule.userOpts.rendering.aromatic.overlayInset;
        const insetAmount = isFinite(userInset) && userInset > 0 ? userInset : molecule.userOpts.rendering.aromatic.overlayInset;
        const rings = molecule.getAromaticRings();
        for (const ring of rings) {
            if (!AromaticOverlayRenderer.isImplicitRing(molecule, ring)) {
                continue;
            }

            const polygon = AromaticOverlayRenderer.buildPolygon(molecule, ring, insetAmount);
            if (polygon.length < 3) {
                continue;
            }

            renderer.drawDashedPolygon(polygon);
        }
    }

    private static isImplicitRing(molecule: IMolecularData, ring: Ring): boolean {
        if (!ring || !ring.members || ring.members.length === 0) {
            return false;
        }

        for (const memberId of ring.members) {
            const vertex = molecule.graph.vertices[memberId];
            if (!vertex || !vertex.value?.isAromaticByInput) {
                return false;
            }
        }

        return true;
    }

    private static buildPolygon(molecule: IMolecularData, ring: Ring, inset: number): Vector2[] {
        const polygon: Vector2[] = [];
        const center = ring.center;
        if (!center || !ring.members) {
            return polygon;
        }

        for (const memberId of ring.members) {
            const vertex = molecule.graph.vertices[memberId];
            if (!vertex || !vertex.position) {
                continue;
            }

            const toVertex = vertex.position.clone().subtract(center);
            const distance = toVertex.length();
            if (!isFinite(distance) || distance < 1e-3) {
                continue;
            }

            const clampRatio = molecule.userOpts.rendering.aromatic.overlayClampRatio;
            const insetAmount = Math.min(inset, distance * clampRatio);
            const insetVector = toVertex.clone().normalize().multiplyScalar(insetAmount);
            polygon.push(vertex.position.clone().subtract(insetVector));
        }

        return polygon;
    }
}

export = AromaticOverlayRenderer;
