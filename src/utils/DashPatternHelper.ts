import Line = require('../graph/Line');

export const BASE_DASH = 3;
export const BASE_GAP = 2;
export const DASH_PATTERN = [BASE_DASH, BASE_GAP] as const;
export const DASH_PATTERN_STRING = `${BASE_DASH},${BASE_GAP}`;
const MIN_CYCLES = 1;

export function computeSnappedLength(length: number, dash: number = BASE_DASH, gap: number = BASE_GAP): { target: number; delta: number } {
  const period = dash + gap;
  if (!isFinite(length) || length <= 0 || !isFinite(period) || period <= 0) {
    return { target: length, delta: 0 };
  }

  const rawCycles = Math.floor((length + gap) / period);
  if (rawCycles < MIN_CYCLES) {
    return { target: length, delta: 0 };
  }

  const target = rawCycles * period - gap;
  return { target, delta: length - target };
}

export function snapLineToDashPattern(line: Line, dash: number = BASE_DASH, gap: number = BASE_GAP): void {
  if (!line) {
    return;
  }

  const { delta } = computeSnappedLength(line.getLength(), dash, gap);
  if (delta <= 0.01) {
    return;
  }

  line.shorten(delta);
}
