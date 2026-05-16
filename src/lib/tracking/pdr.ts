export interface Point2D {
  x: number;
  y: number;
}

export interface PDRConfig {
  stepLengthMeters: number;
  svgUnitsPerMeter: number;
}

export const DEFAULT_PDR_CONFIG: PDRConfig = {
  stepLengthMeters: 0.7,
  svgUnitsPerMeter: 50,
};

export function computePDRStep(
  currentPosition: Point2D,
  headingDegrees: number,
  config: PDRConfig = DEFAULT_PDR_CONFIG
): Point2D {
  const stepDistance = config.stepLengthMeters * config.svgUnitsPerMeter;
  const svgAngle = ((headingDegrees - 90) * Math.PI) / 180;

  return {
    x: currentPosition.x + stepDistance * Math.cos(svgAngle),
    y: currentPosition.y + stepDistance * Math.sin(svgAngle),
  };
}
