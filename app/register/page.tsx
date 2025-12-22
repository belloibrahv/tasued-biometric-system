'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import {
  Fingerprint, User, Mail, Lock, Phone, Calendar, GraduationCap,
  Building2, Camera, RotateCcw, Check, AlertCircle, CheckCircle,
  Shield, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Users,
  BookOpen, GraduationCap as GraduationCapIcon, UserRound,
  ShieldCheck, LockIcon, Fingerprint as FingerPrintIcon,
  Camera as CameraIcon, User as UserIcon
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
  'Political Science',
  'Economics',
  'Accounting',
  'Business Administration',
  'Law',
  'Medicine',
  'Engineering',
  'Agriculture',
];

const levels = ['100', '200', '300', '400', '500'];

export default function RegisterPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);

  const [step, setStep] = useState(1); // 1: Personal Info, 2: Biometric, 3: Security
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

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

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.matricNumber.trim()) newErrors.matricNumber = 'Matric number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.level) newErrors.level = 'Level is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation
    const phoneRegex = /^(\+?234|0)?[789]\d{9}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber.replace(/[^0-9]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid Nigerian phone number';
    }

    // Matric number validation
    const matricRegex = /^[A-Z]{3}\/\d{4}\/\d{3}$/;
    if (formData.matricNumber && !matricRegex.test(formData.matricNumber.toUpperCase())) {
      newErrors.matricNumber = 'Matric number format: CSC/2024/001';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    if (formData.password && formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const captureFacialData = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        toast.success('Facial capture successful!');
      } else {
        toast.error('Failed to capture image');
      }
    }
  }, []);

  const retakeFacialData = () => {
    setCapturedImage(null);
  };

  const nextStep = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (!capturedImage) {
        toast.error('Please capture your facial data');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (validateStep3()) {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      // Call the register action with facial embedding (mock for now)
      const result = await register(formData, [], capturedImage!);

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      toast.success(result.message || 'Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        router.push(result.target || '/dashboard');
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Step components are now outside or handled via render functions that don't recreate component types
  const stepComponents = [
    <PersonalInfoStep
      key={1}
      formData={formData}
      errors={errors}
      handleChange={handleChange}
      departments={departments}
      levels={levels}
    />,
    <BiometricStep
      key={2}
      capturedImage={capturedImage}
      webcamRef={webcamRef}
      cameraReady={cameraReady}
      setCameraReady={setCameraReady}
      captureFacialData={captureFacialData}
      retakeFacialData={retakeFacialData}
      setStep={setStep}
    />,
    <SecurityStep
      key={3}
      formData={formData}
      errors={errors}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
      handleChange={handleChange}
    />
  ];

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" richColors />

      {/* Left Panel with TASUED Logo as Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden border-r border-white/10">
        {/* TASUED Logo as Background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url('/images/logo.png')",
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />

        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
          {/* Header */}
          <div>
            <Link href="/" className="flex items-center gap-4 mb-16 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-success-500 flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xl shadow-brand-500/30">
                <Fingerprint size={36} className="text-white" />
              </div>
              <div className="border-l border-white/20 pl-4">
                <span className="text-2xl font-black text-white tracking-tight">TASUED</span>
                <p className="text-sm font-bold text-brand-300 tracking-widest">BIOVAULT</p>
              </div>
            </Link>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white"
              >
                <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight max-w-lg">
                  Join the Elite <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-success-400">
                    Class of Students
                  </span>
                </h1>
                <p className="text-white/80 text-lg max-w-lg leading-relaxed font-light">
                  Secure your digital identity with our advanced biometric verification system.
                  One registration, unlimited access to all university services.
                </p>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-4 pt-6"
              >
                {[
                  { value: '24/7', label: 'Support' },
                  { value: '99.9%', label: 'Uptime' },
                  { value: '256-bit', label: 'Encryption' },
                ].map((item, idx) => (
                  <div key={idx} className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                    <div className="text-xl font-black text-brand-400 mb-1">{item.value}</div>
                    <div className="text-xs text-white/70 uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-400/30">
                <ShieldCheck size={24} className="text-brand-400" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-wider text-sm">Military-Grade Security</h3>
                <p className="text-xs text-surface-300 font-bold uppercase tracking-widest">AES-256 Encryption</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Verified Access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Real-time Sync</span>
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
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="bg-gradient-to-br from-brand-500 to-success-500 p-3.5 rounded-2xl text-white shadow-lg">
                <Fingerprint size={28} />
              </div>
              <div className="text-left">
                <span className="text-xl font-black text-surface-900 tracking-tight">TASUED</span>
                <p className="text-sm font-bold text-brand-500 tracking-widest">BIOVAULT</p>
              </div>
            </Link>
          </div>

          <div className="text-center mb-10">
            <div className="w-24 h-1 bg-gradient-to-r from-brand-500 to-success-500 mx-auto rounded-full mb-6"></div>
            <h2 className="text-3xl font-bold text-surface-900 tracking-tight">
              Create Your <span className="text-brand-500">Identity</span>
            </h2>
            <p className="text-surface-600 mt-3 max-w-md mx-auto">
              Join the secure biometric verification network at TASUED
            </p>
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
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all"
                  >
                    {step > s.num ? <Check size={20} /> : s.num}
                  </motion.div>
                  <span className="text-xs text-surface-600 text-center mt-2">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <AnimatePresence mode="wait">
              {stepComponents[step - 1]}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="btn-outline flex-1 py-3 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Previous
                </button>
              )}

              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {step === 3 ? 'Creating Account...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    {step === 3 ? 'Create Account' : 'Continue'}
                    {step < 3 && <ArrowRight size={18} />}
                  </>
                )}
              </button>
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

// Internal components moved outside to prevent re-renders losing focus
interface PersonalInfoProps {
  formData: any;
  errors: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  departments: string[];
  levels: string[];
}

const PersonalInfoStep = ({ formData, errors, handleChange, departments, levels }: PersonalInfoProps) => (
  <motion.div
    key="step1"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserIcon size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-surface-950">Personal Information</h3>
      <p className="text-surface-500 mt-1">Please provide your accurate details</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="input-label">First Name *</label>
        <div className="relative">
          <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`input-field pl-11 ${errors.firstName ? 'border-error-500' : ''}`}
            placeholder="John"
          />
        </div>
        {errors.firstName && <p className="text-error-500 text-sm mt-1">{errors.firstName}</p>}
      </div>

      <div>
        <label className="input-label">Last Name *</label>
        <div className="relative">
          <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`input-field pl-11 ${errors.lastName ? 'border-error-500' : ''}`}
            placeholder="Doe"
          />
        </div>
        {errors.lastName && <p className="text-error-500 text-sm mt-1">{errors.lastName}</p>}
      </div>

      <div className="md:col-span-2">
        <label className="input-label">Other Names</label>
        <div className="relative">
          <UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            name="otherNames"
            value={formData.otherNames}
            onChange={handleChange}
            className="input-field pl-11"
            placeholder="Middle names (optional)"
          />
        </div>
      </div>

      <div>
        <label className="input-label">Matric Number *</label>
        <div className="relative">
          <GraduationCapIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            name="matricNumber"
            value={formData.matricNumber}
            onChange={handleChange}
            className={`input-field pl-11 font-mono uppercase ${errors.matricNumber ? 'border-error-500' : ''}`}
            placeholder="CSC/2024/001"
          />
        </div>
        {errors.matricNumber && <p className="text-error-500 text-sm mt-1">{errors.matricNumber}</p>}
      </div>

      <div>
        <label className="input-label">Email Address *</label>
        <div className="relative">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input-field pl-11 ${errors.email ? 'border-error-500' : ''}`}
            placeholder="john.doe@tasued.edu.ng"
          />
        </div>
        {errors.email && <p className="text-error-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="input-label">Phone Number *</label>
        <div className="relative">
          <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`input-field pl-11 ${errors.phoneNumber ? 'border-error-500' : ''}`}
            placeholder="+234 80XXXXXXXXX"
          />
        </div>
        {errors.phoneNumber && <p className="text-error-500 text-sm mt-1">{errors.phoneNumber}</p>}
      </div>

      <div>
        <label className="input-label">Date of Birth *</label>
        <div className="relative">
          <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={`input-field pl-11 ${errors.dateOfBirth ? 'border-error-500' : ''}`}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        {errors.dateOfBirth && <p className="text-error-500 text-sm mt-1">{errors.dateOfBirth}</p>}
      </div>

      <div>
        <label className="input-label">Department *</label>
        <div className="relative">
          <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className={`input-field pl-11 ${errors.department ? 'border-error-500' : ''}`}
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        {errors.department && <p className="text-error-500 text-sm mt-1">{errors.department}</p>}
      </div>

      <div>
        <label className="input-label">Level *</label>
        <div className="relative">
          <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className={`input-field pl-11 ${errors.level ? 'border-error-500' : ''}`}
          >
            <option value="">Select Level</option>
            {levels.map(level => (
              <option key={level} value={level}>{level} Level</option>
            ))}
          </select>
        </div>
        {errors.level && <p className="text-error-500 text-sm mt-1">{errors.level}</p>}
      </div>
    </div>
  </motion.div>
);

interface BiometricStepProps {
  capturedImage: string | null;
  webcamRef: React.RefObject<Webcam>;
  cameraReady: boolean;
  setCameraReady: (ready: boolean) => void;
  captureFacialData: () => void;
  retakeFacialData: () => void;
  setStep: (step: number) => void;
}

const BiometricStep = ({
  capturedImage, webcamRef, cameraReady, setCameraReady,
  captureFacialData, retakeFacialData, setStep
}: BiometricStepProps) => (
  <motion.div
    key="step2"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <FingerPrintIcon size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-surface-950">Biometric Enrollment</h3>
      <p className="text-surface-500 mt-1">Capture your facial features for verification</p>
    </div>

    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
      <div className="aspect-square max-w-xs mx-auto">
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-surface-900 flex items-center justify-center">
          {!capturedImage ? (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                onUserMedia={() => setCameraReady(true)}
                className="w-full h-full object-cover"
                videoConstraints={{
                  width: 640,
                  height: 640,
                  facingMode: 'user',
                }}
              />
              {!cameraReady && (
                <div className="absolute inset-0 bg-surface-900 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              )}
              <div className="absolute inset-0 border-4 border-white/30 rounded-xl"></div>
            </>
          ) : (
            <img
              src={capturedImage}
              alt="Captured facial data"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {capturedImage ? (
          <div className="mt-4 text-center">
            <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
              <CheckCircle size={16} /> Facial data captured successfully!
            </p>
            <div className="flex gap-3 mt-4 justify-center">
              <button
                type="button"
                onClick={retakeFacialData}
                className="btn-outline flex items-center gap-2 px-4 py-2"
              >
                <RotateCcw size={16} /> Retake
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-primary flex items-center gap-2 px-4 py-2"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={captureFacialData}
              disabled={!cameraReady}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <CameraIcon size={18} />
              Capture Face
            </button>
            <p className="text-xs text-surface-500 mt-2">
              Position your face in the frame and click capture
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-white/70 rounded-lg text-xs text-surface-700">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-green-600" />
          <strong>Security Notice:</strong>
        </div>
        <p>Your biometric data is encrypted using AES-256 encryption. The raw image is never stored - only a secure template that cannot be reversed to reconstruct your face.</p>
      </div>
    </div>
  </motion.div>
);

interface SecurityStepProps {
  formData: any;
  errors: any;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SecurityStep = ({
  formData, errors, showPassword, setShowPassword,
  showConfirmPassword, setShowConfirmPassword, handleChange
}: SecurityStepProps) => (
  <motion.div
    key="step3"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <LockIcon size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-surface-950">Account Security</h3>
      <p className="text-surface-500 mt-1">Set up your secure password</p>
    </div>

    <div className="space-y-4">
      <div>
        <label className="input-label">Password *</label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`input-field pl-11 pr-11 ${errors.password ? 'border-error-500' : ''}`}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="text-error-500 text-sm mt-1">{errors.password}</p>}
        <p className="text-xs text-surface-400 mt-1">Use at least 8 characters with letters, numbers, and symbols</p>
      </div>

      <div>
        <label className="input-label">Confirm Password *</label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`input-field pl-11 pr-11 ${errors.confirmPassword ? 'border-error-500' : ''}`}
            placeholder="Re-enter your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-error-500 text-sm mt-1">{errors.confirmPassword}</p>}
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
      <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
      <div className="text-sm text-blue-800">
        <p className="font-semibold mb-1">Your Data is Protected</p>
        <p>All your information is encrypted and stored securely. We comply with Nigerian Data Protection Regulation (NDPR).</p>
      </div>
    </div>
  </motion.div>
);