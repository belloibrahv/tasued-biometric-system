'use client';

import { useState, useRef, useEffect } from 'react';
import { Webcam } from 'react-webcam';
import {
  QrCode, Camera, CheckCircle, XCircle, User, RefreshCw,
  Loader2, Fingerprint, Camera as CameraIcon, Eye,
  AlertTriangle, Shield
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cameraForBiometric, setCameraForBiometric] = useState(false);
  const [capturingBiometric, setCapturingBiometric] = useState(false);
  const [facialImage, setFacialImage] = useState<string | null>(null);
  const webcamRef = useRef<any>(null);

  // Verify QR code with optional facial verification
  const verifyQRCode = async (code: string) => {
    if (!code.trim()) {
      toast.error('Please enter a QR code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const requestBody: any = { code };
      if (facialImage) {
        requestBody.facialImage = facialImage;
      }

      const res = await fetch('/api/operator/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          student: data.student,
          biometricStatus: data.biometricStatus,
          biometricResult: data.biometricResult,
          service: data.service,
          verification: data.verification,
          message: data.message,
        });
        toast.success(data.message || 'Student verified!');
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

  const captureFacialImage = useCallback(async () => {
    if (webcamRef.current) {
      setCapturingBiometric(true);
      const imageSrc = webcamRef.current.getScreenshot();

      if (imageSrc) {
        setFacialImage(imageSrc);
        toast.success('Facial image captured successfully!');
      } else {
        toast.error('Failed to capture facial image');
      }
      setCapturingBiometric(false);
    }
  }, [webcamRef]);

  const resetScanner = () => {
    setResult(null);
    setManualCode('');
    setFacialImage(null);
  };

  const resetFacialCapture = () => {
    setFacialImage(null);
    setCameraForBiometric(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Advanced Biometric Scanner</h1>
            <p className="text-gray-600 mt-1">Verify student identity with QR codes and facial recognition</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">QR Code Scanner</h3>

          <div className="space-y-4">
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
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Verify QR Code'}
              </button>
            </div>

            <div className="relative pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Facial Verification</h4>

              {facialImage ? (
                <div className="relative">
                  <img
                    src={facialImage}
                    alt="Captured facial image"
                    className="w-full h-48 object-cover rounded-lg border-2 border-green-500"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <CheckCircle size={16} />
                  </div>
                  <div className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1">
                    <Shield size={12} /> Verified
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {!cameraForBiometric ? (
                    <button
                      onClick={() => setCameraForBiometric(true)}
                      className="w-full btn-outline py-2 flex items-center justify-center gap-2"
                    >
                      <CameraIcon size={16} />
                      Enable Camera for Facial Capture
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{ facingMode: 'user' }}
                          className="w-full h-full object-cover"
                        />
                        {capturingBiometric && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="animate-spin text-white" size={32} />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={captureFacialImage}
                          disabled={capturingBiometric}
                          className="flex-1 btn-primary py-2 flex items-center justify-center gap-2"
                        >
                          <Camera size={16} />
                          Capture
                        </button>
                        <button
                          onClick={() => setCameraForBiometric(false)}
                          className="flex-1 btn-outline py-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="space-y-6">
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

                  {result.biometricResult && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye size={16} className="text-blue-600" />
                        <span className="font-medium text-blue-800">Biometric Verification</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <p>Match: {result.biometricResult.matchScore}%</p>
                        <p>Confidence: {result.biometricResult.confidence}%</p>
                        <p className={`font-medium ${
                          result.biometricResult.verified ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.biometricResult.verified ? '✓ Verified' : '✗ Verification Failed'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!result.success && (
                <div className="p-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-600">{result.message}</p>
                  </div>
                </div>
              )}

              {result.success && result.verification && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="text-xs text-gray-600">
                    <p>Method: {result.verification.method}</p>
                    <p>Verified at: {new Date(result.verification.timestamp).toLocaleString()}</p>
                    <p>Location: {result.service?.name}</p>
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={resetScanner}
                    className="btn-outline flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Scan Another
                  </button>
                  {facialImage && (
                    <button
                      onClick={resetFacialCapture}
                      className="btn-outline py-3 flex items-center justify-center gap-2"
                    >
                      <Camera size={16} />
                      New Capture
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Biometric Status Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Verification Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">QR Code:</span>
                <span className="font-medium text-gray-900">
                  {result?.student ? '✓ Verified' : result === null ? 'Pending' : '✗ Failed'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Facial Verification:</span>
                <span className={`font-medium ${
                  facialImage ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {facialImage ? '✓ Captured' : 'Not captured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Overall Status:</span>
                <span className={`font-medium ${
                  result?.biometricResult?.verified ? 'text-green-600' :
                  result?.success && !result.biometricResult?.verified ? 'text-yellow-600' :
                  'text-gray-500'
                }`}>
                  {result?.biometricResult?.verified ? 'Fully Verified' :
                   result?.success && !result.biometricResult?.verified ? 'QR Only' :
                   result === null ? 'Pending' : 'Failed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}