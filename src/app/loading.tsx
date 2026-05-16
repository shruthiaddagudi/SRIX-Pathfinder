export default function LoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-800/60 bg-slate-900/90 px-8 py-10 shadow-2xl shadow-slate-950/40">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-500/20">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500 animate-pulse" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white">SRIX Pathfinder</h1>
          <p className="mt-2 text-sm text-slate-400">Loading map and navigation tools...</p>
        </div>
      </div>
    </main>
  );
}
