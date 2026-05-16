/**
 * Accuracy Model: Confidence-based uncertainty radius
 *
 * Tracks how certain we are about the user's position using a degrading accuracy
 * radius. Each PDR step increases uncertainty; QR recalibration resets to best.
 *
 * Use in useLiveTracking: degrade on each step, recalibrate on QR scan.
 * Use in UserPositionMarker: render accuracy ring with color based on radius.
 */

export interface AccuracyState {
  currentRadius: number;
  minRadius: number;
  maxRadius: number;
  degradePerStep: number;
}

/**
 * Create a new accuracy model state.
 *
 * @param minRadius Best possible accuracy (SVG units), default 15
 * @param maxRadius Worst acceptable accuracy (SVG units), default 120
 * @param degradePerStep How much radius grows per step, default 2.5
 */
export function createAccuracyModel(
  minRadius: number = 15,
  maxRadius: number = 120,
  degradePerStep: number = 2.5
): AccuracyState {
  return {
    currentRadius: minRadius * 2, // start at 30 (slightly uncertain)
    minRadius,
    maxRadius,
    degradePerStep,
  };
}

/**
 * Degrade accuracy after a PDR step.
 * Called after each step is detected and processed.
 */
export function degradeAccuracy(state: AccuracyState): AccuracyState {
  return {
    ...state,
    currentRadius: Math.min(state.currentRadius + state.degradePerStep, state.maxRadius),
  };
}

/**
 * Recalibrate accuracy to best state.
 * Called after QR code scan or other ground truth confirmation.
 */
export function recalibrateAccuracy(state: AccuracyState): AccuracyState {
  return {
    ...state,
    currentRadius: state.minRadius,
  };
}

/**
 * Get confidence score 0.0-1.0 based on current accuracy.
 *
 * @param state Accuracy model state
 * @returns Confidence: 1.0 at minRadius, 0.0 at maxRadius
 */
export function getConfidence(state: AccuracyState): number {
  const normalized = (state.currentRadius - state.minRadius) / (state.maxRadius - state.minRadius);
  return Math.max(0, 1 - normalized);
}

/**
 * Get color for accuracy visualization.
 *
 * - < 30 SVG units: green (good)
 * - < 60 SVG units: amber (ok)
 * - >= 60 SVG units: red (drifted, needs recalibration)
 */
export function getAccuracyColor(state: AccuracyState): string {
  if (state.currentRadius < 30) {
    return "#22c55e"; // green
  } else if (state.currentRadius < 60) {
    return "#f59e0b"; // amber
  } else {
    return "#ef4444"; // red
  }
}

/**
 * Get diagnostic info about accuracy state (for debug display).
 */
export function getAccuracyDiagnostics(state: AccuracyState): {
  radius: number;
  confidence: number;
  color: string;
  isOptimal: boolean;
} {
  return {
    radius: state.currentRadius,
    confidence: getConfidence(state),
    color: getAccuracyColor(state),
    isOptimal: state.currentRadius === state.minRadius,
  };
}
