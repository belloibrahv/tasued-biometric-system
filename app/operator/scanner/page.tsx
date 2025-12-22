'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { QrCode, Camera, CheckCircle, XCircle, User, RefreshCw, Loader2, Shield } from 'lucide-react';

export default function QRScannerPage() {
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [facialImage, setFacialImage] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const webcamRef = useRef<any>(null);

  const verifyQRCode = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/operator/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, facialImage }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'Network error' });
    } finally {
      setLoading(false);
      setManualCode('');
    }
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      setCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setFacialImage(imageSrc);
        setShowCamera(false);
      }
      setCapturing(false);
    }
  }, []);

  const reset = () => {
    setResult(null);
    setManualCode('');
    setFacialImage(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">QR Scanner</h1>
        <p className="text-gray-500 mt-1">Verify student identity</p>
      </div>

      {/* Scanner Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && verifyQRCode(manualCode)}
            placeholder="Enter or scan QR code..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
          />
        </div>

        {/* Facial capture */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Facial Verification (Optional)</label>
          
          {facialImage ? (
            <div className="relative">
              <img src={facialImage} alt="Captured" className="w-full h-48 object-cover rounded-lg" />
              <button
                onClick={() => setFacialImage(null)}
                className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-100"
              >
                <XCircle size={18} className="text-gray-500" />
              </button>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                <CheckCircle size={12} /> Captured
              </div>
            </div>
          ) : showCamera ? (
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
                  onClick={captureImage}
                  disabled={capturing}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={18} /> Capture
                </button>
                <button
                  onClick={() => setShowCamera(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCamera(true)}
              className="w-full py-3 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={18} /> Enable Camera
            </button>
          )}
        </div>

        {/* Verify button */}
        <button
          onClick={() => verifyQRCode(manualCode)}
          disabled={loading || !manualCode.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <QrCode size={20} /> Verify
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`bg-white rounded-xl border overflow-hidden ${
          result.success ? 'border-green-200' : 'border-red-200'
        }`}>
          <div className={`px-4 py-3 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <XCircle size={20} className="text-red-600" />
              )}
              <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Verified' : 'Failed'}
              </span>
            </div>
          </div>

          {result.student && (
            <div className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-lg">
                    {result.student.firstName?.[0]}{result.student.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {result.student.firstName} {result.student.lastName}
                  </p>
                  <p className="text-sm text-gray-500 font-mono">{result.student.matricNumber}</p>
                  <p className="text-sm text-gray-500">
                    {result.student.department} • {result.student.level} Level
                  </p>
                </div>
              </div>

              {result.biometricResult && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Biometric Match</p>
                  <p className="text-sm text-blue-600">Score: {result.biometricResult.matchScore}%</p>
                </div>
              )}
            </div>
          )}

          {!result.success && result.message && (
            <div className="p-4">
              <p className="text-sm text-red-600">{result.message}</p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={reset}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}