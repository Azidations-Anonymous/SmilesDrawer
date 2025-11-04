import Graph = require('../graph/Graph');
import Vector2 = require('../graph/Vector2');
import Ring = require('../graph/Ring');
import MathHelper = require('../utils/MathHelper');
import ArrayHelper = require('../utils/ArrayHelper');

/**
 * Implements the Kamada-Kawai force-directed graph layout algorithm.
 * Used for positioning bridged ring systems.
 *
 * Reference: https://pdfs.semanticscholar.org/b8d3/bca50ccc573c5cb99f7d201e8acce6618f04.pdf
 */
class KamadaKawaiLayout {
    constructor(private readonly graph: Graph) {
    }

    layout(vertexIds: number[], center: Vector2, startVertexId: number, ring: Ring, bondLength: number, threshold: number, innerThreshold: number, maxIteration: number, maxInnerIteration: number, maxEnergy: number): void {
        let edgeStrength = bondLength;

        let matDist = this.graph.getSubgraphDistanceMatrix(vertexIds);
        let length = vertexIds.length;

        // Initialize the positions. Place all vertices on a ring around the center
        let radius = MathHelper.polyCircumradius(500, length);
        let angle = MathHelper.centralAngle(length);
        let a = 0.0;
        let arrPositionX = new Float32Array(length);
        let arrPositionY = new Float32Array(length);
        let arrPositioned = Array(length);

        ArrayHelper.forEachReverse([vertexIds], (vertexId, idx) => {
          const vertex = this.graph.vertices[vertexId];
          if (!vertex.positioned) {
            arrPositionX[idx] = center.x + Math.cos(a) * radius;
            arrPositionY[idx] = center.y + Math.sin(a) * radius;
          } else {
            arrPositionX[idx] = vertex.position.x;
            arrPositionY[idx] = vertex.position.y;
          }
          arrPositioned[idx] = vertex.positioned;
          a += angle;
        });

        // Create the matrix containing the lengths
        let matLength = matDist.map((row) => row.map((value) => bondLength * value));

        // Create the matrix containing the spring strenghts
        let matStrength = matDist.map((row) => row.map((value) => edgeStrength * Math.pow(value, -2.0)));

        // Create the matrix containing the energies
        let matEnergy = Array.from({ length }, () => Array(length));
        let arrEnergySumX = new Float32Array(length);
        let arrEnergySumY = new Float32Array(length);

        // Helper: compute squared magnitude of a 2D vector
        const squaredMagnitude = (x: number, y: number): number => x * x + y * y;

        // Helper: compute energy contribution between two vertices
        const computeEnergyPair = (
            ux: number, uy: number, vx: number, vy: number,
            strength: number, desiredLength: number
        ): [number, number] => {
            const dx = ux - vx;
            const dy = uy - vy;
            const denom = 1.0 / Math.sqrt(squaredMagnitude(dx, dy));
            return [
                strength * (dx - desiredLength * dx * denom),
                strength * (dy - desiredLength * dy * denom)
            ];
        };

        let ux, uy, dEx, dEy, vx, vy;

        ArrayHelper.forEachIndexReverse(length, (rowIdx) => {
          ux = arrPositionX[rowIdx];
          uy = arrPositionY[rowIdx];
          dEx = 0.0;
          dEy = 0.0;
          ArrayHelper.forEachIndexReverse(length, (colIdx) => {
            if (rowIdx === colIdx) {
              return;
            }
            vx = arrPositionX[colIdx];
            vy = arrPositionY[colIdx];
            const energyPair = computeEnergyPair(
              ux, uy, vx, vy,
              matStrength[rowIdx][colIdx],
              matLength[rowIdx][colIdx]
            );
            matEnergy[rowIdx][colIdx] = energyPair;
            matEnergy[colIdx][rowIdx] = energyPair;
            dEx += energyPair[0];
            dEy += energyPair[1];
          });
          arrEnergySumX[rowIdx] = dEx;
          arrEnergySumY[rowIdx] = dEy;
        });

        // Compute energy at a vertex (squared gradient magnitude and gradient components)
        const energy = (index: number): [number, number, number] => {
          const sqMag = squaredMagnitude(arrEnergySumX[index], arrEnergySumY[index]);
          return [sqMag, arrEnergySumX[index], arrEnergySumY[index]];
        };

        // Find the vertex with highest energy among unpositioned vertices
        const highestEnergy = (): [number, number, number, number] => {
          let maxEnergy = 0.0;
          let maxEnergyId = 0;
          let maxDEX = 0.0;
          let maxDEY = 0.0;

          ArrayHelper.forEachIndexReverse(length, (idx) => {
            const [delta, dEX, dEY] = energy(idx);

            if (delta > maxEnergy && arrPositioned[idx] === false) {
              maxEnergy = delta;
              maxEnergyId = idx;
              maxDEX = dEX;
              maxDEY = dEY;
            }
          });

          return [maxEnergyId, maxEnergy, maxDEX, maxDEY];
        };

        // Update vertex position and recompute energies
        const update = (index: number, dEX: number, dEY: number): void => {
          let dxx = 0.0;
          let dyy = 0.0;
          let dxy = 0.0;
          const ux = arrPositionX[index];
          const uy = arrPositionY[index];
          const arrL = matLength[index];
          const arrK = matStrength[index];

          ArrayHelper.forEachIndexReverse(length, (idx) => {
            if (idx === index) {
              return;
            }

            const vx = arrPositionX[idx];
            const vy = arrPositionY[idx];
            const l = arrL[idx];
            const k = arrK[idx];
            const dx = ux - vx;
            const dy = uy - vy;
            const denom = 1.0 / Math.pow(squaredMagnitude(dx, dy), 1.5);

            dxx += k * (1 - l * dy * dy * denom);
            dyy += k * (1 - l * dx * dx * denom);
            dxy += k * (l * dx * dy * denom);
          });

          // Prevent division by zero
          dxx = Math.max(dxx, 0.1);
          dyy = Math.max(dyy, 0.1);
          dxy = Math.max(dxy, 0.1);

          let dy = (dEX / dxx + dEY / dxy);
          dy /= (dxy / dxx - dyy / dxy);
          const dx = -(dxy * dy + dEX) / dxx;

          arrPositionX[index] += dx;
          arrPositionY[index] += dy;

          // Update the energies
          const arrE = matEnergy[index];
          let newDEX = 0.0;
          let newDEY = 0.0;

          const newUx = arrPositionX[index];
          const newUy = arrPositionY[index];

          ArrayHelper.forEachIndexReverse(length, (idx) => {
            if (index === idx) {
              return;
            }
            const vx = arrPositionX[idx];
            const vy = arrPositionY[idx];
            const prevEx = arrE[idx][0];
            const prevEy = arrE[idx][1];

            const [newEx, newEy] = computeEnergyPair(
              newUx, newUy, vx, vy,
              arrK[idx],
              arrL[idx]
            );

            arrE[idx] = [newEx, newEy];
            newDEX += newEx;
            newDEY += newEy;
            arrEnergySumX[idx] += newEx - prevEx;
            arrEnergySumY[idx] += newEy - prevEy;
          });
          arrEnergySumX[index] = newDEX;
          arrEnergySumY[index] = newDEY;
        };

        // Setting up variables for the while loops
        let maxEnergyId = 0;
        let dEX = 0.0;
        let dEY = 0.0;
        let delta = 0.0;
        let iteration = 0;
        let innerIteration = 0;

        while (maxEnergy > threshold && maxIteration > iteration) {
          iteration++;
          [maxEnergyId, maxEnergy, dEX, dEY] = highestEnergy();
          delta = maxEnergy;
          innerIteration = 0;
          while (delta > innerThreshold && maxInnerIteration > innerIteration) {
            innerIteration++;
            update(maxEnergyId, dEX, dEY);
            [delta, dEX, dEY] = energy(maxEnergyId);
          }
        }

        ArrayHelper.forEachReverse([vertexIds], (vertexId, idx) => {
          let vertex = this.graph.vertices[vertexId];
          vertex.position.x = arrPositionX[idx];
          vertex.position.y = arrPositionY[idx];
          vertex.positioned = true;
          vertex.forcePositioned = true;
        });
    }
}

export = KamadaKawaiLayout;
