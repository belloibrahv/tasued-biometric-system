'use client';

import { useState, useRef, useEffect } from 'react';
import {
  QrCode, Camera, CheckCircle, XCircle, User, RefreshCw,
  Loader2, Fingerprint, Camera as CameraIcon
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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

      if (data.success) {
        setResult({
          success: true,
          student: data.student,
          biometricStatus: data.biometricStatus,
          service: data.service,
          verification: data.verification,
          message: data.message,
        });
        toast.success('Student verified!');
      } else {
        setResult({
          success: false,
          message: data.message || data.error,
        });
        toast.error(data.message || data.error || 'Verification failed');
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">QR Code Scanner</h1>
            <p className="text-gray-600 mt-1">Verify student identity with QR codes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Camera Scanner</h3>

          <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden relative">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-blue-500 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-xl" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <CameraIcon size={64} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-400">Camera preview</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            {scanning ? (
              <button 
                onClick={stopScanning} 
                className="btn-outline flex-1 py-3"
              >
                Stop Scanning
              </button>
            ) : (
              <button 
                onClick={startScanning} 
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                Start Camera
              </button>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Manual Entry</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the QR code manually if camera scanning is not available
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && verifyQRCode(manualCode)}
                placeholder="Enter QR code (e.g., BIOVAULT-CSC/2020/001-...)"
                className="input-field font-mono text-sm w-full p-3 border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => verifyQRCode(manualCode)}
                disabled={loading || !manualCode.trim()}
                className="btn-primary w-full py-3"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Verify Code'}
              </button>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <div className={`bg-white rounded-2xl shadow-sm border ${
              result.success ? 'border-green-500' : 'border-red-500'
            } overflow-hidden`}>
              <div className={`p-4 ${
                result.success ? 'bg-green-500' : 'bg-red-500'
              } text-white`}>
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
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <User size={32} className="text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {result.student.firstName} {result.student.lastName}
                      </h4>
                      <p className="text-gray-600 font-mono">{result.student.matricNumber}</p>
                      <p className="text-sm text-gray-500">
                        {result.student.department} • {result.student.level} Level
                      </p>
                      {result.biometricStatus && (
                        <div className="flex gap-2 mt-2">
                          {result.biometricStatus.facialEnrolled && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                              <CameraIcon size={12} /> Face
                            </span>
                          )}
                          {result.biometricStatus.fingerprintEnrolled && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                              <Fingerprint size={12} /> Fingerprint
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!result.success && (
                <div className="p-6">
                  <p className="text-red-600">{result.message}</p>
                </div>
              )}

              {result.success && result.verification && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <p>Verified at: {new Date(result.verification.timestamp).toLocaleString()}</p>
                    <p>Location: {result.service?.name}</p>
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-gray-200">
                <button 
                  onClick={resetScanner} 
                  className="btn-outline w-full py-3 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}