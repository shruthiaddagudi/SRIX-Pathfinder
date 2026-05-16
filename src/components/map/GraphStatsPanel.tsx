"use client";

import { GraphStats } from "@/data/graphs/builder";

interface GraphStatsPanelProps {
  stats: GraphStats;
  onClose: () => void;
}

/**
 * GraphStatsPanel — Floating debug panel showing graph health metrics.
 *
 * Shows node/edge counts, floor breakdown, type breakdown, stair
 * connections, and any build warnings. This lets us catch graph
 * data errors (missing doorNodes, orphan junctions) before Phase 4.
 */
export default function GraphStatsPanel({ stats, onClose }: GraphStatsPanelProps) {
  const floorNames: Record<number, string> = {
    0: "Ground", 1: "First", 2: "Second",
  };

  const typeColors: Record<string, string> = {
    junction: "text-indigo-400",
    room:     "text-slate-400",
    office:   "text-cyan-400",
    washroom: "text-rose-400",
    canteen:  "text-orange-400",
    lab:      "text-green-400",
    entrance: "text-blue-400",
    stairs:   "text-amber-400",
  };

  return (
    <div className="absolute top-14 left-3 w-64 bg-slate-950/97 backdrop-blur-md border border-indigo-500/30 rounded-2xl shadow-2xl shadow-indigo-500/10 z-30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300 tracking-wide">
            GRAPH DEBUG
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Totals */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard value={stats.totalNodes} label="Nodes" color="text-indigo-300" />
          <StatCard value={stats.totalEdges} label="Edges" color="text-purple-300" />
        </div>

        {/* Warnings */}
        {stats.warnings.length > 0 && (
          <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-3">
            <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-1.5">
              ⚠ {stats.warnings.length} Warning{stats.warnings.length > 1 ? "s" : ""}
            </p>
            {stats.warnings.map((w, i) => (
              <p key={i} className="text-[9px] text-red-300/80 font-mono leading-relaxed">
                {w}
              </p>
            ))}
          </div>
        )}

        {stats.warnings.length === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
            <span className="text-emerald-400 text-sm">✓</span>
            <span className="text-[10px] text-emerald-400 font-medium">Graph built cleanly</span>
          </div>
        )}

        {/* Per-floor breakdown */}
        <Section title="Nodes by Floor">
          {Object.entries(stats.nodesByFloor).map(([floor, count]) => (
            <Row
              key={floor}
              label={floorNames[Number(floor)] ?? `Floor ${floor}`}
              value={`${count} nodes`}
              valueClass="text-slate-300"
            />
          ))}
        </Section>

        {/* Per-type breakdown */}
        <Section title="Nodes by Type">
          {Object.entries(stats.nodesByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <Row
                key={type}
                label={type}
                value={String(count)}
                valueClass={typeColors[type] ?? "text-slate-400"}
              />
            ))}
        </Section>

        {/* Stair connections */}
        <Section title="Cross-Floor Connections">
          {stats.stairConnections.length === 0 ? (
            <p className="text-[10px] text-red-400">No stair edges found!</p>
          ) : (
            stats.stairConnections.map((sc, i) => (
              <div key={i} className="text-[9px] font-mono text-slate-400 leading-relaxed">
                <span className="text-amber-400">{sc.from}</span>
                <span className="text-slate-600"> ↔ </span>
                <span className="text-amber-400">{sc.to}</span>
                <span className="text-slate-600"> ({sc.weight}u)</span>
              </div>
            ))
          )}
        </Section>

        <p className="text-[9px] text-slate-700 text-center pt-1">
          Phase 3 Debug — remove before production
        </p>
      </div>
    </div>
  );
}

function StatCard({
  value, label, color,
}: {
  value: number; label: string; color: string;
}) {
  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-800/50 p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function Section({
  title, children,
}: {
  title: string; children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({
  label, value, valueClass,
}: {
  label: string; value: string; valueClass: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-slate-500 capitalize">{label}</span>
      <span className={`text-[10px] font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
