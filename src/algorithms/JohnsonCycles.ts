/**
 * Johnson cycle enumeration adapted from NetworkX / PIKAChU.
 * Works on undirected graphs represented as adjacency lists.
 */

type AdjacencyList = number[][];
type AdjacencyMap = Map<number, Set<number>>;

interface Options {
  maxCycleLength?: number;
}

function cloneGraphMap(original: AdjacencyMap): AdjacencyMap {
  const clone = new Map<number, Set<number>>();
  for (const [node, neighbours] of original.entries()) {
    clone.set(node, new Set(neighbours));
  }
  return clone;
}

function buildGraphMap(adjacencyList: AdjacencyList): AdjacencyMap {
  const map = new Map<number, Set<number>>();
  for (let i = 0; i < adjacencyList.length; i++) {
    map.set(i, new Set(adjacencyList[i]));
  }
  return map;
}

function unblock(node: number, blocked: Set<number>, B: Map<number, Set<number>>): void {
  const stack: number[] = [node];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (blocked.has(current)) {
      blocked.delete(current);
      const bSet = B.get(current);
      if (bSet && bSet.size > 0) {
        for (const neighbour of bSet) {
          stack.push(neighbour);
        }
        bSet.clear();
      }
    }
  }
}

function removeNode(graph: AdjacencyMap, target: number): void {
  graph.delete(target);
  for (const neighbours of graph.values()) {
    neighbours.delete(target);
  }
}

function subgraph(graph: AdjacencyMap, vertices: Set<number>): AdjacencyMap {
  const result = new Map<number, Set<number>>();
  for (const vertex of vertices) {
    const neighbours = graph.get(vertex) ?? new Set<number>();
    const filtered = new Set<number>();
    for (const neighbour of neighbours) {
      if (vertices.has(neighbour)) {
        filtered.add(neighbour);
      }
    }
    result.set(vertex, filtered);
  }
  return result;
}

function stronglyConnectedComponents(graph: AdjacencyMap): Array<Set<number>> {
  const index = new Map<number, number>();
  const lowlink = new Map<number, number>();
  const stack: number[] = [];
  const onStack = new Set<number>();
  const result: Array<Set<number>> = [];
  let indexCounter = 0;

  function strongConnect(v: number): void {
    index.set(v, indexCounter);
    lowlink.set(v, indexCounter);
    indexCounter++;
    stack.push(v);
    onStack.add(v);

    const successors = graph.get(v) ?? new Set<number>();
    for (const w of successors) {
      if (!index.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const component = new Set<number>();
      let w: number;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        component.add(w);
      } while (w !== v);
      result.push(component);
    }
  }

  for (const node of graph.keys()) {
    if (!index.has(node)) {
      strongConnect(node);
    }
  }

  return result;
}

function* simpleCycles(graphInput: AdjacencyMap): Generator<number[]> {
  const G = cloneGraphMap(graphInput);
  const sccs = stronglyConnectedComponents(G);

  const stackSCCs: Array<Set<number>> = [...sccs];

  while (stackSCCs.length > 0) {
    const scc = stackSCCs.pop();
    if (!scc || scc.size === 0) {
      continue;
    }

    const startIterator = scc.values();
    const startResult = startIterator.next();
    if (startResult.done) {
      continue;
    }
    const startnode = startResult.value;
    scc.delete(startnode);

    const path: number[] = [startnode];
    const blocked = new Set<number>([startnode]);
    const closed = new Set<number>();
    const B = new Map<number, Set<number>>();
    const stack: Array<{ node: number; neighbours: number[] }> = [{
      node: startnode,
      neighbours: Array.from(G.get(startnode) ?? [])
    }];

    while (stack.length > 0) {
      const frame = stack[stack.length - 1];
      const thisnode = frame.node;
      const neighbours = frame.neighbours;

      if (neighbours.length > 0) {
        const nextnode = neighbours.pop()!;
        if (nextnode === startnode) {
          yield [...path];
          for (const node of path) {
            closed.add(node);
          }
        } else if (!blocked.has(nextnode)) {
          path.push(nextnode);
          stack.push({
            node: nextnode,
            neighbours: Array.from(G.get(nextnode) ?? [])
          });
          closed.delete(nextnode);
          blocked.add(nextnode);
          continue;
        }
      }

      if (neighbours.length === 0) {
        if (closed.has(thisnode)) {
          unblock(thisnode, blocked, B);
        } else {
          const nbrs = G.get(thisnode) ?? new Set<number>();
          for (const nbr of nbrs) {
            if (!B.has(nbr)) {
              B.set(nbr, new Set<number>());
            }
            B.get(nbr)!.add(thisnode);
          }
        }
        stack.pop();
        path.pop();
      }
    }

    removeNode(G, startnode);
    const sub = subgraph(G, scc);
    const newSCCs = stronglyConnectedComponents(sub);
    for (const component of newSCCs) {
      stackSCCs.push(component);
    }
  }
}

function rotateToSmallest(cycle: number[]): number[] {
  const minValue = Math.min(...cycle);
  const index = cycle.indexOf(minValue);
  return cycle.slice(index).concat(cycle.slice(0, index));
}

function compareLex(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
}

function canonicalizeCycle(cycle: number[]): number[] {
  const forward = rotateToSmallest(cycle);
  const backward = rotateToSmallest([...cycle].reverse());
  return compareLex(forward, backward) <= 0 ? forward : backward;
}

function findAllCycles(adjacencyList: AdjacencyList, options: Options = {}): number[][] {
  const { maxCycleLength } = options;
  const graphMap = buildGraphMap(adjacencyList);
  const cycles: number[][] = [];
  const seen = new Set<string>();

  for (const cycle of simpleCycles(graphMap)) {
    if (cycle.length <= 2) {
      continue;
    }
    if (typeof maxCycleLength === 'number' && maxCycleLength > 0 && cycle.length > maxCycleLength) {
      continue;
    }

    const canonical = canonicalizeCycle(cycle);
    const key = canonical.join(',');

    if (!seen.has(key)) {
      seen.add(key);
      cycles.push(canonical);
    }
  }

  return cycles;
}

export {
  findAllCycles,
};
