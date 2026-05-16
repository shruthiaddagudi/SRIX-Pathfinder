"use client";

import type { Point } from "@/types";

interface UserPositionMarkerProps {
  position: Point;
  heading: number;
  floor: number;
  currentFloor: number;
}

export default function UserPositionMarker({
  position,
  heading,
  floor,
  currentFloor,
}: UserPositionMarkerProps) {
  if (floor !== currentFloor) return null;

  return (
    <g transform={`translate(${position.x}, ${position.y})`} pointerEvents="none">
      <defs>
        <style>{`
          .srix-user-position-ring {
            transform-origin: center;
            animation: srix-user-position-ring 1.8s ease-out infinite;
          }

          @keyframes srix-user-position-ring {
            0% { opacity: 0.6; transform: scale(0.82); }
            50% { opacity: 0; transform: scale(1.5); }
            100% { opacity: 0.6; transform: scale(0.82); }
          }
        `}</style>
      </defs>

      <circle
        className="srix-user-position-ring"
        cx="0"
        cy="0"
        r="16"
        fill="#60A5FA"
        opacity="0.25"
      />

      <g transform={`rotate(${heading})`}>
        <path
          d="M14 0 L2 5 L6 0 L2 -5 Z"
          fill="#EFF6FF"
          opacity="0.95"
        />
      </g>

      <circle cx="0" cy="0" r="7" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.8" />
      <circle cx="0" cy="0" r="3" fill="#DBEAFE" />
    </g>
  );
}
