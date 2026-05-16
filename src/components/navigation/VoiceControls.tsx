"use client";

import { useEffect, useState } from "react";

interface VoiceControlsProps {
  isVoiceEnabled: boolean;
  onToggle: () => void;
  onVolumeChange: (value: number) => void;
  onRateChange: (value: number) => void;
  lastAnnouncement: string;
  isSpeaking: boolean;
}

export default function VoiceControls({
  isVoiceEnabled,
  onToggle,
  onVolumeChange,
  onRateChange,
  lastAnnouncement,
  isSpeaking,
}: VoiceControlsProps) {
  const [visibleAnnouncement, setVisibleAnnouncement] = useState(lastAnnouncement);

  useEffect(() => {
    if (!lastAnnouncement) {
      setVisibleAnnouncement("");
      return;
    }

    setVisibleAnnouncement(lastAnnouncement);
    const timeout = window.setTimeout(() => {
      setVisibleAnnouncement("");
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [lastAnnouncement]);

  return (
    <div className="mt-4 rounded-3xl border border-slate-800/60 bg-slate-900/90 p-4 text-slate-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onToggle}
          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
            isVoiceEnabled
              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          {isVoiceEnabled ? "Voice On" : "Voice Off"}
        </button>
        <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
          <label className="text-[11px] text-slate-400">
            Speed
            <input
              type="range"
              min="0.7"
              max="1.2"
              step="0.05"
              defaultValue="0.92"
              onChange={(event) => onRateChange(Number(event.target.value))}
              className="mt-2 w-full accent-sky-400"
            />
          </label>
          <label className="text-[11px] text-slate-400">
            Volume
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.1"
              defaultValue="1"
              onChange={(event) => onVolumeChange(Number(event.target.value))}
              className="mt-2 w-full accent-sky-400"
            />
          </label>
        </div>
      </div>

      {visibleAnnouncement && (
        <p className="mt-3 text-[11px] italic text-slate-300 opacity-90">
          {isSpeaking ? "Speaking: " : "Last:"} {visibleAnnouncement}
        </p>
      )}
    </div>
  );
}
