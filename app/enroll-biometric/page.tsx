'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  Fingerprint, Camera, RotateCcw, Check, AlertCircle, CheckCircle,
  Shield, Loader2, ArrowRight, Home, HelpCircle, RefreshCw
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function EnrollBiometricPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facialEmbedding, setFacialEmbedding] = useState<number[] | null>(null);
  const [capturingBiometric, setCapturingBiometric] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [showCamera, setShowCamera] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check camera permission on mount
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraPermission('denied');
          setCameraError('Camera not supported on this device/browser');
          return;
        }

        // Try to get permission status
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
            if (result.state === 'granted') {
              setCameraPermission('granted');
              setShowCamera(true);
            } else if (result.state === 'denied') {
              setCameraPermission('denied');
            } else {
              setCameraPermission('prompt');
            }
          } catch {
            // Permission query not supported, show camera anyway
            setCameraPermission('prompt');
          }
        } else {
          setCameraPermission('prompt');
        }
      } catch (err) {
        console.error('Permission check error:', err);
        setCameraPermission('prompt');
      }
    };

    checkCameraPermission();
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setShowCamera(true);
    setCameraPermission('checking');
    
    // Give the webcam component time to initialize
    setTimeout(() => {
      if (!cameraReady) {
        // If camera still not ready after 5 seconds, show error
        setTimeout(() => {
          if (!cameraReady && cameraPermission === 'checking') {
            setCameraError('Camera is taking too long to start. Please refresh the page.');
          }
        }, 5000);
      }
    }, 100);
  }, [cameraReady, cameraPermission]);

  const handleCameraReady = useCallback(() => {
    console.log('Camera ready!');
    setCameraReady(true);
    setCameraError(null);
    setCameraPermission('granted');
    toast.success('Camera ready! Position your face in the frame.');
  }, []);

  const handleCameraError = useCallback((err: any) => {
    console.error('Camera error:', err);
    setCameraReady(false);
    
    let errorMessage = 'Unable to access camera';
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      setCameraPermission('denied');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage = 'No camera found. Please connect a camera and try again.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMessage = 'Camera is in use by another application. Please close other apps using the camera.';
    } else if (err.name === 'OverconstrainedError') {
      errorMessage = 'Camera does not meet requirements. Trying with different settings...';
    } else {
      errorMessage = `Camera error: ${err.message || err.name || 'Unknown error'}`;
    }
    
    setCameraError(errorMessage);
  }, []);

  const retryCamera = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setCameraError(null);
    setCameraReady(false);
    setShowCamera(false);
    
    setTimeout(() => {
      setShowCamera(true);
    }, 500);
  }, []);

  const captureFacialData = useCallback(async () => {
    if (!webcamRef.current) {
      toast.error('Camera is not ready. Please ensure camera permissions are granted and try again.');
      return;
    }

    setCapturingBiometric(true);
    toast.info('Capturing image, please hold still...');
    
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      toast.error('Failed to capture image. Please ensure camera permissions are granted and try again.');
      setCapturingBiometric(false);
      return;
    }

    setCapturedImage(imageSrc);

    // Generate facial embedding
    try {
      toast.info('Processing facial data, this may take a moment...');
      const res = await fetch('/api/biometric/facial-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.error || data.message || 'Failed to process facial data';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      setFacialEmbedding(data.embedding);
      toast.success('Facial data captured and processed successfully!');
    } catch (error: any) {
      console.error('Capture error:', error);
      toast.error(error.message || 'Failed to process facial data. Please try again with good lighting and a clear face.');
      setCapturedImage(null);
    } finally {
      setCapturingBiometric(false);
    }
  }, []);

  const retakeFacialData = () => {
    setCapturedImage(null);
    setFacialEmbedding(null);
  };

  const handleSubmit = async () => {
    if (!facialEmbedding) {
      toast.error('Please capture your facial data');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/biometric/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Don't send cookies directly, let the middleware handle authentication
        },
        credentials: 'include', // Include credentials (cookies) in the request
        body: JSON.stringify({
          facialTemplate: facialEmbedding,  // Don't stringify the embedding, it's already an array of numbers
          facialPhoto: capturedImage,
        }),
      });

      // Check if the response has content
      const contentLength = response.headers.get('content-length');
      if (response.status === 204 || (contentLength && contentLength === '0')) {
        throw new Error('No content returned from server');
      }

      // Check if response is OK first
      if (!response.ok) {
        let errorMessage = 'Biometric enrollment failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If JSON parsing fails, get text response
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            // If both fail, use default message
            console.error('Could not parse error response:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      // Parse the successful response
      const data = await response.json();

      // Update metadata on client side as a fallback/reinforcement
      // This ensures the current session is immediately updated
      console.log('Enrollment: Updating local Supabase Auth metadata...');
      try {
        // First update the user metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: { biometricEnrolled: true }
        });
        
        if (updateError) {
          console.warn('Enrollment: Local Supabase metadata update failed', updateError);
        } else {
          console.log('Enrollment: Local metadata updated successfully');
        }

        // Force a complete session refresh to get new JWT with updated metadata
        console.log('Enrollment: Refreshing session to get updated token...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.warn('Enrollment: Session refresh failed', refreshError);
        } else {
          console.log('Enrollment: Session refreshed successfully', refreshData?.user?.user_metadata);
        }
      } catch (updateError) {
        console.warn('Enrollment: Local Supabase metadata update failed', updateError);
      }

      toast.success('Biometric enrollment successful! Redirecting to dashboard...');

      // Wait for the enrollment to propagate, then verify before redirecting
      // This prevents the redirect loop by ensuring the system recognizes the enrollment
      const verifyEnrollment = async (attempts = 0): Promise<boolean> => {
        if (attempts >= 5) return false;
        
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.user?.biometricEnrolled === true) {
              return true;
            }
          }
        } catch (e) {
          console.warn('Enrollment verification attempt failed:', e);
        }
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return verifyEnrollment(attempts + 1);
      };

      // Verify enrollment is recognized before redirecting
      const verified = await verifyEnrollment();
      
      if (verified) {
        // Use window.location.href to force a full reload and cookie/middleware re-check
        window.location.href = '/dashboard';
      } else {
        // If verification failed after retries, still try to redirect
        // The middleware will now check the database directly
        console.warn('Enrollment verification timed out, redirecting anyway...');
        window.location.href = '/dashboard';
      }

    } catch (error: any) {
      toast.error(error.message || 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="glass-card p-6 sm:p-8">
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2 text-surface-500 hover:text-surface-700 transition-colors">
                <Home size={18} />
                <span className="text-sm">Home</span>
              </Link>
              <a 
                href="https://support.google.com/chrome/answer/2693767" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-brand-500 hover:text-brand-600 transition-colors"
              >
                <HelpCircle size={18} />
                <span className="text-sm">Camera Help</span>
              </a>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-brand-500 p-3 rounded-xl">
                  <Fingerprint size={32} className="text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-surface-950">Complete Your Enrollment</h1>
                  <p className="text-sm text-surface-500">Biometric verification required</p>
                </div>
              </div>
            </div>

            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="text-warning-500 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-warning-700">
                <p className="font-semibold mb-1">Action Required</p>
                <p>You need to enroll your biometric data to access the dashboard and all services.</p>
              </div>
            </div>

            {/* Camera Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-2">📸 Tips for best results:</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensure good lighting on your face</li>
                <li>• Look directly at the camera</li>
                <li>• Remove glasses if possible</li>
                <li>• Keep a neutral expression</li>
              </ul>
            </div>

            {/* Biometric Capture */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-surface-950 mb-2">Facial Recognition Enrollment</h2>
                <p className="text-surface-500 text-sm">Position your face in the camera for capture</p>
              </div>

              <div className="bg-surface-50 rounded-xl p-4 sm:p-6">
                <div className="max-w-md mx-auto">
                  <div className="relative aspect-square bg-surface-900 rounded-xl overflow-hidden">
                    {!capturedImage ? (
                      <>
                        {showCamera && cameraPermission !== 'denied' ? (
                          <Webcam
                            key={retryCount}
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            screenshotQuality={0.8}
                            className="w-full h-full object-cover"
                            onUserMedia={handleCameraReady}
                            onUserMediaError={handleCameraError}
                            videoConstraints={{
                              width: { ideal: 640, min: 320 },
                              height: { ideal: 640, min: 320 },
                              facingMode: 'user',
                            }}
                            forceScreenshotSourceSize={false}
                          />
                        ) : null}
                        
                        {/* Loading state */}
                        {showCamera && !cameraReady && cameraPermission !== 'denied' && !cameraError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900">
                            <Loader2 className="animate-spin text-white mb-3" size={32} />
                            <p className="text-white text-sm">Starting camera...</p>
                          </div>
                        )}
                        
                        {/* Permission prompt */}
                        {!showCamera && cameraPermission !== 'denied' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900 p-4 text-center">
                            <Camera className="text-blue-400 mb-4" size={48} />
                            <p className="text-white text-lg font-semibold mb-2">Camera Access Required</p>
                            <p className="text-gray-300 text-sm mb-4">We need camera access to capture your facial data for enrollment.</p>
                            <button 
                              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                              onClick={startCamera}
                            >
                              Enable Camera
                            </button>
                          </div>
                        )}
                        
                        {/* Permission denied */}
                        {cameraPermission === 'denied' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900 p-4 text-center">
                            <AlertCircle className="text-red-400 mb-4" size={48} />
                            <p className="text-white text-lg font-semibold mb-2">Camera Access Denied</p>
                            <p className="text-gray-300 text-sm mb-4">
                              Please allow camera access in your browser settings to continue.
                            </p>
                            <div className="space-y-2">
                              <button 
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                onClick={() => window.location.reload()}
                              >
                                <RefreshCw size={16} className="inline mr-2" />
                                Refresh Page
                              </button>
                              <a 
                                href="https://support.google.com/chrome/answer/2693767"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full px-6 py-3 bg-surface-700 text-white rounded-xl font-semibold hover:bg-surface-600 transition-colors text-center"
                              >
                                How to Enable Camera
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {/* Camera error */}
                        {cameraError && cameraPermission !== 'denied' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900 p-4 text-center">
                            <AlertCircle className="text-yellow-400 mb-4" size={48} />
                            <p className="text-white text-lg font-semibold mb-2">Camera Issue</p>
                            <p className="text-gray-300 text-sm mb-4">{cameraError}</p>
                            <button 
                              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                              onClick={retryCamera}
                            >
                              <RefreshCw size={16} className="inline mr-2" />
                              Try Again
                            </button>
                          </div>
                        )}
                        
                        {/* Face guide overlay when camera is ready */}
                        {cameraReady && !capturedImage && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-48 h-48 sm:w-64 sm:h-64 border-4 border-dashed border-white/50 rounded-full"></div>
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                              <p className="text-white text-sm bg-black/50 inline-block px-3 py-1 rounded-full">
                                Position your face in the circle
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    {!capturedImage ? (
                      <>
                        <button
                          type="button"
                          onClick={captureFacialData}
                          disabled={!cameraReady || capturingBiometric}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {capturingBiometric ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={16} />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Camera size={16} className="mr-2" />
                              Capture Face
                            </>
                          )}
                        </button>
                        {cameraReady && !capturingBiometric && (
                          <button
                            type="button"
                            onClick={retryCamera}
                            className="btn-outline"
                          >
                            <RotateCcw size={16} className="mr-2" />
                            Reset Camera
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={retakeFacialData} className="btn-outline">
                          <RotateCcw size={16} className="mr-2" />
                          Retake
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={loading}
                          className="btn-primary"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin mr-2" size={16} />
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <Check size={16} className="mr-2" />
                              Complete Enrollment
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>

                  {facialEmbedding && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-success-50 border border-success-200 rounded-xl flex items-center gap-3"
                    >
                      <CheckCircle className="text-success-500" size={20} />
                      <div>
                        <p className="text-sm font-semibold text-success-700">Facial Data Captured</p>
                        <p className="text-xs text-success-600">Your biometric template has been securely generated</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="bg-info-50 border border-info-200 rounded-xl p-4 flex items-start gap-3">
                <Shield className="text-info-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-info-700">
                  <p className="font-semibold mb-1">Your data is secure</p>
                  <p>Biometric data is encrypted using AES-256. Only the template is stored, never the raw image.</p>
                </div>
              </div>

              {/* Alternative options */}
              <div className="border-t border-surface-200 pt-6 mt-6">
                <p className="text-sm text-surface-500 text-center mb-4">
                  Having trouble with the camera?
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-surface-600 hover:text-surface-800 hover:bg-surface-100 rounded-lg transition-colors"
                  >
                    <Home size={16} />
                    Return to Home
                  </Link>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <RefreshCw size={16} />
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
