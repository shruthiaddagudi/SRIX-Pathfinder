/**
 * Motion Filter: Detect if user is actively moving or standing still
 *
 * Prevents PDR drift when user is stationary. Phone vibration and small
 * movements still trigger tiny accelerations, so we look at variance
 * over a window to detect true motion vs. noise.
 *
 * Use in useLiveTracking: skip computePDRStep when isUserMoving() returns false.
 */

export interface MotionState {
  isMoving: boolean;
  stillFrames: number;
  movingFrames: number;
  recentMagnitudes: number[];
  bufferIndex: number;
}

const MOTION_BUFFER_SIZE = 10;
const STILL_THRESHOLD = 0.08;
const FRAMES_TO_CONFIRM_MOVING = 3;
const FRAMES_TO_CONFIRM_STILL = 8;

/**
 * Create a new motion filter state.
 */
export function createMotionState(): MotionState {
  return {
    isMoving: false,
    stillFrames: 0,
    movingFrames: 0,
    recentMagnitudes: new Array(MOTION_BUFFER_SIZE).fill(0),
    bufferIndex: 0,
  };
}

/**
 * Calculate standard deviation of an array of numbers.
 */
function calculateStdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Update motion filter with latest acceleration magnitude.
 *
 * Tracks whether user is moving based on variance of recent accelerations.
 * Uses hysteresis: needs multiple frames to confirm state change.
 *
 * @param state Current motion filter state
 * @param magnitude Acceleration magnitude in m/s² (typically |accel - 9.81|)
 * @returns New motion filter state (immutable)
 */
export function updateMotionState(
  state: MotionState,
  magnitude: number
): MotionState {
  // Add magnitude to ring buffer
  const newMagnitudes = [...state.recentMagnitudes];
  newMagnitudes[state.bufferIndex] = magnitude;
  const newBufferIndex = (state.bufferIndex + 1) % MOTION_BUFFER_SIZE;

  // Calculate variance of recent accelerations
  const variance = calculateStdDev(newMagnitudes);

  // Hysteresis: decide if moving or still based on variance
  let newMovingFrames = state.movingFrames;
  let newStillFrames = state.stillFrames;
  let newIsMoving = state.isMoving;

  if (variance < STILL_THRESHOLD) {
    // Likely still
    newStillFrames = state.stillFrames + 1;
    newMovingFrames = 0;
    if (newStillFrames >= FRAMES_TO_CONFIRM_STILL) {
      newIsMoving = false;
    }
  } else {
    // Likely moving
    newMovingFrames = state.movingFrames + 1;
    newStillFrames = 0;
    if (newMovingFrames >= FRAMES_TO_CONFIRM_MOVING) {
      newIsMoving = true;
    }
  }

  return {
    isMoving: newIsMoving,
    stillFrames: newStillFrames,
    movingFrames: newMovingFrames,
    recentMagnitudes: newMagnitudes,
    bufferIndex: newBufferIndex,
  };
}

/**
 * Check if user is currently moving.
 */
export function isUserMoving(state: MotionState): boolean {
  return state.isMoving;
}

/**
 * Get diagnostic info about motion state (for debug display).
 */
export function getMotionDiagnostics(state: MotionState): {
  isMoving: boolean;
  stillFrames: number;
  movingFrames: number;
  variance: number;
} {
  const variance = calculateStdDev(state.recentMagnitudes);
  return {
    isMoving: state.isMoving,
    stillFrames: state.stillFrames,
    movingFrames: state.movingFrames,
    variance,
  };
}
