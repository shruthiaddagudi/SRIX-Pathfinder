import type { SensorReading } from "@/lib/tracking/sensors";

export interface StepDetectorConfig {
  threshold: number;
  minStepInterval: number;
}

export const DEFAULT_STEP_DETECTOR_CONFIG: StepDetectorConfig = {
  threshold: 1.2,
  minStepInterval: 300,
};

export function detectStep(
  reading: SensorReading,
  lastStepTime: number,
  config: StepDetectorConfig = DEFAULT_STEP_DETECTOR_CONFIG
): boolean {
  const ax = reading.acceleration.x;
  const ay = reading.acceleration.y;
  const az = reading.acceleration.z;

  const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
  if (magnitude < 0.5) {
    return false;
  }

  const netAcceleration = Math.abs(magnitude - 9.81);
  const timeSinceLastStep = reading.timestamp - lastStepTime;

  return (
    netAcceleration > config.threshold &&
    timeSinceLastStep > config.minStepInterval
  );
}
