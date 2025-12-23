'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  Fingerprint, Camera, RotateCcw, Check, AlertCircle, CheckCircle,
  Shield, Loader2, ArrowRight
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function EnrollBiometricPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facialEmbedding, setFacialEmbedding] = useState<number[] | null>(null);
  const [capturingBiometric, setCapturingBiometric] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const captureFacialData = useCallback(async () => {
    if (!webcamRef.current) return;

    setCapturingBiometric(true);
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) {
      toast.error('Failed to capture image. Please try again.');
      setCapturingBiometric(false);
      return;
    }

    setCapturedImage(imageSrc);

    // Generate facial embedding
    try {
      const res = await fetch('/api/biometric/facial-embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setFacialEmbedding(data.embedding);
      toast.success('Facial data captured successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process facial data');
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
        const { error } = await supabase.auth.updateUser({
          data: { biometricEnrolled: true }
        });
        if (error) {
          console.warn('Enrollment: Local Supabase metadata update failed', error);
        } else {
          console.log('Enrollment: Local metadata updated, refreshing session...');
          // Force session refresh to pick up new metadata
          await supabase.auth.refreshSession();
        }
      } catch (updateError) {
        console.warn('Enrollment: Local Supabase metadata update failed', updateError);
      }

      toast.success('Biometric enrollment successful! Redirecting to dashboard...');

      // Use window.location.href to force a full reload and cookie/middleware re-check
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

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
          <div className="glass-card p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-brand-500 p-3 rounded-xl">
                  <Fingerprint size={32} className="text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-surface-950">Complete Your Enrollment</h1>
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

            {/* Biometric Capture */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-surface-950 mb-2">Facial Recognition Enrollment</h2>
                <p className="text-surface-500 text-sm">Position your face in the camera for capture</p>
              </div>

              <div className="bg-surface-50 rounded-xl p-6">
                <div className="max-w-md mx-auto">
                  <div className="relative aspect-square bg-surface-900 rounded-xl overflow-hidden">
                    {!capturedImage ? (
                      <>
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          screenshotFormat="image/jpeg"
                          className="w-full h-full object-cover"
                          onUserMedia={() => setCameraReady(true)}
                          videoConstraints={{
                            width: 640,
                            height: 640,
                            facingMode: 'user',
                          }}
                        />
                        {!cameraReady && (
                          <div className="absolute inset-0 flex items-center justify-center bg-surface-900">
                            <Loader2 className="animate-spin text-white" size={32} />
                          </div>
                        )}
                      </>
                    ) : (
                      <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                    )}
                  </div>

                  <div className="mt-4 flex gap-3 justify-center">
                    {!capturedImage ? (
                      <button
                        type="button"
                        onClick={captureFacialData}
                        disabled={!cameraReady || capturingBiometric}
                        className="btn-primary"
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
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
