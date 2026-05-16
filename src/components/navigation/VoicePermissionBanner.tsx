"use client";

interface VoicePermissionBannerProps {
  visible: boolean;
  onGesture: () => void;
  onDismiss: () => void;
}

export default function VoicePermissionBanner({
  visible,
  onGesture,
  onDismiss,
}: VoicePermissionBannerProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 bg-amber-500/95 text-amber-950 shadow-2xl shadow-amber-500/20 border-b border-amber-600/60 backdrop-blur-md"
      onClick={onGesture}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onGesture();
        }
      }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 text-sm font-medium">
        <div>
          <div>Tap here to enable voice guidance.</div>
          <div className="text-[11px] text-amber-900/90">Required on some devices before speech output works.</div>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          className="rounded-full bg-amber-900/10 px-3 py-1 text-[11px] font-semibold text-amber-950 hover:bg-amber-900/15"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
