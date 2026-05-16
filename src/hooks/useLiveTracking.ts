"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Point, UserPosition } from "@/types";
import { requestSensorPermission, subscribeSensors, SensorReading } from "@/lib/tracking/sensors";
import { detectStep, DEFAULT_STEP_DETECTOR_CONFIG } from "@/lib/tracking/stepDetector";
import { computePDRStep, DEFAULT_PDR_CONFIG } from "@/lib/tracking/pdr";
import { snapToCorridors } from "@/lib/tracking/corridorSnap";
import { createDriftState, recordCalibration, recordStep as recordDriftStep } from "@/lib/tracking/driftCorrector";
import { createAccuracyModel, degradeAccuracy, recalibrateAccuracy, getConfidence } from "@/lib/tracking/accuracyModel";
import {
  createHeadingFilter,
  getSmoothedHeading,
  updateHeadingFilter,
} from "@/lib/tracking/headingFilter";
import { hasSensorApis, isLikelyMobileDevice } from "@/lib/tracking/deviceCapabilities";
import type { Route } from "@/lib/pathfinding";
import { findRouteNode, headingToPoint } from "@/lib/navigation/routeGeometry";

interface LiveTrackingResult {
  position: Point | null;
  floor: number;
  heading: number;
  stepCount: number;
  isPermissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
  accuracy: number;
  confidence: number;
  source: UserPosition["source"];
  isSensorSupported: boolean;
  compassTrusted: boolean;
  snapStatus: "snapped" | "free";
  calibrate: (truePosition: { x: number; y: number }, floor: number) => void;
}

export default function useLiveTracking(
  initialPosition: Point | null,
  initialFloor: number,
  isActive: boolean,
  route: Route | null = null,
  currentStepIndex: number = 0
): LiveTrackingResult {
  const [position, setPosition] = useState<Point | null>(initialPosition);
  const [floor, setFloor] = useState<number>(initialFloor);
  const [heading, setHeading] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);
  const [isPermissionGranted, setIsPermissionGranted] = useState<boolean>(false);
  const [accuracy, setAccuracy] = useState<number>(100);
  const [confidence, setConfidence] = useState<number>(1);
  const [source, setSource] = useState<UserPosition["source"]>("initial");
  const [isSensorSupported, setIsSensorSupported] = useState<boolean>(false);
  const [snapStatus, setSnapStatus] = useState<"snapped" | "free">("free");
  const [compassTrusted, setCompassTrusted] = useState<boolean>(false);

  const driftStateRef = useRef(createDriftState());
  const accuracyStateRef = useRef(createAccuracyModel());
  const headingFilterRef = useRef(createHeadingFilter(0.22));

  const positionRef = useRef<Point | null>(initialPosition);
  const floorRef = useRef<number>(initialFloor);
  const headingRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(0);
  const lastHeadingUpdateRef = useRef<number>(0);
  const lastPositionUpdateRef = useRef<number>(0);
  const unsubscribeRef = useRef<() => void>(() => undefined);
  const routeBearingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!route?.found || !positionRef.current) {
      routeBearingRef.current = null;
      return;
    }
    const targetStep = route.steps[currentStepIndex + 1] ?? route.steps[currentStepIndex];
    if (!targetStep || targetStep.floor !== floorRef.current) {
      routeBearingRef.current = null;
      return;
    }
    const node = findRouteNode(route, targetStep.nodeId);
    if (!node) {
      routeBearingRef.current = null;
      return;
    }
    routeBearingRef.current = headingToPoint(positionRef.current, node.position);
  }, [route, currentStepIndex, position, floor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsSensorSupported(hasSensorApis() && isLikelyMobileDevice());
  }, []);

  useEffect(() => {
    positionRef.current = initialPosition;
    setPosition(initialPosition);
    floorRef.current = initialFloor;
    setFloor(initialFloor);
    setStepCount(0);
    setAccuracy(100);
    setSource("initial");
    setHeading(0);
    headingRef.current = 0;
    lastStepTimeRef.current = 0;
    lastHeadingUpdateRef.current = 0;
    setSnapStatus("free");
    setCompassTrusted(false);
    headingFilterRef.current = createHeadingFilter(0.22);
    routeBearingRef.current = null;
  }, [initialPosition, initialFloor]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestSensorPermission();
    setIsPermissionGranted(granted);
    setSource(granted ? "pdr" : "initial");
    return granted;
  }, []);

  useEffect(() => {
    setAccuracy(accuracyStateRef.current.currentRadius);
    setConfidence(getConfidence(accuracyStateRef.current));
  }, [stepCount, accuracy]);

  const handleSensorReading = useCallback((reading: SensorReading) => {
    const now = reading.timestamp || Date.now();
    setCompassTrusted(reading.compassTrusted);

    let walkHeading = headingRef.current;

    if (reading.compassTrusted) {
      const alpha = reading.rotationRate.alpha;
      const normalizedHeading = ((alpha % 360) + 360) % 360;
      headingFilterRef.current = updateHeadingFilter(headingFilterRef.current, normalizedHeading);
      walkHeading = getSmoothedHeading(headingFilterRef.current);
    } else if (routeBearingRef.current != null) {
      walkHeading = routeBearingRef.current;
    }

    const headingDelta = Math.abs(walkHeading - headingRef.current);
    if (headingDelta > 1.5 || now - lastHeadingUpdateRef.current > 200) {
      headingRef.current = walkHeading;
      lastHeadingUpdateRef.current = now;
      setHeading(walkHeading);
    }

    if (!detectStep(reading, lastStepTimeRef.current, DEFAULT_STEP_DETECTOR_CONFIG)) {
      return;
    }

    lastStepTimeRef.current = now;
    const currentPosition = positionRef.current;
    if (!currentPosition) {
      return;
    }

    const nextPosition = computePDRStep(
      currentPosition,
      walkHeading,
      { ...DEFAULT_PDR_CONFIG, stepLengthMeters: driftStateRef.current.adaptiveStepLength }
    );

    const snap = snapToCorridors(nextPosition, floorRef.current, 40);
    const finalPosition = snap ? snap.point : nextPosition;

    positionRef.current = finalPosition;
    const shouldUpdateUI = now - lastPositionUpdateRef.current >= 100;
    if (shouldUpdateUI) {
      setPosition(finalPosition);
      lastPositionUpdateRef.current = now;
    }
    setSnapStatus(snap ? "snapped" : "free");
    setStepCount((previous) => previous + 1);
    setSource("pdr");

    // Update drift and accuracy models
    driftStateRef.current = recordDriftStep(driftStateRef.current);
    accuracyStateRef.current = degradeAccuracy(accuracyStateRef.current);
  }, []);

  useEffect(() => {
    if (!isActive || !isPermissionGranted || !isSensorSupported) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      return;
    }

    const unsubscribe = subscribeSensors(handleSensorReading);
    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [isActive, isPermissionGranted, isSensorSupported, handleSensorReading]);

  const calibrate = useCallback((truePosition: { x: number; y: number }, floor: number) => {
    if (!positionRef.current) return;

    // Record calibration in drift corrector
    driftStateRef.current = recordCalibration(
      driftStateRef.current,
      positionRef.current,
      truePosition,
      50 // SVG units per meter
    );

    // Recalibrate accuracy
    accuracyStateRef.current = recalibrateAccuracy(accuracyStateRef.current);

    // Update position and floor
    positionRef.current = truePosition;
    setPosition(truePosition);
    floorRef.current = floor;
    setFloor(floor);

    // Reset step count and set source to "qr"
    setStepCount(0);
    setSource("qr");
    headingFilterRef.current = createHeadingFilter(0.22);

    // Update accuracy display
    setAccuracy(accuracyStateRef.current.currentRadius);
  }, []);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    position,
    floor,
    heading,
    stepCount,
    isPermissionGranted,
    requestPermission,
    accuracy,
    confidence,
    source,
    isSensorSupported,
    compassTrusted,
    snapStatus,
    calibrate,
  };
}
