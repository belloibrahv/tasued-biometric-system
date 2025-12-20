'use client';

import { useState, useRef, useCallback } from 'react';
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
import { register } from '@/app/actions/auth';

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
      const result = await register(formData, facialEmbedding, capturedImage!);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.success) {
        toast.success('Registration successful! Redirecting to dashboard...');

        // Minor cleanup
        localStorage.removeItem('token'); // No longer needed in localStorage

        setTimeout(() => {
          window.location.replace(result.target!);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" richColors />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-900 relative overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-950/80 via-surface-950/60 to-surface-900/90 z-10" />
          <img
            src="/images/biometric-hero.png"
            alt="TASUED Biometric"
            className="w-full h-full object-cover blur-[1px] opacity-60 scale-105"
          />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-4 mb-16 group">
            <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-md border border-white/20 transition-transform group-hover:scale-110 shadow-2xl">
              <Fingerprint size={32} className="text-white" />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tighter">TASUED</span>
              <p className="text-[10px] font-black text-brand-300 uppercase tracking-[0.3em] leading-none mt-1">BioVault</p>
            </div>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-black text-white mb-8 tracking-tight leading-none">
              Initialize Your <br />
              <span className="text-brand-400">Digital Identity.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-md font-medium">
              Begin your journey into a secure, biometric-enabled campus experience. Complete your enrollment in three simple, high-security steps.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card-dark p-8 border border-white/5 bg-white/5 backdrop-blur-2xl"
          >
            <div className="flex items-center gap-5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-success-500/20 flex items-center justify-center border border-success-500/30">
                <Shield size={24} className="text-success-400" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-tight">Identity Vault</h3>
                <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mt-0.5">Biometric Encryption Active</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.1em]">Public Key Infrastructure</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 justify-center w-full">
              <div className="bg-brand-500 p-2.5 rounded-xl text-white">
                <Fingerprint size={28} />
              </div>
              <span className="text-xl font-bold text-surface-950">TASUED BioVault</span>
            </Link>
          </div>

          <div className="glass-card p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-surface-950 mb-2">Create Account</h2>
              <p className="text-surface-500">Join TASUED BioVault in seconds</p>
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
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-surface-950 mb-2">Personal Information</h3>
                      <p className="text-surface-500 text-sm">Please provide your accurate details</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">
                          First Name *
                        </label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`input-field pl-11 ${errors.firstName ? 'input-field-error' : ''}`}
                            placeholder="John"
                          />
                        </div>
                        {errors.firstName && <p className="text-error-500 text-xs mt-1">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="input-label">
                          Last Name *
                        </label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`input-field pl-11 ${errors.lastName ? 'input-field-error' : ''}`}
                            placeholder="Doe"
                          />
                        </div>
                        {errors.lastName && <p className="text-error-500 text-xs mt-1">{errors.lastName}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="input-label">
                          Other Names (Optional)
                        </label>
                        <div className="relative">
                          <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="text"
                            name="otherNames"
                            value={formData.otherNames}
                            onChange={handleChange}
                            className="input-field pl-11"
                            placeholder="Middle names"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="input-label">
                          Matric Number *
                        </label>
                        <div className="relative">
                          <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="text"
                            name="matricNumber"
                            value={formData.matricNumber}
                            onChange={handleChange}
                            className={`input-field pl-11 ${errors.matricNumber ? 'input-field-error' : ''}`}
                            placeholder="CSC/2020/001"
                          />
                        </div>
                        {errors.matricNumber && <p className="text-error-500 text-xs mt-1">{errors.matricNumber}</p>}
                      </div>

                      <div>
                        <label className="input-label">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`input-field pl-11 ${errors.email ? 'input-field-error' : ''}`}
                            placeholder="student@tasued.edu.ng"
                          />
                        </div>
                        {errors.email && <p className="text-error-500 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="input-label">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className={`input-field pl-11 ${errors.phoneNumber ? 'input-field-error' : ''}`}
                            placeholder="+234 800 000 0000"
                          />
                        </div>
                        {errors.phoneNumber && <p className="text-error-500 text-xs mt-1">{errors.phoneNumber}</p>}
                      </div>

                      <div>
                        <label className="input-label">
                          Date of Birth *
                        </label>
                        <div className="relative">
                          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className={`input-field pl-11 ${errors.dateOfBirth ? 'input-field-error' : ''}`}
                          />
                        </div>
                        {errors.dateOfBirth && <p className="text-error-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                      </div>

                      <div>
                        <label className="input-label">
                          Department *
                        </label>
                        <div className="relative">
                          <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <select
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className={`input-field pl-11 ${errors.department ? 'input-field-error' : ''}`}
                          >
                            <option value="">Select department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                        {errors.department && <p className="text-error-500 text-xs mt-1">{errors.department}</p>}
                      </div>

                      <div>
                        <label className="input-label">
                          Level *
                        </label>
                        <div className="relative">
                          <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <select
                            name="level"
                            value={formData.level}
                            onChange={handleChange}
                            className={`input-field pl-11 ${errors.level ? 'input-field-error' : ''}`}
                          >
                            <option value="">Select level</option>
                            {levels.map(level => (
                              <option key={level} value={level}>{level} Level</option>
                            ))}
                          </select>
                        </div>
                        {errors.level && <p className="text-error-500 text-xs mt-1">{errors.level}</p>}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Link href="/login" className="btn-outline">
                        Cancel
                      </Link>
                      <button type="button" onClick={handleNext} className="btn-primary py-3 flex items-center justify-center gap-2">
                        Next: Biometric <ArrowRight size={16} />
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
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-surface-950 mb-2">Facial Recognition Enrollment</h3>
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
                      <button type="button" onClick={handleBack} className="btn-outline py-3 flex items-center justify-center gap-2">
                        <ArrowLeft size={16} />
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!capturedImage || !facialEmbedding}
                        className="btn-primary py-3 flex items-center justify-center gap-2"
                      >
                        Next: Security <ArrowRight size={16} />
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
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-surface-950 mb-2">Security Setup</h3>
                      <p className="text-surface-500 text-sm">Create a strong password for your account</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="input-label">
                          Password *
                        </label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`input-field pl-11 pr-11 ${errors.password ? 'input-field-error' : ''}`}
                            placeholder="Min. 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {errors.password && <p className="text-error-500 text-xs mt-1">{errors.password}</p>}
                      </div>

                      <div>
                        <label className="input-label">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={`input-field pl-11 pr-11 ${errors.confirmPassword ? 'input-field-error' : ''}`}
                            placeholder="Re-enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
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
                      <button type="button" onClick={handleBack} className="btn-outline py-3 flex items-center justify-center gap-2">
                        <ArrowLeft size={16} />
                        Back
                      </button>
                      <button type="submit" disabled={loading} className="btn-primary py-3 flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Complete Registration <ArrowRight size={16} />
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

          <p className="text-center text-xs text-surface-400 mt-8">
            &copy; {new Date().getFullYear()} TASUED BioVault • CSC 415 Project
          </p>
        </motion.div>
      </div>
    </div>
  );
}
