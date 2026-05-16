/**
 * Drift Corrector: Adaptive step length based on QR recalibration errors
 *
 * When user reaches a QR checkpoint, we compare estimated position to actual.
 * If user walked 30 steps and ended up 2m off, their real step length was longer.
 * Adjust adaptiveStepLength for next segment to reduce future drift.
 *
 * Use in useLiveTracking: call recordCalibration when Phase 8 detects QR scan.
 * Expose calibrate(truePosition) function for Phase 8 to call.
 */

export interface DriftState {
  stepsSinceCalibration: number;
  lastCalibrationError: number;
  adaptiveStepLength: number;
  baseStepLength: number;
}

/**
 * Create a new drift corrector state.
 * @param baseStepLength Original step length in meters, default 0.7
 */
export function createDriftState(baseStepLength: number = 0.7): DriftState {
  return {
    stepsSinceCalibration: 0,
    lastCalibrationError: 0,
    adaptiveStepLength: baseStepLength,
    baseStepLength,
  };
}

/**
 * Increment step counter. Called after each PDR step.
 */
export function recordStep(state: DriftState): DriftState {
  return {
    ...state,
    stepsSinceCalibration: state.stepsSinceCalibration + 1,
  };
}

/**
 * Record a calibration point (QR scan or ground truth).
 *
 * Computes error between estimated position and true position.
 * Adjusts adaptiveStepLength to compensate for systematic drift.
 *
 * @param state Current drift state
 * @param estimatedPosition User's current estimated position (SVG coords)
 * @param truePosition True position from QR code or survey (SVG coords)
 * @param svgUnitsPerMeter Calibration constant (e.g. 50)
 * @returns Updated drift state with adjusted step length
 */
export function recordCalibration(
  state: DriftState,
  estimatedPosition: { x: number; y: number },
  truePosition: { x: number; y: number },
  svgUnitsPerMeter: number
): DriftState {
  // Compute error distance in SVG units
  const errorSVG = Math.hypot(
    estimatedPosition.x - truePosition.x,
    estimatedPosition.y - truePosition.y
  );

  // Convert to meters
  const errorMeters = errorSVG / svgUnitsPerMeter;

  // If we took steps since last calibration, compute per-step error and adjust
  let newAdaptiveStepLength = state.adaptiveStepLength;
  if (state.stepsSinceCalibration > 0) {
    const errorPerStep = errorMeters / state.stepsSinceCalibration;
    const correction = errorPerStep;
    newAdaptiveStepLength = state.baseStepLength + correction;
    // Clamp to reasonable bounds (0.4 to 1.1 meters)
    newAdaptiveStepLength = Math.max(0.4, Math.min(1.1, newAdaptiveStepLength));
  }

  return {
    stepsSinceCalibration: 0,
    lastCalibrationError: errorMeters,
    adaptiveStepLength: newAdaptiveStepLength,
    baseStepLength: state.baseStepLength,
  };
}

/**
 * Get confidence 0.0-1.0 based on steps since calibration.
 *
 * After 50 steps without QR: confidence = 0 (maximum expected drift)
 * Just after calibration: confidence = 1.0
 *
 * @param state Drift state
 * @returns Confidence (0-1)
 */
export function getDriftConfidence(state: DriftState): number {
  return Math.max(0, 1 - state.stepsSinceCalibration / 50);
}

/**
 * Get diagnostic info about drift state (for debug display).
 */
export function getDriftDiagnostics(state: DriftState): {
  stepsSinceCalibration: number;
  lastCalibrationError: number;
  adaptiveStepLength: number;
  baseStepLength: number;
  confidence: number;
  correction: number;
} {
  return {
    stepsSinceCalibration: state.stepsSinceCalibration,
    lastCalibrationError: state.lastCalibrationError,
    adaptiveStepLength: state.adaptiveStepLength,
    baseStepLength: state.baseStepLength,
    confidence: getDriftConfidence(state),
    correction: state.adaptiveStepLength - state.baseStepLength,
  };
}
