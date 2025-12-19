'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  Fingerprint, User, Mail, Lock, Phone, Calendar, GraduationCap,
  Building2, Camera, RotateCcw, Check, AlertCircle, CheckCircle,
  Shield, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

const departments = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Education',
  'English',
  'History',
];

const levels = ['100', '200', '300', '400', '500'];

export default function RegisterPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  
  const [step, setStep] = useState(1); // 1: Personal Info, 2: Biometric, 3: Security
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    matricNumber: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    department: '',
    level: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Biometric capture
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facialEmbedding, setFacialEmbedding] = useState<number[] | null>(null);
  const [capturingBiometric, setCapturingBiometric] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.matricNumber.trim()) newErrors.matricNumber = 'Matric number is required';
    else if (!/^[A-Z]{2,4}\/\d{4}\/\d{3,4}$/i.test(formData.matricNumber)) {
      newErrors.matricNumber = 'Format: DEP/YEAR/NUMBER (e.g., CSC/2020/001)';
    }
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.level) newErrors.level = 'Level is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      } else {
        toast.error('Please fill all required fields correctly');
      }
    } else if (step === 2) {
      if (!capturedImage || !facialEmbedding) {
        toast.error('Please capture your facial data');
      } else {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      toast.error('Please fix all errors');
      return;
    }

    if (!facialEmbedding) {
      toast.error('Please complete biometric enrollment');
      return;
    }

    setLoading(true);

    try {
      // Register user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          otherNames: formData.otherNames || undefined,
          matricNumber: formData.matricNumber.toUpperCase(),
          email: formData.email.toLowerCase(),
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          department: formData.department,
          level: formData.level,
          password: formData.password,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData.error || 'Registration failed');
      }

      const biometricRes = await fetch('/api/biometric/enroll', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registerData.token}`
        },
        body: JSON.stringify({
          facialTemplate: JSON.stringify(facialEmbedding),
          facialPhoto: capturedImage,
        }),
      });

      const biometricData = await biometricRes.json();

      if (!biometricRes.ok) {
        throw new Error(biometricData.error || 'Biometric enrollment failed');
      }

      // Update token cookie with new token that has biometricEnrolled = true
      if (biometricData.token) {
        document.cookie = `auth-token=${biometricData.token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
      }

      toast.success('Registration successful! Redirecting to dashboard...');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
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
          className="w-full max-w-4xl"
        >
          <div className="glass-card p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="bg-brand-500 p-3 rounded-xl">
                  <Fingerprint size={32} className="text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-surface-950">TASUED BioVault</h1>
                  <p className="text-sm text-surface-500">Student Registration</p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-surface-200 -translate-y-1/2 -z-10" />
                {[
                  { num: 1, label: 'Personal Info' },
                  { num: 2, label: 'Biometric' },
                  { num: 3, label: 'Security' },
                ].map((s) => (
                  <div key={s.num} className="relative z-10 flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor: step >= s.num ? '#0066CC' : '#E5E7EB',
                        scale: step === s.num ? 1.1 : 1,
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-2"
                    >
                      {step > s.num ? <Check size={20} /> : s.num}
                    </motion.div>
                    <span className="text-xs text-surface-600 text-center">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1: Personal Information */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-surface-950 mb-2">Personal Information</h2>
                      <p className="text-surface-500 text-sm">Please provide your accurate details</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">
                          <User size={16} className="text-surface-500" />
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`input-field ${errors.firstName ? 'input-field-error' : ''}`}
                          placeholder="John"
                        />
                        {errors.firstName && <p className="text-error-500 text-xs mt-1">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="label">
                          <User size={16} className="text-surface-500" />
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`input-field ${errors.lastName ? 'input-field-error' : ''}`}
                          placeholder="Doe"
                        />
                        {errors.lastName && <p className="text-error-500 text-xs mt-1">{errors.lastName}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="label">
                          <User size={16} className="text-surface-500" />
                          Other Names (Optional)
                        </label>
                        <input
                          type="text"
                          name="otherNames"
                          value={formData.otherNames}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="Middle names"
                        />
                      </div>

                      <div>
                        <label className="label">
                          <GraduationCap size={16} className="text-surface-500" />
                          Matric Number *
                        </label>
                        <input
                          type="text"
                          name="matricNumber"
                          value={formData.matricNumber}
                          onChange={handleChange}
                          className={`input-field ${errors.matricNumber ? 'input-field-error' : ''}`}
                          placeholder="CSC/2020/001"
                        />
                        {errors.matricNumber && <p className="text-error-500 text-xs mt-1">{errors.matricNumber}</p>}
                      </div>

                      <div>
                        <label className="label">
                          <Mail size={16} className="text-surface-500" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`input-field ${errors.email ? 'input-field-error' : ''}`}
                          placeholder="student@tasued.edu.ng"
                        />
                        {errors.email && <p className="text-error-500 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="label">
                          <Phone size={16} className="text-surface-500" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className={`input-field ${errors.phoneNumber ? 'input-field-error' : ''}`}
                          placeholder="+234 800 000 0000"
                        />
                        {errors.phoneNumber && <p className="text-error-500 text-xs mt-1">{errors.phoneNumber}</p>}
                      </div>

                      <div>
                        <label className="label">
                          <Calendar size={16} className="text-surface-500" />
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className={`input-field ${errors.dateOfBirth ? 'input-field-error' : ''}`}
                        />
                        {errors.dateOfBirth && <p className="text-error-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                      </div>

                      <div>
                        <label className="label">
                          <Building2 size={16} className="text-surface-500" />
                          Department *
                        </label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className={`input-field ${errors.department ? 'input-field-error' : ''}`}
                        >
                          <option value="">Select department</option>
                          {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                        {errors.department && <p className="text-error-500 text-xs mt-1">{errors.department}</p>}
                      </div>

                      <div>
                        <label className="label">
                          <GraduationCap size={16} className="text-surface-500" />
                          Level *
                        </label>
                        <select
                          name="level"
                          value={formData.level}
                          onChange={handleChange}
                          className={`input-field ${errors.level ? 'input-field-error' : ''}`}
                        >
                          <option value="">Select level</option>
                          {levels.map(level => (
                            <option key={level} value={level}>{level} Level</option>
                          ))}
                        </select>
                        {errors.level && <p className="text-error-500 text-xs mt-1">{errors.level}</p>}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Link href="/login" className="btn-outline">
                        Cancel
                      </Link>
                      <button type="button" onClick={handleNext} className="btn-primary">
                        Next: Biometric <ArrowRight size={16} className="ml-2" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Biometric Capture */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-surface-950 mb-2">Facial Recognition Enrollment</h2>
                      <p className="text-surface-500 text-sm">Capture your face for secure verification</p>
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
                              <button type="button" onClick={handleNext} className="btn-primary">
                                <Check size={16} className="mr-2" />
                                Looks Good
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

                    <div className="flex justify-between gap-3 pt-4">
                      <button type="button" onClick={handleBack} className="btn-outline">
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!capturedImage || !facialEmbedding}
                        className="btn-primary"
                      >
                        Next: Security <ArrowRight size={16} className="ml-2" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Security Setup */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-surface-950 mb-2">Security Setup</h2>
                      <p className="text-surface-500 text-sm">Create a strong password for your account</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="label">
                          <Lock size={16} className="text-surface-500" />
                          Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`input-field pr-12 ${errors.password ? 'input-field-error' : ''}`}
                            placeholder="Min. 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.password && <p className="text-error-500 text-xs mt-1">{errors.password}</p>}
                      </div>

                      <div>
                        <label className="label">
                          <Lock size={16} className="text-surface-500" />
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`input-field pr-12 ${errors.confirmPassword ? 'input-field-error' : ''}`}
                            placeholder="Re-enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-error-500 text-xs mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>

                    <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="text-warning-500 flex-shrink-0 mt-0.5" size={20} />
                      <div className="text-sm text-warning-700">
                        <p className="font-semibold mb-1">Password Requirements</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>At least 8 characters long</li>
                          <li>Mix of letters, numbers, and symbols recommended</li>
                          <li>Avoid common words or patterns</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-between gap-3 pt-4">
                      <button type="button" onClick={handleBack} className="btn-outline">
                        <ArrowLeft size={16} className="mr-2" />
                        Back
                      </button>
                      <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <Check size={16} className="mr-2" />
                            Complete Registration
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-6 text-center text-sm text-surface-500">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-500 hover:text-brand-600 font-semibold">
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
