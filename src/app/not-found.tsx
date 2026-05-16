"use client";

import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
      <div className="max-w-md rounded-3xl border border-slate-800/70 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/40">
        <h1 className="text-3xl font-semibold text-white">Room not found</h1>
        <p className="mt-4 text-sm text-slate-400">
          The page you were looking for does not exist. Return to the map to continue navigation.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-3xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-indigo-400 transition"
        >
          Back to map
        </button>
      </div>
    </main>
  );
}
