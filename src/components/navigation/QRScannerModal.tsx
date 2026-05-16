"use client";

import { useEffect, useRef, useState } from "react";
import { startQRScanning, stopQRScanning, type QRScannerState, type QRScanResult } from "@/lib/tracking/qrScanner";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQRDetected: (result: QRScanResult) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onQRDetected
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scannerState, setScannerState] = useState<QRScannerState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (isOpen && videoRef.current && !scannerState) {
      setIsInitializing(true);
      setError(null);

      startQRScanning(videoRef.current, (result) => {
        onQRDetected(result);
        onClose(); // Close modal after successful scan
      })
        .then(setScannerState)
        .catch((err) => {
          setError(err.message || 'Failed to access camera');
        })
        .finally(() => {
          setIsInitializing(false);
        });
    }

    return () => {
      if (scannerState) {
        stopQRScanning(scannerState);
        setScannerState(null);
      }
    };
  }, [isOpen, scannerState, onQRDetected, onClose]);

  useEffect(() => {
    if (!isOpen && scannerState) {
      stopQRScanning(scannerState);
      setScannerState(null);
    }
  }, [isOpen, scannerState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-800/80 text-white flex items-center justify-center hover:bg-slate-700/80 transition"
        >
          ✕
        </button>

        {/* Scanner container */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-700">
          {/* Video feed */}
          <div className="relative aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              <div className="absolute top-8 left-8 w-16 h-16 border-l-4 border-t-4 border-emerald-400 rounded-tl-lg"></div>
              <div className="absolute top-8 right-8 w-16 h-16 border-r-4 border-t-4 border-emerald-400 rounded-tr-lg"></div>
              <div className="absolute bottom-8 left-8 w-16 h-16 border-l-4 border-b-4 border-emerald-400 rounded-bl-lg"></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 border-r-4 border-b-4 border-emerald-400 rounded-br-lg"></div>

              {/* Center scanning line */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-emerald-400 animate-pulse"></div>
            </div>
          </div>

          {/* Status and instructions */}
          <div className="p-6 bg-slate-900">
            <h3 className="text-lg font-semibold text-white mb-2">
              Scan QR Code
            </h3>

            {error ? (
              <div className="text-red-400 text-sm mb-4">
                {error}
              </div>
            ) : isInitializing ? (
              <div className="text-slate-400 text-sm mb-4">
                Initializing camera...
              </div>
            ) : scannerState?.isScanning ? (
              <div className="text-emerald-400 text-sm mb-4">
                Scanning for QR codes...
              </div>
            ) : null}

            <div className="text-slate-400 text-xs leading-relaxed">
              Point your camera at a QR code checkpoint to recalibrate your position.
              The code should be clearly visible within the brackets.
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}