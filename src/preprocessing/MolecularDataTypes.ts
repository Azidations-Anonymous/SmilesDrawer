/**
 * Atom highlighting configuration: [atomClass, color]
 */
export type AtomHighlight = [number, string];

/**
 * Result of chooseSide calculation for bond placement
 */
export interface SideChoice {
  totalSideCount: number[];
  totalPosition: number;
  sideCount: number[];
  position: number;
  anCount: number;
  bnCount: number;
}

/**
 * Individual vertex overlap score entry
 */
export interface VertexOverlapScoreEntry {
  id: number;
  score: number;
}

/**
 * Overall overlap score result
 */
export interface OverlapScore {
  total: number;
  scores: VertexOverlapScoreEntry[];
  vertexScores: Float32Array;
}

/**
 * Subtree overlap score with center of mass
 */
export interface SubtreeOverlapScore {
  value: number;
  center: Vector2;
}

/**
 * Serialized position data for rendering
 */
export interface PositionData {
  version: number;
  vertices: any[];  // Serialized vertex data
  edges: any[];     // Serialized edge data
  rings: any[];     // Serialized ring data
  metadata: {
    vertexCount: number;
    edgeCount: number;
    ringCount: number;
    atomIdxToVertexId?: number[];
    isomeric: boolean;
  };
}

import Vector2 = require('../graph/Vector2');
