/**
 * QR Scanner: Detect and decode QR codes for position recalibration
 *
 * Uses browser's getUserMedia + canvas to scan QR codes in real-time.
 * When QR code detected, extracts position data and calls recalibration.
 *
 * Use in Phase 8: integrate into live tracking for ground truth updates.
 */

import jsQR from 'jsqr';

export interface QRPosition {
  x: number;
  y: number;
  floor: number;
  id: string;
}

export interface QRScannerState {
  isScanning: boolean;
  stream: MediaStream | null;
  canvas: HTMLCanvasElement | null;
  video: HTMLVideoElement | null;
  lastScanTime: number;
}

export interface QRScanResult {
  position: QRPosition;
  timestamp: number;
  confidence: number;
}

/**
 * Create a new QR scanner state.
 */
export function createQRScanner(): QRScannerState {
  return {
    isScanning: false,
    stream: null,
    canvas: null,
    video: null,
    lastScanTime: 0,
  };
}

/**
 * Start QR scanning with camera.
 * @param videoElement Video element to display camera feed
 * @param onQRDetected Callback when QR code is detected
 * @returns Promise resolving to scanner state
 */
export async function startQRScanning(
  videoElement: HTMLVideoElement,
  onQRDetected: (result: QRScanResult) => void
): Promise<QRScannerState> {
  const state = createQRScanner();

  try {
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Use back camera
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });

    videoElement.srcObject = stream;
    await videoElement.play();

    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;

    state.stream = stream;
    state.canvas = canvas;
    state.video = videoElement;
    state.isScanning = true;

    // Start scanning loop
    const scanFrame = () => {
      if (!state.isScanning) return;

      // Draw video frame to canvas
      ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get image data for QR processing
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (imageData) {
        // Process frame for QR codes
        const result = processQRFrame(imageData);
        if (result) {
          onQRDetected(result);
          state.lastScanTime = Date.now();
        }
      }

      // Continue scanning (throttle to ~10fps)
      setTimeout(() => requestAnimationFrame(scanFrame), 100);
    };

    requestAnimationFrame(scanFrame);

  } catch (error) {
    console.error('Failed to start QR scanning:', error);
    throw error;
  }

  return state;
}

/**
 * Stop QR scanning and clean up resources.
 */
export function stopQRScanning(state: QRScannerState): void {
  state.isScanning = false;

  if (state.stream) {
    state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
  }

  if (state.video) {
    state.video.srcObject = null;
  }
}

/**
 * Process a video frame for QR codes.
 * Uses jsQR library if available, otherwise provides fallback simulation.
 */
function processQRFrame(imageData: ImageData): QRScanResult | null {
  // If jsQR is available, use it for real QR detection
  if (jsQR) {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        // Parse QR data as JSON
        const data = JSON.parse(code.data);
        if (data.x !== undefined && data.y !== undefined && data.floor !== undefined && data.id) {
          return {
            position: {
              x: data.x,
              y: data.y,
              floor: data.floor,
              id: data.id
            },
            timestamp: Date.now(),
            confidence: 0.95
          };
        }
      }
    } catch (error) {
      // Invalid QR data or parsing error
      console.warn('QR scan failed:', error);
    }
  } else {
    // Fallback: Simulate QR detection for testing (remove in production)
    // In production, you would either install jsQR or implement a different QR library
    if (Math.random() < 0.005) { // Very low chance to simulate occasional detection
      // Return a mock QR result for testing - replace with real implementation
      console.log('Mock QR detection (jsQR not installed)');
      return {
        position: {
          x: 270 + Math.random() * 100, // Random position near NW corner
          y: 175 + Math.random() * 100,
          floor: 0,
          id: 'g-qr-nw'
        },
        timestamp: Date.now(),
        confidence: 0.8
      };
    }
  }

  return null;
}

/**
 * Parse QR code data into position.
 * Expected QR format: "SRIX:{x},{y},{floor},{id}"
 */
export function parseQRData(qrText: string): QRPosition | null {
  try {
    if (!qrText.startsWith('SRIX:')) return null;

    const parts = qrText.substring(5).split(',');
    if (parts.length !== 4) return null;

    const [xStr, yStr, floorStr, id] = parts;
    const x = parseFloat(xStr);
    const y = parseFloat(yStr);
    const floor = parseInt(floorStr);

    if (isNaN(x) || isNaN(y) || isNaN(floor)) return null;

    return { x, y, floor, id };
  } catch {
    return null;
  }
}

/**
 * Generate QR code data for a position.
 */
export function generateQRData(position: QRPosition): string {
  return `SRIX:${position.x},${position.y},${position.floor},${position.id}`;
}