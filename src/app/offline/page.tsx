export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="max-w-md rounded-3xl border border-slate-800/70 bg-slate-900/95 p-8 text-center shadow-2xl shadow-slate-950/40">
        <h1 className="text-2xl font-semibold text-white">You are offline</h1>
        <p className="mt-4 text-sm text-slate-400">
          SRIX Pathfinder works without internet once the app has loaded. Please reconnect and reload to restore full navigation features.
        </p>
        <div className="mt-6 inline-flex items-center justify-center rounded-3xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950">
          Offline mode enabled
        </div>
      </div>
    </main>
  );
}
