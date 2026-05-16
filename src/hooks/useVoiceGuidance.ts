"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { speechEngine, Priority } from "@/lib/voice/speechEngine";
import {
  buildArrivalAnnouncement,
  buildDriftWarningAnnouncement,
  buildFloorChangeAnnouncement,
  buildOffPathAnnouncement,
  buildQRCalibrationAnnouncement,
  buildRerouteAnnouncement,
  buildStartAnnouncement,
  buildTurnAnnouncement,
  buildWrongWayAnnouncement,
} from "@/lib/voice/instructionBuilder";
import type { Route } from "@/lib/pathfinding/route";
import type { Point, UserPosition } from "@/types";
import {
  angularDifferenceDegrees,
  findRouteNode,
  headingToPoint,
} from "@/lib/navigation/routeGeometry";

export interface VoiceGuidanceState {
  isVoiceEnabled: boolean;
  toggleVoice: () => void;
  onVolumeChange: (value: number) => void;
  onRateChange: (value: number) => void;
  isSpeaking: boolean;
  lastAnnouncement: string;
  isVoiceUnlocked: boolean;
  unlockVoiceGesture: () => void;
}

const STORAGE_KEYS = {
  enabled: "srix-voice-enabled",
  volume: "srix-voice-volume",
  rate: "srix-voice-rate",
  unlocked: "srix-voice-unlocked",
};

const DRIFT_WARNING_THRESHOLD = 0.3;
const DRIFT_WARNING_RESET = 0.5;
const OFF_PATH_DISTANCE_UNITS = 220;
const OFF_PATH_COOLDOWN_MS = 12000;
const WRONG_WAY_MIN_DISTANCE_UNITS = 52;
const WRONG_WAY_HEADING_DIFF_DEG = 88;
const WRONG_WAY_COOLDOWN_MS = 14000;
/** Minimum map motion between samples to infer walking direction (SVG units). */
const WRONG_WAY_MIN_MOTION_UNITS = 16;

export default function useVoiceGuidance({
  route,
  currentStepIndex,
  position,
  currentFloor,
  confidence,
  isActive,
  source,
  isLiveTracking = false,
  savePreference,
}: {
  route: Route | null;
  currentStepIndex: number;
  position: Point | null;
  currentFloor: number;
  confidence: number;
  isActive: boolean;
  source: UserPosition["source"];
  isLiveTracking?: boolean;
  savePreference?: (key: string, value: unknown) => void;
}): VoiceGuidanceState {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(0.92);
  const [lastAnnouncement, setLastAnnouncement] = useState("");
  const [isVoiceUnlocked, setIsVoiceUnlocked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const previousSourceRef = useRef<UserPosition["source"]>(source);
  const hasDriftWarnedRef = useRef(false);
  const hasAnnouncedArrivalRef = useRef(false);
  const routeStartAnnouncedRef = useRef(false);
  const announcedStepIndexRef = useRef<number | null>(null);
  const previousRouteRef = useRef<Route | null>(null);
  const lastOffPathSpeakRef = useRef<number>(0);
  const lastWrongWaySpeakRef = useRef<number>(0);
  const prevPositionForWrongWayRef = useRef<Point | null>(null);

  const steps = useMemo(() => route?.steps ?? [], [route?.steps]);
  const currentStep = steps[currentStepIndex] ?? null;
  const nextStep = steps[currentStepIndex + 1] ?? null;
  const isComplete = route ? currentStepIndex >= Math.max(0, steps.length - 1) : false;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const enabled = window.localStorage.getItem(STORAGE_KEYS.enabled) === "true";
    const storedVolume = Number(window.localStorage.getItem(STORAGE_KEYS.volume));
    const storedRate = Number(window.localStorage.getItem(STORAGE_KEYS.rate));
    const unlocked = window.localStorage.getItem(STORAGE_KEYS.unlocked) === "true";

    setIsVoiceEnabled(enabled);
    if (!Number.isNaN(storedVolume) && storedVolume > 0) {
      setVolume(storedVolume);
      speechEngine.setConfig({ volume: storedVolume });
    }
    if (!Number.isNaN(storedRate) && storedRate > 0) {
      setRate(storedRate);
      speechEngine.setConfig({ rate: storedRate });
    }
    setIsVoiceUnlocked(unlocked);
  }, []);

  useEffect(() => {
    if (isVoiceEnabled) {
      speechEngine.setConfig({ volume, rate });
    }
  }, [volume, rate, isVoiceEnabled]);

  const persistVoiceEnabled = useCallback((value: boolean) => {
    setIsVoiceEnabled(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.enabled, String(value));
    }
    if (savePreference) {
      savePreference("voiceEnabled", value);
    }
    if (!value) {
      speechEngine.cancel();
    }
  }, [savePreference]);

  const toggleVoice = useCallback(() => {
    persistVoiceEnabled(!isVoiceEnabled);
  }, [isVoiceEnabled, persistVoiceEnabled]);

  const onVolumeChange = useCallback((value: number) => {
    setVolume(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.volume, value.toString());
    }
    if (savePreference) {
      savePreference("voiceVolume", value);
    }
    speechEngine.setConfig({ volume: value });
  }, [savePreference]);

  const onRateChange = useCallback((value: number) => {
    setRate(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEYS.rate, value.toString());
    }
    if (savePreference) {
      savePreference("voiceRate", value);
    }
    speechEngine.setConfig({ rate: value });
  }, [savePreference]);

  const unlockVoiceGesture = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.unlocked, "true");
    if (savePreference) {
      savePreference("hasUnlockedVoice", true);
    }
    setIsVoiceUnlocked(true);
    if (speechEngine.isAvailable()) {
      speechEngine.speak("\u200B", Priority.NORMAL);
    }
  }, [savePreference]);

  useEffect(() => {
    if (!route || !route.found) {
      routeStartAnnouncedRef.current = false;
      hasAnnouncedArrivalRef.current = false;
      announcedStepIndexRef.current = null;
      hasDriftWarnedRef.current = false;
      previousRouteRef.current = route;
    }
  }, [route]);

  useEffect(() => {
    prevPositionForWrongWayRef.current = null;
  }, [route?.startId, route?.goalId, isLiveTracking]);

  useEffect(() => {
    if (!route?.found || !isActive || !isVoiceEnabled) return;
    if (routeStartAnnouncedRef.current) return;

    const originLabel = route.allNodes[0]?.label ?? "your route";
    const text = buildStartAnnouncement(originLabel, route.estimatedMinutes);
    speechEngine.speak(text, Priority.NORMAL);
    setLastAnnouncement(text);
    routeStartAnnouncedRef.current = true;
  }, [route, isActive, isVoiceEnabled]);

  useEffect(() => {
    if (!route?.found || !isActive || !isVoiceEnabled) return;
    if (!nextStep) return;
    if (announcedStepIndexRef.current === currentStepIndex) return;

    const text = nextStep.isFloorChange
      ? buildFloorChangeAnnouncement(nextStep)
      : buildTurnAnnouncement(nextStep, true);

    const priority = nextStep.isFloorChange ? Priority.HIGH : Priority.NORMAL;
    const timer = window.setTimeout(() => {
      speechEngine.speak(text, priority);
      setLastAnnouncement(text);
      announcedStepIndexRef.current = currentStepIndex;
    }, 500);

    return () => window.clearTimeout(timer);
  }, [route, currentStepIndex, nextStep, isActive, isVoiceEnabled]);

  useEffect(() => {
    if (!route?.found || !isActive || !isVoiceEnabled) return;
    if (!currentStep || currentStepIndex === 0 || currentStep.isFloorChange) return;

    const text = buildTurnAnnouncement(currentStep, false);
    speechEngine.speak(text, Priority.NORMAL);
    setLastAnnouncement(text);
  }, [route, currentStep, currentStepIndex, isActive, isVoiceEnabled]);

  useEffect(() => {
    if (!route?.found || !isActive || !isVoiceEnabled) return;
    if (!isComplete || hasAnnouncedArrivalRef.current) return;

    const text = buildArrivalAnnouncement();
    speechEngine.speak(text, Priority.HIGH);
    setLastAnnouncement(text);
    hasAnnouncedArrivalRef.current = true;
  }, [isComplete, route, isActive, isVoiceEnabled]);

  useEffect(() => {
    if (!isActive || !isVoiceEnabled) return;
    if (source !== "qr" || previousSourceRef.current === "qr") {
      previousSourceRef.current = source;
      return;
    }

    const text = buildQRCalibrationAnnouncement();
    speechEngine.speak(text, Priority.LOW);
    setLastAnnouncement(text);
    previousSourceRef.current = source;
  }, [source, isActive, isVoiceEnabled]);

  useEffect(() => {
    if (!isActive || !isVoiceEnabled) return;

    if (confidence < DRIFT_WARNING_THRESHOLD && !hasDriftWarnedRef.current) {
      const text = buildDriftWarningAnnouncement();
      speechEngine.speak(text, Priority.NORMAL);
      setLastAnnouncement(text);
      hasDriftWarnedRef.current = true;
      return;
    }

    if (confidence >= DRIFT_WARNING_RESET) {
      hasDriftWarnedRef.current = false;
    }
  }, [confidence, isActive, isVoiceEnabled]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsSpeaking(speechEngine.isSpeaking());
    }, 200);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isActive || !isVoiceEnabled) return;

    const routeChanged =
      previousRouteRef.current &&
      route &&
      previousRouteRef.current.found &&
      route.found &&
      previousRouteRef.current.startId === route.startId &&
      previousRouteRef.current.goalId === route.goalId &&
      previousRouteRef.current.allNodes.length !== route.allNodes.length;

    if (routeChanged) {
      const text = buildRerouteAnnouncement();
      speechEngine.speak(text, Priority.HIGH);
      setLastAnnouncement(text);
    }

    previousRouteRef.current = route;
  }, [route, isActive, isVoiceEnabled]);

  useEffect(() => {
    if (!isActive || !isVoiceEnabled) return;
    if (!route?.found || !position) return;

    const upcoming = steps[currentStepIndex + 1];
    if (!upcoming || upcoming.floor !== currentFloor) return;

    const waypoint = findRouteNode(route, upcoming.nodeId);
    if (!waypoint) return;

    const distance = Math.hypot(position.x - waypoint.position.x, position.y - waypoint.position.y);

    const now = Date.now();
    if (
      distance > OFF_PATH_DISTANCE_UNITS &&
      now - lastOffPathSpeakRef.current > OFF_PATH_COOLDOWN_MS
    ) {
      lastOffPathSpeakRef.current = now;
      const text = buildOffPathAnnouncement();
      speechEngine.speak(text, Priority.LOW);
      setLastAnnouncement(text);
    }
  }, [
    route,
    position,
    currentStepIndex,
    currentFloor,
    isActive,
    isVoiceEnabled,
    steps,
  ]);

  useEffect(() => {
    if (!isActive || !isVoiceEnabled) return;
    if (!route?.found || !position || !isLiveTracking) return;

    const upcoming = steps[currentStepIndex + 1];
    if (!upcoming || upcoming.isFloorChange || upcoming.floor !== currentFloor) return;

    const waypoint = findRouteNode(route, upcoming.nodeId);
    if (!waypoint) return;

    const distance = Math.hypot(position.x - waypoint.position.x, position.y - waypoint.position.y);
    if (distance < WRONG_WAY_MIN_DISTANCE_UNITS) return;

    const prev = prevPositionForWrongWayRef.current;
    prevPositionForWrongWayRef.current = position;
    if (!prev) return;

    const motion = Math.hypot(position.x - prev.x, position.y - prev.y);
    if (motion < WRONG_WAY_MIN_MOTION_UNITS) return;

    const motionHeading = headingToPoint(prev, position);
    const desiredHeading = headingToPoint(position, waypoint.position);
    const delta = angularDifferenceDegrees(motionHeading, desiredHeading);
    if (delta < WRONG_WAY_HEADING_DIFF_DEG) return;

    const now = Date.now();
    if (now - lastWrongWaySpeakRef.current < WRONG_WAY_COOLDOWN_MS) return;

    lastWrongWaySpeakRef.current = now;
    const text = buildWrongWayAnnouncement();
    speechEngine.speak(text, Priority.LOW);
    setLastAnnouncement(text);
  }, [
    route,
    position,
    currentFloor,
    currentStepIndex,
    isLiveTracking,
    isActive,
    isVoiceEnabled,
    steps,
  ]);

  useEffect(() => {
    if (!isActive) {
      speechEngine.cancel();
    }
  }, [isActive]);

  return {
    isVoiceEnabled,
    toggleVoice,
    onVolumeChange,
    onRateChange,
    isSpeaking,
    lastAnnouncement,
    isVoiceUnlocked,
    unlockVoiceGesture,
  };
}
