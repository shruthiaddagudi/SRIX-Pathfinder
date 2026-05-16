"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFloorSelector } from "@/hooks/useFloorSelector";
import { useMapInteraction } from "@/hooks/useMapInteraction";
import { useGraph } from "@/hooks/useGraph";
import FloorMap from "@/components/map/FloorMap";
import MapControls from "@/components/map/MapControls";
import RoomSearch from "@/components/map/RoomSearch";
import GraphStatsPanel from "@/components/map/GraphStatsPanel";
import { usePathfinder } from "@/hooks/usePathfinder";
import useRouteProgress from "@/hooks/useRouteProgress";
import useSimulatedPosition from "@/hooks/useSimulatedPosition";
import useLiveTracking from "@/hooks/useLiveTracking";
import useLiveRouteAdvance from "@/hooks/useLiveRouteAdvance";
import NavigationHUD from "@/components/navigation/NavigationHUD";
import UserPositionMarker from "@/components/navigation/UserPositionMarker";
import SensorDebugPanel from "@/components/navigation/SensorDebugPanel";
import VoicePermissionBanner from "@/components/navigation/VoicePermissionBanner";
import QRScannerModal from "@/components/navigation/QRScannerModal";
import RoutePanel from "@/components/map/navigation/RoutePanel";
import RouteOverlay from "@/components/map/navigation/RouteOverlay";
import { FLOOR_MAP_DATA } from "@/data/map-data";
import { speechEngine, Priority } from "@/lib/voice/speechEngine";
import useUserPreferences from "@/hooks/useUserPreferences";
import ErrorBoundary from "@/components/ErrorBoundary";
import LiveRegion from "@/components/a11y/LiveRegion";
import OnboardingOverlay from "@/components/onboarding/OnboardingOverlay";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { log } from "@/lib/logger";

export default function Home() {
  const { currentFloor, currentFloorId, floors, switchFloor, prevFloor, nextFloor } = useFloorSelector();
  const { viewBox, controls, handlers } = useMapInteraction();
  const { debugMode, toggleDebug, stats, getNodesForFloor, getEdgesForFloor } =
    useGraph();
  const { prefs, updatePref, resetPrefs, isReady } = useUserPreferences();

  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [hasVoiceUnlocked, setHasVoiceUnlocked] = useState(false);
  const [showVoiceBanner, setShowVoiceBanner] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const previousStepIndexRef = useRef<number>(-1);
  const { originId, destinationId, route, setOrigin, setDestination, clearRoute } = usePathfinder();
  const {
    currentStep,
    nextStep,
    progressPercent,
    advanceStep,
    syncStepToNode,
    currentStepIndex,
  } = useRouteProgress(route);
  const {
    position: simulatedPosition,
    currentFloor: simulatedFloor,
    heading: simulatedHeading,
    currentNodeIndex: simulatedNodeIndex,
  } = useSimulatedPosition(route, isSimulating);

  const initialLivePosition = route?.found ? route.allNodes[0].position : null;
  const initialLiveFloor = route?.found ? route.allNodes[0].floor : currentFloor.id;
  const liveTracking = useLiveTracking(
    initialLivePosition,
    initialLiveFloor,
    isLiveTracking,
    route,
    currentStepIndex
  );
  const [navMode, setNavMode] = useState(false);

  useLiveRouteAdvance(
    route,
    isLiveTracking,
    liveTracking.position,
    liveTracking.floor,
    currentStepIndex,
    advanceStep
  );

  useEffect(() => {
    if (!isReady) return;
    setHasVoiceUnlocked(prefs.hasUnlockedVoice);
    if (prefs.lastFloor !== currentFloorId) {
      switchFloor(prefs.lastFloor);
    }
    if (prefs.debugMode && !debugMode) {
      toggleDebug();
    }
    if (!prefs.debugMode && debugMode) {
      toggleDebug();
    }
  }, [isReady, prefs, currentFloorId, switchFloor, debugMode, toggleDebug]);

  useEffect(() => {
    if (!isReady) return;
    setShowVoiceBanner((isLiveTracking || isSimulating) && !prefs.hasUnlockedVoice);
  }, [isLiveTracking, isSimulating, prefs.hasUnlockedVoice, isReady]);

  useEffect(() => {
    if (!isReady) return;
    speechEngine.setConfig({
      volume: prefs.voiceVolume,
      rate: prefs.voiceRate,
      lang: prefs.voiceLang,
    });
    if (!prefs.voiceEnabled) {
      speechEngine.cancel();
    }
  }, [isReady, prefs.voiceVolume, prefs.voiceRate, prefs.voiceLang, prefs.voiceEnabled]);

  const unlockVoiceGesture = useCallback(() => {
    if (typeof window === "undefined") return;
    updatePref("hasUnlockedVoice", true);
    setHasVoiceUnlocked(true);
    window.localStorage.setItem("srix-voice-unlocked", "true");
    if (speechEngine.isAvailable()) {
      speechEngine.speak("\u200B", Priority.NORMAL);
    }
  }, [updatePref]);

  const dismissVoiceBanner = useCallback(() => {
    setShowVoiceBanner(false);
  }, []);

  const showOnboarding = isReady && !prefs.hasCompletedOnboarding;

  const handleCompleteOnboarding = useCallback(() => {
    updatePref("hasCompletedOnboarding", true);
    setLiveMessage("Onboarding complete. Ready to navigate.");
  }, [updatePref]);

  const handleSelectRoom = useCallback(
    (roomId: string | null, floorId: number) => {
      hapticLight();
      switchFloor(floorId);
      setHighlightedRoomId(roomId);

      if (navMode) {
        if (!originId) {
          setOrigin(roomId);
        } else {
          setDestination(roomId); // second tap = destination → route draws
        }
      }
    },
    [switchFloor, navMode, originId, setOrigin, setDestination]
  );

  // Graph data for the current floor (used by debug overlay)
  const currentGraphNodes = getNodesForFloor(currentFloor.id);
  const currentGraphEdges = getEdgesForFloor(currentFloor.id);

  const activePosition = isLiveTracking ? liveTracking.position : simulatedPosition;
  const activeHeading = isLiveTracking ? liveTracking.heading : simulatedHeading;
  const activeFloor = isLiveTracking ? liveTracking.floor : simulatedFloor;

  useEffect(() => {
    if (!route?.found) {
      setIsSimulating(false);
      setIsLiveTracking(false);
      previousStepIndexRef.current = -1;
      return;
    }
  }, [route]);

  useEffect(() => {
    if (!route?.found) return;
    if (currentStepIndex === previousStepIndexRef.current) return;

    if (previousStepIndexRef.current >= 0) {
      hapticLight();
    }

    setLiveMessage(currentStep?.instruction ?? "Continue along your route.");
    previousStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex, currentStep, route?.found]);

  useEffect(() => {
    if (!route?.found) return;
    if (currentStepIndex === route.steps.length - 1 && route.steps.length > 0) {
      setLiveMessage("You have arrived at your destination.");
      hapticSuccess();
    }
  }, [currentStepIndex, route]);

  useEffect(() => {
    if (isLiveTracking && liveTracking.position && liveTracking.floor !== currentFloor.id) {
      switchFloor(liveTracking.floor);
      updatePref("lastFloor", liveTracking.floor);
      setLiveMessage(`Now on ${FLOOR_MAP_DATA[liveTracking.floor]?.label ?? "the new floor"}.`);
    }
  }, [liveTracking.floor, liveTracking.position, isLiveTracking, currentFloor.id, switchFloor, updatePref]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearRoute();
        setIsQRScannerOpen(false);
        setNavMode(false);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        prevFloor();
        updatePref("lastFloor", Math.max(0, currentFloorId - 1));
        hapticLight();
      }
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        nextFloor();
        updatePref("lastFloor", Math.min(floors.length - 1, currentFloorId + 1));
        hapticLight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearRoute, currentFloorId, floors.length, nextFloor, prevFloor, updatePref]);

  useEffect(() => {
    if (simulatedPosition && simulatedFloor !== currentFloor.id) {
      switchFloor(simulatedFloor);
    }
  }, [simulatedFloor, simulatedPosition, currentFloor.id, switchFloor]);

  useEffect(() => {
    if (!route?.found || !route.steps.length || simulatedNodeIndex == null) return;

    const reachedNode = route.allNodes[simulatedNodeIndex];

    if (nextStep && reachedNode?.id === nextStep.nodeId) {
      advanceStep();
    }
  }, [route, nextStep, advanceStep, simulatedNodeIndex]);

  const handleStopNavigation = useCallback(() => {
    setIsSimulating(false);
    setIsLiveTracking(false);
    clearRoute();
    setNavMode(false);
  }, [clearRoute]);

  const handleToggleSimulation = useCallback(() => {
    setIsLiveTracking(false);
    setIsSimulating((previous) => !previous);
  }, []);

  const handleToggleLiveTrack = useCallback(() => {
    setIsSimulating(false);
    setIsLiveTracking((previous) => !previous);
  }, []);

  const handleOpenQRScanner = useCallback(() => {
    setIsQRScannerOpen(true);
  }, []);

  const handleQRDetected = useCallback((result: any) => {
    // Find the QR point in map data
    const qrPoint = Object.values(FLOOR_MAP_DATA)
      .flatMap((floor) => floor.qrPoints)
      .find((qr) => qr.id === result.position.id);

    if (qrPoint) {
      // Determine floor from junctionId (e.g., "g-j-nw" -> 0, "f1-j-nw" -> 1, "f2-j-nw" -> 2)
      const floorPrefix = qrPoint.junctionId.split("-")[0];
      const floorId = floorPrefix === "g" ? 0 : floorPrefix === "f1" ? 1 : floorPrefix === "f2" ? 2 : currentFloor.id;

      liveTracking.calibrate({ x: qrPoint.x, y: qrPoint.y }, floorId);
      syncStepToNode(qrPoint.junctionId);
      switchFloor(floorId);
      updatePref("lastFloor", floorId);
      setLiveMessage("QR detected. Position calibrated.");
      hapticLight();
      setIsQRScannerOpen(false);
    }
  }, [liveTracking, currentFloor.id, switchFloor, updatePref, syncStepToNode]);

  return (
    <ErrorBoundary>
      <main className="relative h-screen w-screen flex flex-col overflow-hidden">
        <VoicePermissionBanner
          visible={showVoiceBanner}
          onGesture={unlockVoiceGesture}
          onDismiss={dismissVoiceBanner}
        />
        <LiveRegion message={liveMessage} />
      {/* ── Header ── */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-white tracking-tight">SRIX Pathfinder</h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">
              Indoor Navigation • {currentFloor.label}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-sm mx-4">
          <RoomSearch onSelectRoom={handleSelectRoom} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Graph debug toggle */}
          <button
            onClick={() => { toggleDebug(); setShowStats((v) => !v); }}
            title="Toggle graph debug overlay"
            className={`
              px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all
              ${debugMode
                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                : "bg-slate-900/60 border-slate-800/50 text-slate-500 hover:text-slate-300"
              }
            `}
          >
            {debugMode ? "⬡ GRAPH ON" : "⬡ GRAPH"}
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-medium hidden sm:block">
              {stats.totalNodes}N / {stats.totalEdges}E
            </span>
            <span className="text-[10px] text-emerald-400 font-medium sm:hidden">Ready</span>
          </div>
        </div>
      </header>

      {/* ── Map area ── */}
      <div className="flex-1 relative p-2 min-h-0">
        <FloorMap
          floor={currentFloor}
          viewBox={viewBox}
          handlers={handlers}
          highlightedRoomId={highlightedRoomId}
          originRoomId={originId}
          destinationRoomId={destinationId}
          onRoomSelect={handleSelectRoom}
          debugMode={debugMode}
          graphNodes={currentGraphNodes}
          graphEdges={currentGraphEdges}
          routeOverlay={
            <>
              <RouteOverlay route={route} currentFloor={currentFloor.id} />
              {activePosition && route?.found && (
                <UserPositionMarker
                  position={activePosition}
                  heading={activeHeading}
                  floor={activeFloor}
                  currentFloor={currentFloor.id}
                />
              )}
            </>
          }
          onSetNavMode={setNavMode}
          onSetOrigin={setOrigin}
          onSetHighlightedRoom={setHighlightedRoomId}
        />

        {showStats && debugMode && (
          <GraphStatsPanel
            stats={stats}
            onClose={() => { setShowStats(false); toggleDebug(); }}
          />
        )}

        {debugMode && isLiveTracking && (
          <SensorDebugPanel
            position={liveTracking.position}
            heading={liveTracking.heading}
            stepCount={liveTracking.stepCount}
            accuracy={liveTracking.accuracy}
            snapStatus={liveTracking.snapStatus}
            source={liveTracking.source}
          />
        )}
      </div>

      {route?.found && (
        <NavigationHUD
          route={route}
          currentStep={currentStep}
          nextStep={nextStep}
          progressPercent={progressPercent}
          currentStepIndex={currentStepIndex}
          isSimulating={isSimulating}
          isLiveTracking={isLiveTracking}
          isPermissionGranted={liveTracking.isPermissionGranted}
          sensorSupported={liveTracking.isSensorSupported}
          stepCount={liveTracking.stepCount}
          accuracy={liveTracking.accuracy}
          confidence={liveTracking.confidence}
          source={liveTracking.source}
          compassTrusted={isLiveTracking ? liveTracking.compassTrusted : false}
          position={activePosition}
          currentFloor={activeFloor}
          onToggleSimulate={handleToggleSimulation}
          onToggleLiveTrack={handleToggleLiveTrack}
          requestPermission={liveTracking.requestPermission}
          onStop={handleStopNavigation}
          onOpenQRScanner={handleOpenQRScanner}
        />
      )}

      {/* ── Bottom controls ── */}
       <div className="relative z-10 px-4 pb-4 pt-2 flex flex-col gap-2">
        {/* NEW: Route panel (only shown in nav mode) */}
        {navMode && (
          <div className="rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800/50 p-3">
            <RoutePanel
              originId={originId}
              destinationId={destinationId}
              route={route}
              onSetOrigin={setOrigin}
              onSetDestination={setDestination}
              onClear={clearRoute}
              onFloorSwitch={switchFloor}
            />
          </div>
        )}

        <MapControls
          currentFloor={currentFloor}
          floors={floors}
          onSwitchFloor={(id) => {
            switchFloor(id);
            updatePref("lastFloor", id);
            setHighlightedRoomId(null);
          }}
          onZoomIn={controls.zoomIn}
          onZoomOut={controls.zoomOut}
          onReset={controls.resetView}
        />
      </div>

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onQRDetected={handleQRDetected}
      />

      {showOnboarding && (
        <OnboardingOverlay onComplete={handleCompleteOnboarding} />
      )}
    </main>
    </ErrorBoundary>
  );
}
