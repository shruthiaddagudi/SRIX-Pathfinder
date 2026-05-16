const supportsVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;

function vibrate(pattern: number | number[]) {
  if (supportsVibrate) {
    navigator.vibrate(pattern);
  }
}

export function hapticLight() {
  vibrate(10);
}

export function hapticMedium() {
  vibrate(25);
}

export function hapticHeavy() {
  vibrate([50, 30, 50]);
}

export function hapticSuccess() {
  vibrate([10, 50, 10]);
}

export function hapticError() {
  vibrate([100, 50, 100]);
}
