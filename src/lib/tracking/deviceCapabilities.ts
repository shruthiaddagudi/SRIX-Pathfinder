/**
 * Heuristics for whether live PDR is likely to work on this browser/device.
 */
export function isLikelyMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    ua
  );
  const coarsePointer =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const hasOrientation = typeof DeviceOrientationEvent !== "undefined";
  const hasMotion = typeof DeviceMotionEvent !== "undefined";

  return (mobileUa || coarsePointer) && hasMotion && hasOrientation;
}

export function hasSensorApis(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof DeviceMotionEvent !== "undefined" ||
    typeof DeviceOrientationEvent !== "undefined"
  );
}
