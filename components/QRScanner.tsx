'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  width?: number;
  height?: number;
}

export default function QRScanner({ onScan, onError, width = 300, height = 300 }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerId = 'qr-scanner-container';

  useEffect(() => {
    // Get available cameras on mount
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera on mobile
          const backCamera = devices.find(
            (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        } else {
          setError('No cameras found on this device');
        }
      })
      .catch((err) => {
        setError('Failed to access cameras. Please grant camera permission.');
        onError?.('Camera access denied');
      });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // Clean up any existing scanner
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      }

      scannerRef.current = new Html5Qrcode(scannerId);

      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: Math.min(width - 50, 250), height: Math.min(height - 50, 250) },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Successfully scanned
          onScan(decodedText);
          // Optional: stop after successful scan
          // stopScanning();
        },
        (errorMessage) => {
          // Ignore continuous scanning errors (no QR found)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      setError(err.message || 'Failed to start scanner');
      onError?.(err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
    setIsScanning(false);
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    
    const currentIndex = cameras.findIndex((c) => c.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex].id;
    
    if (isScanning) {
      await stopScanning();
      setSelectedCamera(nextCamera);
      // Small delay before restarting
      setTimeout(() => {
        startScanning();
      }, 100);
    } else {
      setSelectedCamera(nextCamera);
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner viewport */}
      <div
        ref={containerRef}
        className="relative bg-gray-900 rounded-xl overflow-hidden"
        style={{ width, height }}
      >
        <div id={scannerId} className="w-full h-full" />
        
        {!isScanning && !isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <Camera size={48} className="text-gray-400 mb-3" />
            <p className="text-sm text-gray-400">Camera not active</p>
          </div>
        )}

        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white">
            <Loader2 size={32} className="animate-spin text-blue-400 mb-2" />
            <p className="text-sm">Starting camera...</p>
          </div>
        )}

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 border-2 border-blue-500/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br" />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isScanning ? (
          <button
            onClick={startScanning}
            disabled={isInitializing || !selectedCamera}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInitializing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Camera size={18} />
                Start Scanner
              </>
            )}
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <CameraOff size={18} />
            Stop Scanner
          </button>
        )}

        {cameras.length > 1 && (
          <button
            onClick={switchCamera}
            disabled={isInitializing}
            className="px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            title="Switch camera"
          >
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      {/* Camera selector */}
      {cameras.length > 1 && (
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          disabled={isScanning}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label || `Camera ${camera.id}`}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
