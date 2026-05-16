export interface SensorReading {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  /** Device orientation angles (despite the name — matches existing hook usage). */
  rotationRate: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  /** True once we have a real compass / absolute orientation alpha reading */
  compassTrusted: boolean;
  timestamp: number;
}

export async function requestSensorPermission(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (typeof DeviceMotionEvent !== "undefined") {
      const deviceMotionReq = (DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      }).requestPermission;

      if (typeof deviceMotionReq === "function") {
        const motionResult = await deviceMotionReq();
        if (motionResult !== "granted") {
          return false;
        }
      }
    }

    if (typeof DeviceOrientationEvent !== "undefined") {
      const deviceOrientationReq = (DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">;
      }).requestPermission;

      if (typeof deviceOrientationReq === "function") {
        const orientationResult = await deviceOrientationReq();
        if (orientationResult !== "granted") {
          return false;
        }
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function subscribeSensors(
  callback: (reading: SensorReading) => void
): () => void {
  let active = true;
  let rafId: number | null = null;

  const latestMotion = {
    x: 0,
    y: 0,
    z: 0,
    timestamp: Date.now(),
  };
  const latestOrientation = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    timestamp: Date.now(),
    hasAlpha: false,
  };

  const dispatchReading = () => {
    if (!active) return;

    callback({
      acceleration: {
        x: latestMotion.x,
        y: latestMotion.y,
        z: latestMotion.z,
      },
      rotationRate: {
        alpha: latestOrientation.alpha,
        beta: latestOrientation.beta,
        gamma: latestOrientation.gamma,
      },
      compassTrusted: latestOrientation.hasAlpha,
      timestamp: Date.now(),
    });

    rafId = requestAnimationFrame(dispatchReading);
  };

  const motionHandler = (event: DeviceMotionEvent) => {
    // iOS often leaves `acceleration` null; gravity-inclusive values still work for step peaks
    const motion =
      event.accelerationIncludingGravity ??
      event.acceleration;
    if (!motion) {
      return;
    }

    const x = motion.x;
    const y = motion.y;
    const z = motion.z;
    if (x == null && y == null && z == null) {
      return;
    }

    latestMotion.x = x ?? latestMotion.x;
    latestMotion.y = y ?? latestMotion.y;
    latestMotion.z = z ?? latestMotion.z;
    latestMotion.timestamp = event.timeStamp || Date.now();
  };

  type OrientationExt = DeviceOrientationEvent & {
    webkitCompassHeading?: number;
  };

  const applyOrientation = (event: DeviceOrientationEvent) => {
    const ext = event as OrientationExt;
    // iOS Safari: real compass when available (degrees from north, clockwise)
    if (typeof ext.webkitCompassHeading === "number" && Number.isFinite(ext.webkitCompassHeading)) {
      latestOrientation.alpha = ext.webkitCompassHeading;
      latestOrientation.hasAlpha = true;
    } else if (event.absolute && typeof event.alpha === "number" && Number.isFinite(event.alpha)) {
      latestOrientation.alpha = event.alpha;
      latestOrientation.hasAlpha = true;
    } else if (typeof event.alpha === "number" && Number.isFinite(event.alpha)) {
      latestOrientation.alpha = event.alpha;
      latestOrientation.hasAlpha = true;
    }
    if (typeof event.beta === "number" && Number.isFinite(event.beta)) {
      latestOrientation.beta = event.beta;
    }
    if (typeof event.gamma === "number" && Number.isFinite(event.gamma)) {
      latestOrientation.gamma = event.gamma;
    }
    latestOrientation.timestamp = event.timeStamp || Date.now();
  };

  const orientationHandler = (event: DeviceOrientationEvent) => {
    applyOrientation(event);
  };

  const absoluteOrientationHandler = (event: DeviceOrientationEvent) => {
    applyOrientation(event);
  };

  window.addEventListener("devicemotion", motionHandler);
  window.addEventListener("deviceorientation", orientationHandler);
  if (typeof window.DeviceOrientationEvent !== "undefined") {
    window.addEventListener(
      "deviceorientationabsolute",
      absoluteOrientationHandler as EventListener
    );
  }

  rafId = requestAnimationFrame(dispatchReading);

  return () => {
    active = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener("devicemotion", motionHandler);
    window.removeEventListener("deviceorientation", orientationHandler);
    window.removeEventListener(
      "deviceorientationabsolute",
      absoluteOrientationHandler as EventListener
    );
  };
}
