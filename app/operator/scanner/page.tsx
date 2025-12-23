'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Webcam from 'react-webcam';
import { QrCode, Camera, CheckCircle, XCircle, RefreshCw, Loader2, Shield, User, Keyboard, ScanLine } from 'lucide-react';

// Dynamically import QR scanner to avoid SSR issues
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

type ScanMode = 'camera' | 'manual';

export default function QRScannerPage() {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showFacialCapture, setShowFacialCapture] = useState(false);
  const [facialImage, setFacialImage] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const webcamRef = useRef<any>(null);

  // Auto-clear result after 30 seconds
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        reset();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const verifyQRCode = async (code: string) => {
    if (!code.trim() || loading) return;
    
    // Prevent duplicate scans of the same code
    if (code === lastScannedCode && result?.success) return;
    
    setLoading(true);
    setResult(null);
    setLastScannedCode(code);

    try {
      const res = await fetch('/api/operator/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, facialImage }),
      });
      const data = await res.json();
      setResult(data);
      
      // Play sound feedback
      if (data.success) {
        playSuccessSound();
      } else {
        playErrorSound();
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' });
      playErrorSound();
    } finally {
      setLoading(false);
      setManualCode('');
    }
  };

  const handleQRScan = (code: string) => {
    verifyQRCode(code);
  };

  const captureFacialImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setFacialImage(imageSrc);
        setShowFacialCapture(false);
      }
    }
  }, []);

  const reset = () => {
    setResult(null);
    setManualCode('');
    setFacialImage(null);
    setLastScannedCode(null);
  };

  const playSuccessSound = () => {
    try {
      const audio = new Audio('/sounds/success.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };

  const playErrorSound = () => {
    try {
      const audio = new Audio('/sounds/error.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">QR Scanner</h1>
        <p className="text-gray-500 mt-1">Scan student QR codes to verify identity</p>
      </div>

      {/* Mode Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-1 flex">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
            mode === 'camera'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ScanLine size={18} />
          Camera Scan
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Keyboard size={18} />
          Manual Entry
        </button>
      </div>

      {/* Scanner Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {mode === 'camera' ? (
          <div className="flex flex-col items-center">
            <QRScanner
              onScan={handleQRScan}
              onError={(err) => console.error('Scanner error:', err)}
              width={320}
              height={320}
            />
            <p className="text-sm text-gray-500 mt-3 text-center">
              Position the QR code within the frame to scan
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyQRCode(manualCode)}
              placeholder="Enter or paste QR code..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              autoFocus
            />
            <button
              onClick={() => verifyQRCode(manualCode)}
              disabled={loading || !manualCode.trim()}
              className="w-full mt-3 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <QrCode size={20} /> Verify Code
                </>
              )}
            </button>
          </div>
        )}

        {/* Facial Verification Option */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Facial Verification</label>
            <span className="text-xs text-gray-400">Optional</span>
          </div>
          
          {facialImage ? (
            <div className="relative">
              <img src={facialImage} alt="Captured" className="w-full h-40 object-cover rounded-lg" />
              <button
                onClick={() => setFacialImage(null)}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-100"
              >
                <XCircle size={18} className="text-gray-500" />
              </button>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                <CheckCircle size={12} /> Ready for verification
              </div>
            </div>
          ) : showFacialCapture ? (
            <div className="space-y-3">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: 'user' }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={captureFacialImage}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={18} /> Capture
                </button>
                <button
                  onClick={() => setShowFacialCapture(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowFacialCapture(true)}
              className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={18} /> Add Facial Verification
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 size={24} className="animate-spin text-blue-600" />
          <div>
            <p className="font-medium text-blue-800">Verifying...</p>
            <p className="text-sm text-blue-600">Please wait while we verify the QR code</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className={`bg-white rounded-xl border-2 overflow-hidden ${
          result.success ? 'border-green-300' : 'border-red-300'
        }`}>
          <div className={`px-4 py-3 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle size={24} className="text-green-600" />
              ) : (
                <XCircle size={24} className="text-red-600" />
              )}
              <div>
                <span className={`font-semibold text-lg ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Verified Successfully' : 'Verification Failed'}
                </span>
                {result.verification?.timestamp && (
                  <p className="text-xs text-gray-500">
                    {new Date(result.verification.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {result.student && (
            <div className="p-5">
              <div className="flex items-start gap-4">
                {result.student.profilePhoto ? (
                  <img
                    src={result.student.profilePhoto}
                    alt={result.student.firstName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {result.student.firstName?.[0]}{result.student.lastName?.[0]}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {result.student.firstName} {result.student.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">{result.student.matricNumber}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {result.student.department}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      Level {result.student.level}
                    </span>
                    {result.student.biometricEnrolled && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Shield size={10} /> Biometric Enrolled
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Biometric Result */}
              {result.biometricResult && (
                <div className={`mt-4 p-3 rounded-lg ${
                  result.biometricResult.verified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${result.biometricResult.verified ? 'text-green-800' : 'text-yellow-800'}`}>
                        Facial Match: {result.biometricResult.verified ? 'Confirmed' : 'Not Verified'}
                      </p>
                      <p className={`text-xs ${result.biometricResult.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                        Match Score: {result.biometricResult.matchScore}%
                      </p>
                    </div>
                    {result.biometricResult.verified ? (
                      <CheckCircle size={24} className="text-green-500" />
                    ) : (
                      <Shield size={24} className="text-yellow-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Biometric Status */}
              {result.biometricStatus && (
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded ${result.biometricStatus.facialEnrolled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    Facial: {result.biometricStatus.facialEnrolled ? 'Enrolled' : 'Not Enrolled'}
                  </div>
                  <div className={`p-2 rounded ${result.biometricStatus.fingerprintEnrolled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    Fingerprint: {result.biometricStatus.fingerprintEnrolled ? 'Enrolled' : 'Not Enrolled'}
                  </div>
                </div>
              )}
            </div>
          )}

          {!result.success && result.message && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-sm text-red-600">{result.message}</p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={reset}
              className="w-full py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Scan Next Student
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">Quick Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Hold the QR code steady within the scanning frame</li>
          <li>• Ensure good lighting for better scan accuracy</li>
          <li>• Add facial verification for enhanced security</li>
          <li>• Results auto-clear after 30 seconds</li>
        </ul>
      </div>
    </div>
  );
}
