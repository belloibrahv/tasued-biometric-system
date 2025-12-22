'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CameraOff, RotateCcw, Check, Fingerprint, User, MapPin, Thermometer, FileText, ArrowLeft, ArrowRight, XCircle, AlertCircle, CheckCircle, Eye, Mic } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';

const BiometricCollectionPage = () => {
  const router = useRouter();
  const [biometricType, setBiometricType] = useState('FINGERPRINT');
  const [collectionStep, setCollectionStep] = useState(1); // 1: Select Type, 2: Capture, 3: Confirm
  const [capturedData, setCapturedData] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [metadata, setMetadata] = useState({
    device: '',
    location: '',
    temperature: '',
    notes: '',
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please ensure you've granted permission.");
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        const imageData = canvasRef.current.toDataURL('image/png');
        setCapturedData(imageData);
        setPreviewUrl(imageData);
        setConfidenceScore(Math.floor(Math.random() * 30) + 70); // Simulated confidence score
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // In a real implementation, this would send the data to the backend
    console.log({
      biometricType,
      capturedData,
      confidenceScore,
      metadata
    });

    // Simulate API call
    setTimeout(() => {
      alert('Biometric data collected and stored successfully!');
      router.push('/dashboard');
    }, 1000);
  };

  const resetCapture = () => {
    setCapturedData(null);
    setPreviewUrl(null);
    setConfidenceScore(null);
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const getBiometricIcon = (type: string) => {
    switch (type) {
      case 'FINGERPRINT':
        return Fingerprint;
      case 'FACE_RECOGNITION':
        return User;
      case 'IRIS_SCAN':
        return Eye;
      case 'VOICE_RECOGNITION':
        return Mic;
      default:
        return Fingerprint;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Biometric Data Collection</h2>
              <p className="mt-1 text-sm text-gray-500">
                Securely collect and store biometric data for identification and verification
              </p>
            </div>

            <div className="px-4 py-5 sm:p-6">
              {/* Step Progress Indicator */}
              <div className="mb-8">
                <div className="flex justify-between relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 -z-10"></div>
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="relative z-10">
                      <div className={`rounded-full w-10 h-10 flex items-center justify-center ${collectionStep >= step
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                        }`}>
                        {step}
                      </div>
                      <div className="text-xs mt-2 text-center">
                        {step === 1 && 'Select Type'}
                        {step === 2 && 'Capture Data'}
                        {step === 3 && 'Confirm & Store'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Select Biometric Type */}
              {collectionStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Select Biometric Type</h3>
                  <p className="text-sm text-gray-500">Choose the type of biometric data to collect</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'FINGERPRINT', name: 'Fingerprint' },
                      { id: 'FACE_RECOGNITION', name: 'Face Recognition' },
                      { id: 'IRIS_SCAN', name: 'Iris Scan' },
                      { id: 'VOICE_RECOGNITION', name: 'Voice Recognition' },
                    ].map((type) => {
                      const Icon = getBiometricIcon(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => setBiometricType(type.id)}
                          className={`p-4 rounded-lg border ${biometricType === type.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                          <div className="text-center">
                            <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-2">
                              <Icon className="h-8 w-8 text-gray-500" />
                            </div>
                            <span className="text-sm font-medium">{type.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setCollectionStep(2)}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none flex items-center"
                    >
                      Next: Capture Data
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Capture Data */}
              {collectionStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Capture {biometricType.replace('_', ' ')}</h3>
                  <p className="text-sm text-gray-500">Position your biometric feature for optimal capture</p>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="bg-black rounded-lg overflow-hidden aspect-square max-w-md mx-auto flex items-center justify-center">
                        {capturedData ? (
                          <Image
                            src={previewUrl || ''}
                            alt="Captured biometric"
                            width={500}
                            height={500}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-contain"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {!previewUrl && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <button
                                  onClick={startCamera}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
                                >
                                  <Camera className="mr-2 h-4 w-4" />
                                  Enable Camera
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {!capturedData ? (
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={captureImage}
                            disabled={!videoRef.current?.srcObject}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 flex items-center"
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            Capture Biometric
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 flex justify-center space-x-4">
                          <button
                            onClick={resetCapture}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retake Photo
                          </button>
                          <button
                            onClick={() => setCollectionStep(3)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
                          >
                            Confirm Capture
                            <Check className="ml-2 h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Capture Quality</h4>

                        {capturedData && confidenceScore && (
                          <div className="mb-6">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                              <span className="text-sm font-medium text-gray-700">{confidenceScore}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-indigo-600 h-2.5 rounded-full"
                                style={{ width: `${confidenceScore}%` }}
                              ></div>
                            </div>
                            <div className="mt-2 flex items-center">
                              {confidenceScore > 80 ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              ) : confidenceScore > 60 ? (
                                <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span className="text-sm text-gray-500">
                                {confidenceScore > 80
                                  ? 'High quality capture'
                                  : confidenceScore > 60
                                    ? 'Acceptable quality'
                                    : 'Low quality, consider retaking'}
                              </span>
                            </div>
                          </div>
                        )}

                        <h4 className="text-lg font-medium text-gray-900 mb-4">Metadata</h4>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="device" className="block text-sm font-medium text-gray-700 flex items-center">
                              <Fingerprint className="mr-2 h-4 w-4" />
                              Device Used
                            </label>
                            <input
                              type="text"
                              name="device"
                              id="device"
                              value={metadata.device}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Device model"
                            />
                          </div>

                          <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 flex items-center">
                              <MapPin className="mr-2 h-4 w-4" />
                              Location
                            </label>
                            <input
                              type="text"
                              name="location"
                              id="location"
                              value={metadata.location}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Capture location"
                            />
                          </div>

                          <div>
                            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 flex items-center">
                              <Thermometer className="mr-2 h-4 w-4" />
                              Ambient Temperature
                            </label>
                            <input
                              type="text"
                              name="temperature"
                              id="temperature"
                              value={metadata.temperature}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Temperature in Celsius"
                            />
                          </div>

                          <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              Additional Notes
                            </label>
                            <textarea
                              id="notes"
                              name="notes"
                              rows={3}
                              value={metadata.notes}
                              onChange={handleInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Any additional observations..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => {
                        resetCapture();
                        setCollectionStep(1);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back: Select Type
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {collectionStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Confirm and Store Biometric</h3>
                  <p className="text-sm text-gray-500">Review the captured data before finalizing storage</p>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="bg-black rounded-lg overflow-hidden aspect-square max-w-md mx-auto flex items-center justify-center">
                          <Image
                            src={previewUrl || ''}
                            alt="Captured biometric"
                            width={500}
                            height={500}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                      </div>

                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Details</h4>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-sm text-gray-500">Biometric Type</p>
                            <p className="font-medium flex items-center">
                              <Fingerprint className="mr-2 h-4 w-4" />
                              {biometricType.replace('_', ' ')}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Confidence Score</p>
                            <p className="font-medium flex items-center">
                              {confidenceScore}%
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs flex items-center ${confidenceScore && confidenceScore > 80
                                  ? 'bg-green-100 text-green-800'
                                  : confidenceScore && confidenceScore > 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                {confidenceScore && confidenceScore > 80
                                  ? <CheckCircle className="mr-1 h-3 w-3" />
                                  : confidenceScore && confidenceScore > 60
                                    ? <AlertCircle className="mr-1 h-3 w-3" />
                                    : <XCircle className="mr-1 h-3 w-3" />}
                                {confidenceScore && confidenceScore > 80
                                  ? 'Good'
                                  : confidenceScore && confidenceScore > 60
                                    ? 'Average'
                                    : 'Poor'}
                              </span>
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Date Captured</p>
                            <p className="font-medium">{new Date().toLocaleString()}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-500">Device</p>
                            <p className="font-medium">{metadata.device || 'N/A'}</p>
                          </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                          <div className="mb-4">
                            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Associate with User (Optional)
                            </label>
                            <input
                              type="text"
                              id="userId"
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Enter user ID or email"
                            />
                          </div>

                          <div className="flex justify-between">
                            <button
                              type="button"
                              onClick={() => setCollectionStep(2)}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                            >
                              <ArrowLeft className="mr-2 h-4 w-4" />
                              Back: Adjust
                            </button>

                            <button
                              type="submit"
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none flex items-center"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Store Biometric Data
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricCollectionPage;
