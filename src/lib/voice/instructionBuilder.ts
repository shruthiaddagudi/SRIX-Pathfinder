import type { RouteStep } from "@/lib/pathfinding/route";

const FLOOR_VOICE_NAMES = ["ground floor", "first floor", "second floor"];

export function buildTurnAnnouncement(step: RouteStep, isUpcoming: boolean): string {
  if (step.isFloorChange) {
    return buildFloorChangeAnnouncement(step);
  }

  if (isUpcoming) {
    switch (step.direction) {
      case "left":
        return "Upcoming left turn";
      case "right":
        return "Upcoming right turn";
      default:
        return "Continue straight ahead";
    }
  }

  switch (step.direction) {
    case "left":
      return "Turn left now";
    case "right":
      return "Turn right now";
    default:
      return "Continue straight";
  }
}

export function buildFloorChangeAnnouncement(step: RouteStep): string {
  const floorName = FLOOR_VOICE_NAMES[step.floor] ?? `floor ${step.floor}`;
  const direction = step.direction === "down" ? "down" : "up";
  return `Head to the staircase and go ${direction} to the ${floorName}`;
}

export function buildArrivalAnnouncement(): string {
  return "You have arrived at your destination";
}

export function buildStartAnnouncement(originLabel: string, estimatedMinutes: number): string {
  const minutesText = estimatedMinutes === 1 ? "one minute" : `${estimatedMinutes} minute${estimatedMinutes === 1 ? "" : "s"}`;
  return `Navigation started. Estimated ${minutesText} walk.`;
}

export function buildQRCalibrationAnnouncement(): string {
  return "Position updated. Navigation is now more accurate.";
}

export function buildDriftWarningAnnouncement(): string {
  return "Position uncertain. Please scan a QR code.";
}

export function buildRerouteAnnouncement(): string {
  return "Recalculating route.";
}

export function buildOffPathAnnouncement(): string {
  return "You may be off the path. Please check the map.";
}

export function buildWrongWayAnnouncement(): string {
  return "You may be facing the wrong way. Turn toward the blue route line.";
}
