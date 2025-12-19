'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Camera, CheckCircle, XCircle, User, RefreshCw,
  Loader2, Volume2, VolumeX, Shield
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulated QR scan (in production, use a QR scanning library)
  const startScanning = async () => {
    setScanning(true);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      toast.error('Could not access camera');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const verifyQRCode = async (code: string) => {
    if (!code.trim()) {
      toast.error('Please enter a QR code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/operator/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      setResult({
        success: res.ok,
        student: data.student,
        message: data.message || (res.ok ? 'Verification successful' : 'Invalid QR code'),
      });

      if (res.ok) {
        toast.success('Student verified!');
        if (soundEnabled) {
          // Play success sound
          const audio = new Audio('/sounds/success.mp3');
          audio.play().catch(() => {});
        }
      } else {
        toast.error(data.error || 'Verification failed');
        if (soundEnabled) {
          const audio = new Audio('/sounds/error.mp3');
          audio.play().catch(() => {});
        }
      }
    } catch (error) {
      toast.error('Verification failed');
      setResult({
        success: false,
        message: 'Network error occurred',
      });
    } finally {
      setLoading(false);
      setManualCode('');
    }
  };

  const resetScanner = () => {
    setResult(null);
    setManualCode('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-950">QR Code Scanner</h1>
          <p className="text-surface-500 mt-1">Scan student QR codes for quick verification</p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-3 rounded-xl bg-surface-100 hover:bg-surface-200 transition-colors"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Area */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-surface-900 mb-4">Camera Scanner</h3>
          
          <div className="aspect-square bg-surface-900 rounded-xl overflow-hidden relative">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-brand-500 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-400 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-400 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-400 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-400 rounded-br-xl" />
                    <div className="scanner-overlay" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <QrCode size={64} className="mx-auto text-surface-600 mb-4" />
                  <p className="text-surface-400">Camera preview</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            {scanning ? (
              <button onClick={stopScanning} className="btn-outline flex-1">
                Stop Scanning
              </button>
            ) : (
              <button onClick={startScanning} className="btn-primary flex-1">
                <Camera size={18} className="mr-2" />
                Start Camera
              </button>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-bold text-surface-900 mb-4">Manual Entry</h3>
            <p className="text-sm text-surface-500 mb-4">
              Enter the QR code manually if camera scanning is not available
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verifyQRCode(manualCode)}
                placeholder="Enter QR code (e.g., BIOVAULT-CSC/2020/001-...)"
                className="input-field font-mono text-sm"
              />
              <button
                onClick={() => verifyQRCode(manualCode)}
                disabled={loading || !manualCode.trim()}
                className="btn-primary w-full"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
              </button>
            </div>
          </div>

          {/* Result Display */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`glass-card overflow-hidden ${
                  result.success ? 'border-2 border-success-500' : 'border-2 border-error-500'
                }`}
              >
                <div className={`p-4 ${result.success ? 'bg-success-500' : 'bg-error-500'} text-white`}>
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle size={24} />
                    ) : (
                      <XCircle size={24} />
                    )}
                    <span className="font-bold">
                      {result.success ? 'Verification Successful' : 'Verification Failed'}
                    </span>
                  </div>
                </div>

                {result.student && (
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
                        <User size={32} className="text-brand-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-surface-900">
                          {result.student.firstName} {result.student.lastName}
                        </h4>
                        <p className="text-surface-500 font-mono">{result.student.matricNumber}</p>
                        <p className="text-sm text-surface-400">
                          {result.student.department} • {result.student.level} Level
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!result.success && (
                  <div className="p-6">
                    <p className="text-error-600">{result.message}</p>
                  </div>
                )}

                <div className="p-4 border-t border-surface-100">
                  <button onClick={resetScanner} className="btn-outline w-full">
                    <RefreshCw size={18} className="mr-2" />
                    Scan Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
