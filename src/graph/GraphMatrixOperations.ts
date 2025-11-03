import Graph = require('./Graph');

/**
 * A class providing matrix and list operations for molecular graphs.
 * Handles adjacency matrices, distance matrices, and adjacency lists.
 */
class GraphMatrixOperations {
    constructor(readonly graph: Graph) {
    }

    getAdjacencyMatrix(): number[][] {
        let length = this.graph.vertices.length;
        let adjacencyMatrix = Array(length);

        for (var i = 0; i < length; i++) {
          adjacencyMatrix[i] = new Array(length);
          adjacencyMatrix[i].fill(0);
        }

        for (var i = 0; i < this.graph.edges.length; i++) {
          let edge = this.graph.edges[i];

          adjacencyMatrix[edge.sourceId][edge.targetId] = 1;
          adjacencyMatrix[edge.targetId][edge.sourceId] = 1;
        }

        return adjacencyMatrix;
    }

    getComponentsAdjacencyMatrix(): number[][] {
        let length = this.graph.vertices.length;
        let adjacencyMatrix = Array(length);
        let bridges = this.graph.getBridges();

        for (var i = 0; i < length; i++) {
          adjacencyMatrix[i] = new Array(length);
          adjacencyMatrix[i].fill(0);
        }

        for (var i = 0; i < this.graph.edges.length; i++) {
          let edge = this.graph.edges[i];

          adjacencyMatrix[edge.sourceId][edge.targetId] = 1;
          adjacencyMatrix[edge.targetId][edge.sourceId] = 1;
        }

        for (var i = 0; i < bridges.length; i++) {
          adjacencyMatrix[bridges[i][0]][bridges[i][1]] = 0;
          adjacencyMatrix[bridges[i][1]][bridges[i][0]] = 0;
        }

        return adjacencyMatrix;
    }

    getSubgraphAdjacencyMatrix(vertexIds: number[]): number[][] {
        let length = vertexIds.length;
        let adjacencyMatrix = Array(length);

        for (var i = 0; i < length; i++) {
          adjacencyMatrix[i] = new Array(length);
          adjacencyMatrix[i].fill(0);

          for (var j = 0; j < length; j++) {
            if (i === j) {
              continue;
            }

            if (this.graph.hasEdge(vertexIds[i], vertexIds[j])) {
              adjacencyMatrix[i][j] = 1;
            }
          }
        }

        return adjacencyMatrix;
    }

    getDistanceMatrix(): number[][] {
        let length = this.graph.vertices.length;
        let adja = this.getAdjacencyMatrix();
        let dist = Array(length);

        for (var i = 0; i < length; i++) {
          dist[i] = Array(length);
          dist[i].fill(Infinity);
        }

        for (var i = 0; i < length; i++) {
          for (var j = 0; j < length; j++) {
            if (adja[i][j] === 1) {
              dist[i][j] = 1;
            }
          }
        }

        for (var k = 0; k < length; k++) {
          for (var i = 0; i < length; i++) {
            for (var j = 0; j < length; j++) {
              if (dist[i][j] > dist[i][k] + dist[k][j]) {
                dist[i][j] = dist[i][k] + dist[k][j]
              }
            }
          }
        }

        return dist;
    }

    getSubgraphDistanceMatrix(vertexIds: number[]): number[][] {
        let length = vertexIds.length;
        let adja = this.getSubgraphAdjacencyMatrix(vertexIds);
        let dist = Array(length);

        for (var i = 0; i < length; i++) {
          dist[i] = Array(length);
          dist[i].fill(Infinity);
        }

        for (var i = 0; i < length; i++) {
          for (var j = 0; j < length; j++) {
            if (adja[i][j] === 1) {
              dist[i][j] = 1;
            }
          }
        }

        for (var k = 0; k < length; k++) {
          for (var i = 0; i < length; i++) {
            for (var j = 0; j < length; j++) {
              if (dist[i][j] > dist[i][k] + dist[k][j]) {
                dist[i][j] = dist[i][k] + dist[k][j]
              }
            }
          }
        }

        return dist;
    }

    getAdjacencyList(): number[][] {
        let length = this.graph.vertices.length;
        let adjacencyList = Array(length);

        for (var i = 0; i < length; i++) {
          adjacencyList[i] = [];

          for (var j = 0; j < length; j++) {
            if (i === j) {
              continue;
            }

            if (this.graph.hasEdge(this.graph.vertices[i].id, this.graph.vertices[j].id)) {
              adjacencyList[i].push(j);
            }
          }
        }

        return adjacencyList;
    }

    getSubgraphAdjacencyList(vertexIds: number[]): number[][] {
        let length = vertexIds.length;
        let adjacencyList = Array(length);

        for (var i = 0; i < length; i++) {
          adjacencyList[i] = Array();

          for (var j = 0; j < length; j++) {
            if (i === j) {
              continue;
            }

            if (this.graph.hasEdge(vertexIds[i], vertexIds[j])) {
              adjacencyList[i].push(j);
            }
          }
        }

        return adjacencyList;
    }
}

export = GraphMatrixOperations;
