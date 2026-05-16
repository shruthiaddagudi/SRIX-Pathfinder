"use client";

import { useCallback, useMemo, useRef, useState } from "react";

interface OnboardingOverlayProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Welcome to SRIX Pathfinder",
    subtitle: "Indoor navigation for SRIX Block.",
    description:
      "Find rooms, follow indoor routes, and stay on track with live updates.",
    icon: "🧭",
  },
  {
    title: "Tap to navigate",
    subtitle: "Tap a room to mark your origin.",
    description:
      "Then tap another room to get directions through the building.",
    icon: "📍",
  },
  {
    title: "QR calibrations",
    subtitle: "Scan QR codes to stay accurate.",
    description:
      "Use wall-mounted QR codes to correct drift and keep your route aligned.",
    icon: "📷",
  },
  {
    title: "Voice guidance",
    subtitle: "Audio directions keep you oriented.",
    description:
      "Enable voice instructions and allow the app to speak your next move.",
    icon: "🔊",
  },
];

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const slide = useMemo(() => slides[index], [index]);
  const isLast = index === slides.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    setIndex((current) => Math.min(current + 1, slides.length - 1));
  }, [isLast, onComplete]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = event.changedTouches[0]?.clientX ?? null;
    if (
      touchStartX.current !== null &&
      touchEndX.current !== null &&
      Math.abs(touchStartX.current - touchEndX.current) > 50
    ) {
      if (touchEndX.current < touchStartX.current) {
        handleNext();
      } else {
        setIndex((current) => Math.max(current - 1, 0));
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 text-slate-100 backdrop-blur-xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col justify-between px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
              Getting started
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              SRIX Pathfinder
            </h1>
          </div>
          <button
            onClick={handleSkip}
            className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Skip
          </button>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-indigo-500/15 text-5xl">
            <span>{slide.icon}</span>
          </div>
          <div className="max-w-xl">
            <p className="text-lg font-semibold text-white">{slide.title}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">{slide.description}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {slides.map((_, slideIndex) => (
              <span
                key={slideIndex}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  slideIndex === index ? "bg-indigo-400" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-3xl bg-slate-900/90 p-4 text-left text-sm text-slate-300">
            <p className="font-semibold text-slate-100">{slide.subtitle}</p>
            <p className="mt-2 text-slate-400">Swipe left or right to move through the tour.</p>
          </div>
          <button
            onClick={handleNext}
            className="rounded-3xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-400"
          >
            {isLast ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
