"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { getAllRooms } from "@/data/map-data";

interface RoomSearchProps {
  onSelectRoom: (roomId: string, floorId: number) => void;
}

/**
 * RoomSearch — Fuzzy search across all rooms on all floors.
 * Selects a room → parent switches floor + highlights room.
 */
export default function RoomSearch({ onSelectRoom }: RoomSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allRooms = useMemo(() => getAllRooms(), []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allRooms
      .filter((r) =>
        r.label.replace("\n", " ").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, allRooms]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const typeIcons: Record<string, string> = {
    room: "📖", office: "💼", washroom: "🚻", canteen: "🍽️",
    lab: "🔬", entrance: "🚪",
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search rooms..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50">
          {results.map((room) => (
            <button
              key={`${room.floorId}-${room.id}`}
              onClick={() => {
                onSelectRoom(room.id, room.floorId);
                setQuery("");
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors text-left border-b border-slate-800/30 last:border-0"
            >
              <span className="text-lg">{typeIcons[room.type] ?? "📍"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {room.label.replace("\n", " ")}
                </p>
                <p className="text-[10px] text-slate-500">{room.floorLabel}</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                F{room.floorId}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 text-center text-sm text-slate-500 z-50">
          No rooms found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
