import Graph = require('./Graph');
import Vertex = require('./Vertex');

/**
 * A class providing graph algorithms including bridge detection,
 * graph traversal, and connected component analysis.
 */
class GraphAlgorithms {
  constructor(private readonly graph: Graph) {}

  /**
   * Returns an array containing the edge ids of bridges. A bridge splits the graph into multiple components when removed.
   *
   * @returns {Number[]} An array containing the edge ids of the bridges.
   */
  getBridges(): number[][] {
    let length = this.graph.vertices.length;
    let visited = new Array(length);
    let disc = new Array(length);
    let low = new Array(length);
    let parent = new Array(length);
    let adj = this.graph.getAdjacencyList();
    let outBridges = Array();

    visited.fill(false);
    parent.fill(null);
    this.graph._time = 0;

    for (var i = 0; i < length; i++) {
      if (!visited[i]) {
        this._bridgeDfs(i, visited, disc, low, parent, adj, outBridges);
      }
    }

    return outBridges;
  }

  /**
   * PRIVATE FUNCTION used by getBridges().
   */
  private _bridgeDfs(u: number, visited: boolean[], disc: number[], low: number[], parent: number[], adj: number[][], outBridges: number[][]): void {
    visited[u] = true;
    disc[u] = low[u] = ++this.graph._time;

    for (var i = 0; i < adj[u].length; i++) {
      let v = adj[u][i];

      if (!visited[v]) {
        parent[v] = u;

        this._bridgeDfs(v, visited, disc, low, parent, adj, outBridges);

        low[u] = Math.min(low[u], low[v]);

        // If low > disc, we have a bridge
        if (low[v] > disc[u]) {
          outBridges.push([u, v]);
        }
      } else if (v !== parent[u]) {
        low[u] = Math.min(low[u], disc[v]);
      }
    }
  }

  /**
   * Traverses the graph in breadth-first order.
   *
   * @param {Number} startVertexId The id of the starting vertex.
   * @param {Function} callback The callback function to be called on every vertex.
   */
  traverseBF(startVertexId: number, callback: (vertex: Vertex) => void): void {
    let length = this.graph.vertices.length;
    let visited = new Array(length);

    visited.fill(false);

    var queue = [startVertexId];

    while (queue.length > 0) {
      // JavaScripts shift() is O(n) ... bad JavaScript, bad!
      let u = queue.shift();
      let vertex = this.graph.vertices[u];

      callback(vertex);

      for (var i = 0; i < vertex.neighbours.length; i++) {
        let v = vertex.neighbours[i]
        if (!visited[v]) {
          visited[v] = true;
          queue.push(v);
        }
      }
    }
  }

  /**
   * Get the depth of a subtree in the direction opposite to the vertex specified as the parent vertex.
   *
   * @param {Number} vertexId A vertex id.
   * @param {Number} parentVertexId The id of a neighbouring vertex.
   * @returns {Number} The depth of the sub-tree.
   */
  getTreeDepth(vertexId: number | null, parentVertexId: number | null): number {
    if (vertexId === null || parentVertexId === null) {
      return 0;
    }

    let neighbours = this.graph.vertices[vertexId].getSpanningTreeNeighbours(parentVertexId);
    let max = 0;

    for (var i = 0; i < neighbours.length; i++) {
      let childId = neighbours[i];
      let d = this.getTreeDepth(childId, vertexId);

      if (d > max) {
        max = d;
      }
    }

    return max + 1;
  }

  /**
   * Traverse a sub-tree in the graph.
   *
   * @param {Number} vertexId A vertex id.
   * @param {Number} parentVertexId A neighbouring vertex.
   * @param {Function} callback The callback function that is called with each visited as an argument.
   * @param {Number} [maxDepth=999999] The maximum depth of the recursion.
   * @param {Boolean} [ignoreFirst=false] Whether or not to ignore the starting vertex supplied as vertexId in the callback.
   * @param {Number} [depth=1] The current depth in the tree.
   * @param {Uint8Array} [visited=null] An array holding a flag on whether or not a node has been visited.
   */
  traverseTree(vertexId: number, parentVertexId: number, callback: (vertex: Vertex) => void, maxDepth: number = 999999, ignoreFirst: boolean = false, depth: number = 1, visited: Uint8Array | null = null): void {
    if (visited === null) {
      visited = new Uint8Array(this.graph.vertices.length);
    }

    if (depth > maxDepth + 1 || visited[vertexId] === 1) {
      return;
    }

    visited[vertexId] = 1;

    let vertex = this.graph.vertices[vertexId];
    let neighbours = vertex.getNeighbours(parentVertexId);

    if (!ignoreFirst || depth > 1) {
      callback(vertex);
    }

    for (var i = 0; i < neighbours.length; i++) {
      this.traverseTree(neighbours[i], vertexId, callback, maxDepth, ignoreFirst, depth + 1, visited);
    }
  }

  /**
   * Returns the connected components of the graph.
   *
   * @param {Array[]} adjacencyMatrix An adjacency matrix.
   * @returns {Set[]} Connected components as sets.
   */
  static getConnectedComponents(adjacencyMatrix) {
    let length = adjacencyMatrix.length;
    let visited = new Array(length);
    let components = new Array();
    let count = 0;

    visited.fill(false);

    for (var u = 0; u < length; u++) {
      if (!visited[u]) {
        let component = Array();
        visited[u] = true;
        component.push(u);
        count++;
        GraphAlgorithms._ccGetDfs(u, visited, adjacencyMatrix, component);
        if (component.length > 1) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Returns the number of connected components for the graph.
   *
   * @param {Array[]} adjacencyMatrix An adjacency matrix.
   * @returns {Number} The number of connected components of the supplied graph.
   */
  static getConnectedComponentCount(adjacencyMatrix) {
    let length = adjacencyMatrix.length;
    let visited = new Array(length);
    let count = 0;

    visited.fill(false);

    for (var u = 0; u < length; u++) {
      if (!visited[u]) {
        visited[u] = true;
        count++;
        GraphAlgorithms._ccCountDfs(u, visited, adjacencyMatrix);
      }
    }

    return count;
  }

  /**
   * PRIVATE FUNCTION used by getConnectedComponentCount().
   */
  private static _ccCountDfs(u, visited, adjacencyMatrix) {
    for (var v = 0; v < adjacencyMatrix[u].length; v++) {
      let c = adjacencyMatrix[u][v];

      if (!c || visited[v] || u === v) {
        continue;
      }

      visited[v] = true;
      GraphAlgorithms._ccCountDfs(v, visited, adjacencyMatrix);
    }
  }

  /**
   * PRIVATE FUNCTION used by getConnectedComponents().
   */
  private static _ccGetDfs(u, visited, adjacencyMatrix, component) {
    for (var v = 0; v < adjacencyMatrix[u].length; v++) {
      let c = adjacencyMatrix[u][v];

      if (!c || visited[v] || u === v) {
        continue;
      }

      visited[v] = true;
      component.push(v);
      GraphAlgorithms._ccGetDfs(v, visited, adjacencyMatrix, component);
    }
  }
}

export = GraphAlgorithms;
