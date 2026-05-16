"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MAP_CONFIG } from "@/data/floors";
import { Point } from "@/types";

/**
 * useMapInteraction — handles zoom, pan, and touch gestures on the SVG map.
 *
 * WHY a custom hook?
 * - Keeps FloorMap component clean (rendering only)
 * - Encapsulates complex pointer math
 * - Reusable if we add a mini-map or admin editor later
 *
 * HOW it works:
 * - Tracks a `viewBox` that represents the visible area of the SVG
 * - Zooming = shrinking/expanding the viewBox
 * - Panning = translating the viewBox origin
 * - Touch: pinch-to-zoom + drag-to-pan
 */
export function useMapInteraction() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPointer = useRef<Point>({ x: 0, y: 0 });
  const lastPinchDist = useRef<number>(0);

  /** Calculate the current SVG viewBox string */
  const viewBox = `${pan.x} ${pan.y} ${MAP_CONFIG.WIDTH / zoom} ${MAP_CONFIG.HEIGHT / zoom}`;

  /** Mouse wheel / trackpad zoom */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * MAP_CONFIG.ZOOM_SENSITIVITY;
      setZoom((prev) =>
        Math.min(MAP_CONFIG.MAX_ZOOM, Math.max(MAP_CONFIG.MIN_ZOOM, prev + delta))
      );
    },
    []
  );

  /** Start dragging */
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  /** Drag to pan */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = (e.clientX - lastPointer.current.x) / zoom;
      const dy = (e.clientY - lastPointer.current.y) / zoom;
      setPan((prev) => ({ x: prev.x - dx, y: prev.y - dy }));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging, zoom]
  );

  /** Stop dragging */
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /** Touch: pinch-to-zoom */
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (lastPinchDist.current > 0) {
          const delta = (dist - lastPinchDist.current) * 0.01;
          setZoom((prev) =>
            Math.min(MAP_CONFIG.MAX_ZOOM, Math.max(MAP_CONFIG.MIN_ZOOM, prev + delta))
          );
        }
        lastPinchDist.current = dist;
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = 0;
  }, []);

  /** Zoom controls for UI buttons */
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(MAP_CONFIG.MAX_ZOOM, prev + 0.3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(MAP_CONFIG.MIN_ZOOM, prev - 0.3));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return {
    viewBox,
    zoom,
    isDragging,
    handlers: {
      onWheel: handleWheel,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerUp,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    controls: { zoomIn, zoomOut, resetView },
  };
}
