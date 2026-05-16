"use client";

import type { Route, RouteStep } from "@/lib/pathfinding";
import type { Point, UserPosition } from "@/types";
import useVoiceGuidance from "@/hooks/useVoiceGuidance";
import VoiceControls from "@/components/navigation/VoiceControls";

interface NavigationHUDProps {
  route: Route;
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  progressPercent: number;
  currentStepIndex: number;
  isSimulating: boolean;
  isLiveTracking: boolean;
  isPermissionGranted: boolean;
  sensorSupported: boolean;
  stepCount: number;
  accuracy: number;
  source: UserPosition["source"];
  compassTrusted: boolean;
  position: Point | null;
  currentFloor: number;
  confidence: number;
  onToggleSimulate: () => void;
  onToggleLiveTrack: () => void;
  requestPermission: () => Promise<boolean>;
  onStop: () => void;
  onOpenQRScanner?: () => void;
}


export default function NavigationHUD({
  route,
  currentStep,
  nextStep,
  progressPercent,
  currentStepIndex,
  isSimulating,
  isLiveTracking,
  isPermissionGranted,
  sensorSupported,
  stepCount,
  accuracy,
  source,
  compassTrusted,
  position,
  currentFloor,
  confidence,
  onToggleSimulate,
  onToggleLiveTrack,
  requestPermission,
  onStop,
  onOpenQRScanner,
}: NavigationHUDProps) {
  const completedSteps = Math.min(route.steps.length, currentStepIndex + 1);
  const remainingMinutes = Math.max(
    0,
    route.estimatedMinutes - Math.round(route.estimatedMinutes * progressPercent)
  );
  const progressLabel = `${completedSteps}/${route.steps.length} steps`;

  const {
    isVoiceEnabled,
    toggleVoice,
    onVolumeChange,
    onRateChange,
    isSpeaking,
    lastAnnouncement,
    isVoiceUnlocked,
    unlockVoiceGesture,
  } = useVoiceGuidance({
    route,
    currentStepIndex,
    position,
    currentFloor,
    confidence,
    isActive: route.found,
    source,
    isLiveTracking,
  });

  const handleLiveTrackClick = async () => {
    if (isLiveTracking) {
      onToggleLiveTrack();
      return;
    }
    if (!sensorSupported) return;
    if (!isPermissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    onToggleLiveTrack();
  };

  return (
    <div className="fixed left-0 right-0 bottom-28 z-30 px-4">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl p-4 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
              Navigation Active
            </p>
            <p className="text-sm font-semibold text-white leading-6 sm:text-base">
              {currentStep?.instruction ?? "Starting navigation…"}
            </p>
            {nextStep && (
              <p className="mt-2 text-[11px] text-slate-400 sm:text-sm">
                Next: {nextStep.instruction}
              </p>
            )}
            {isLiveTracking && (
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-400 animate-pulse" />
                  Tracking
                </span>
                <span>{stepCount} steps taken</span>
                <span>±{accuracy} units</span>
                <span>Source: {source}</span>
                {!compassTrusted && isPermissionGranted && (
                  <span className="text-amber-300">Calibrating compass…</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
            <button
              onClick={onToggleSimulate}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                isSimulating
                  ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700"
              }`}
            >
              {isSimulating ? "Stop Simulation" : "Simulate Walk"}
            </button>
            <button
              type="button"
              onClick={handleLiveTrackClick}
              disabled={!sensorSupported}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                isLiveTracking
                  ? "bg-rose-500 text-slate-950 hover:bg-rose-400"
                  : sensorSupported
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "bg-slate-700/40 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isLiveTracking ? "Stop Live Track" : "Live Track"}
            </button>
            {isLiveTracking && onOpenQRScanner && (
              <button
                onClick={onOpenQRScanner}
                className="rounded-2xl px-4 py-2 bg-blue-500 text-slate-950 font-semibold hover:bg-blue-400 transition"
              >
                📱 QR Calibrate
              </button>
            )}
            <button
              onClick={onStop}
              className="rounded-2xl px-4 py-2 bg-rose-500 text-slate-950 font-semibold hover:bg-rose-400 transition"
            >
              Stop Navigation
            </button>
          </div>
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
          Live Track expects a phone or tablet with accelerometer and compass over{" "}
          <strong className="font-medium text-slate-400">HTTPS</strong>. On desktop, use{" "}
          <strong className="font-medium text-slate-400">Simulate Walk</strong> to preview the route.
        </p>

        {!sensorSupported && (
          <div className="mt-4 rounded-3xl border border-rose-600/30 bg-rose-500/10 px-4 py-3 text-[11px] text-rose-200">
            Live Track needs a phone or tablet with motion sensors. Use Simulate Walk on desktop.
          </div>
        )}

        {isLiveTracking && sensorSupported && !isPermissionGranted && (
          <div className="mt-4 rounded-3xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-100">
            <div className="mb-2">Sensor permission denied. Tap retry to grant access.</div>
            <button
              onClick={requestPermission}
              className="rounded-2xl bg-amber-400/15 px-3 py-2 text-[11px] font-semibold text-amber-100 hover:bg-amber-400/25 transition"
            >
              Retry Permission
            </button>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                  style={{ width: `${Math.round(progressPercent * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{progressLabel}</span>
                <span>{remainingMinutes} min left</span>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900/90 px-4 py-3 text-right border border-slate-800/60">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                ETA
              </p>
              <p className="text-xl font-semibold text-white">
                {route.estimatedMinutes} min
              </p>
            </div>
          </div>

          <VoiceControls
            isVoiceEnabled={isVoiceEnabled}
            onToggle={toggleVoice}
            onVolumeChange={onVolumeChange}
            onRateChange={onRateChange}
            lastAnnouncement={lastAnnouncement}
            isSpeaking={isSpeaking}
          />

          {!isVoiceUnlocked && (
            <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-100">
              Voice guidance needs a tap to unlock on this device.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
