"use client";

import { useEffect, useState } from "react";
import { subscribeSensors, type SensorReading } from "@/lib/tracking/sensors";
import type { Point, UserPosition } from "@/types";

interface SensorDebugPanelProps {
  position: Point | null;
  heading: number;
  stepCount: number;
  accuracy: number;
  snapStatus: "snapped" | "free";
  source: UserPosition["source"];
}

export default function SensorDebugPanel({
  position,
  heading,
  stepCount,
  accuracy,
  snapStatus,
  source,
}: SensorDebugPanelProps) {
  const [acceleration, setAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [compassTrusted, setCompassTrusted] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeSensors((reading: SensorReading) => {
      setAcceleration({
        x: reading.acceleration.x,
        y: reading.acceleration.y,
        z: reading.acceleration.z,
      });
      setOrientation({
        alpha: reading.rotationRate.alpha,
        beta: reading.rotationRate.beta,
        gamma: reading.rotationRate.gamma,
      });
      setCompassTrusted(reading.compassTrusted);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 w-72 rounded-3xl border border-slate-700/80 bg-slate-950/90 p-4 text-slate-200 shadow-2xl shadow-slate-950/50 font-mono text-[11px] leading-relaxed backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-slate-100">Sensor Debug</span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Acceleration</div>
          <div>{acceleration.x.toFixed(2)} | {acceleration.y.toFixed(2)} | {acceleration.z.toFixed(2)} m/s²</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Orientation</div>
          <div>{orientation.alpha.toFixed(0)}°, {orientation.beta.toFixed(0)}°, {orientation.gamma.toFixed(0)}°</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Compass</div>
          <div>{compassTrusted ? "trusted" : "waiting"}</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Heading</div>
          <div>{heading.toFixed(0)}°</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Steps</div>
          <div>{stepCount}</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Position</div>
          <div>{position ? `${Math.round(position.x)}, ${Math.round(position.y)}` : "—"}</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Snap</div>
          <div>{snapStatus}</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Source</div>
          <div>{source}</div>
        </div>
        <div>
          <div className="text-slate-500 uppercase tracking-[0.22em] text-[9px]">Accuracy</div>
          <div>±{accuracy} units</div>
        </div>
      </div>
    </div>
  );
}
