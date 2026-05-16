/**
 * Heading Filter: Exponential Moving Average (EMA) smoothing for compass heading
 *
 * Raw compass (DeviceOrientationEvent.alpha) jumps ±15° constantly.
 * This filter smooths it to create stable PDR heading while respecting 0°/360° wraparound.
 *
 * Use in useLiveTracking to replace raw heading before passing to computePDRStep.
 */

export interface HeadingFilterState {
  smoothed: number;
  lastRaw: number;
  alpha: number;
}

/**
 * Create a new heading filter state.
 * @param alpha Smoothing factor (0-1, default 0.15)
 *   - 0.15 = strongly smooth, 2-3 frame lag, stable against noise
 *   - 0.3 = medium smooth, 1-2 frame lag
 *   - 0.5+ = weakly smooth, very responsive but noisy
 */
export function createHeadingFilter(alpha: number = 0.15): HeadingFilterState {
  return {
    smoothed: 0,
    lastRaw: 0,
    alpha: Math.max(0.01, Math.min(0.5, alpha)), // clamp to reasonable range
  };
}

/**
 * Update heading filter with raw compass reading.
 *
 * Handles 0°/360° wraparound: if |raw - smoothed| > 180°, adjust raw by ±360°
 * before blending to avoid jumping the long way around the circle.
 *
 * @param state Current filter state
 * @param rawHeading Raw compass heading 0-360°
 * @returns New filter state (immutable update)
 */
export function updateHeadingFilter(
  state: HeadingFilterState,
  rawHeading: number
): HeadingFilterState {
  // Normalize input to 0-360
  const normalized = ((rawHeading % 360) + 360) % 360;

  // Calculate delta, accounting for wraparound
  let delta = normalized - state.smoothed;
  if (delta > 180) {
    delta -= 360;
  } else if (delta < -180) {
    delta += 360;
  }

  // Adjust raw heading if needed to take the short path
  const adjustedRaw = state.smoothed + delta;

  // Apply EMA: smoothed = alpha * adjusted_raw + (1 - alpha) * smoothed
  const newSmoothed = state.alpha * adjustedRaw + (1 - state.alpha) * state.smoothed;

  // Normalize result back to 0-360
  const finalSmoothed = ((newSmoothed % 360) + 360) % 360;

  return {
    smoothed: finalSmoothed,
    lastRaw: normalized,
    alpha: state.alpha,
  };
}

/**
 * Get current smoothed heading from state.
 */
export function getSmoothedHeading(state: HeadingFilterState): number {
  return state.smoothed;
}

/**
 * Get last raw heading from state (for debug display).
 */
export function getLastRawHeading(state: HeadingFilterState): number {
  return state.lastRaw;
}
