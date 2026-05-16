/**
 * QR Recalibration: Use QR codes to correct position drift
 *
 * When user scans QR code at known location, recalibrates PDR position.
 * This provides ground truth to correct accumulated drift errors.
 *
 * Use in Phase 8: integrate QR scanning into live tracking workflow.
 */

import type { Point } from "@/types";
import type { QRPosition, QRScanResult } from "@/lib/tracking/qrScanner";

export interface RecalibrationState {
  lastRecalibrationTime: number;
  recalibrationCount: number;
  averageErrorCorrection: number;
  isRecalibrating: boolean;
}

/**
 * Create a new recalibration state.
 */
export function createRecalibrationState(): RecalibrationState {
  return {
    lastRecalibrationTime: 0,
    recalibrationCount: 0,
    averageErrorCorrection: 0,
    isRecalibrating: false,
  };
}

/**
 * Perform position recalibration using QR scan result.
 *
 * @param estimatedPosition Current PDR estimated position
 * @param qrResult QR scan result with true position
 * @param state Current recalibration state
 * @param calibrateFn Function to update PDR with true position
 * @returns Updated recalibration state
 */
export function performRecalibration(
  estimatedPosition: Point,
  qrResult: QRScanResult,
  state: RecalibrationState,
  calibrateFn: (truePosition: Point) => void
): RecalibrationState {
  // Calculate position error
  const errorDistance = Math.hypot(
    estimatedPosition.x - qrResult.position.x,
    estimatedPosition.y - qrResult.position.y
  );

  // Only recalibrate if error is significant (> 20 units)
  if (errorDistance < 20) {
    return state;
  }

  // Perform recalibration
  calibrateFn({
    x: qrResult.position.x,
    y: qrResult.position.y
  });

  // Update state
  const newCount = state.recalibrationCount + 1;
  const newAverageError = (
    (state.averageErrorCorrection * state.recalibrationCount) + errorDistance
  ) / newCount;

  return {
    lastRecalibrationTime: qrResult.timestamp,
    recalibrationCount: newCount,
    averageErrorCorrection: newAverageError,
    isRecalibrating: false,
  };
}

/**
 * Check if recalibration is recommended.
 *
 * @param state Recalibration state
 * @param stepsSinceCalibration Steps taken since last recalibration
 * @param confidence Current PDR confidence (0-1)
 * @returns Whether recalibration is recommended
 */
export function shouldRecalibrate(
  state: RecalibrationState,
  stepsSinceCalibration: number,
  confidence: number
): boolean {
  // Recommend recalibration if:
  // - More than 30 steps since last recalibration, OR
  // - Confidence dropped below 30%, OR
  // - It's been more than 5 minutes since last recalibration
  const timeSinceLast = Date.now() - state.lastRecalibrationTime;
  const fiveMinutes = 5 * 60 * 1000;

  return (
    stepsSinceCalibration > 30 ||
    confidence < 0.3 ||
    timeSinceLast > fiveMinutes
  );
}

/**
 * Get recalibration statistics.
 */
export function getRecalibrationStats(state: RecalibrationState): {
  totalRecalibrations: number;
  averageErrorCorrection: number;
  lastRecalibrationAgo: number;
} {
  return {
    totalRecalibrations: state.recalibrationCount,
    averageErrorCorrection: state.averageErrorCorrection,
    lastRecalibrationAgo: Date.now() - state.lastRecalibrationTime,
  };
}