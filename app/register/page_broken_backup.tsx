'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fingerprint, User, Mail, Lock, Phone, Calendar, Building2,
  GraduationCap, ArrowRight, ArrowLeft, Check, Camera, Loader2,
  AlertCircle, Eye, EyeOff, Shield, CheckCircle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

const departments = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Business Administration',
  'Accounting',
  'English',
  'History',
  'Political Science',
  'Sociology',
];

const levels = ['100', '200', '300', '400', '500'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
    securityQuestion: '',
    securityAnswer: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4;

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.matricNumber.trim()) newErrors.matricNumber = 'Matric number is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.department) newErrors.department = 'Department is required';
      if (!formData.level) newErrors.level = 'Level is required';
    }

    if (currentStep === 3) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.securityQuestion) newErrors.securityQuestion = 'Security question is required';
      if (!formData.securityAnswer.trim()) newErrors.securityAnswer = 'Security answer is required';
    }

    if (currentStep === 4) {
      if (!agreedToTerms) newErrors.terms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error('Registration Failed', { description: data.error || 'Please try again' });
        setLoading(false);
        return;
      }

      toast.success('Registration Successful!', {
        description: 'Please check your email to verify your account.'
      });

      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      toast.error('Network Error', { description: 'Failed to connect to server' });
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="min-h-screen bg-surface-50 flex">
      <Toaster position="top-center" richColors />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Fingerprint size={32} className="text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white">TASUED</span>
              <span className="ml-2 text-white/80">BioVault</span>
            </div>
          </Link>

          <h1 className="text-4xl font-bold text-white mb-6">
            Join the Future of Campus Identity
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Enroll your biometric data once and access all university services seamlessly. 
            Your digital identity, secured and simplified.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            'Multi-biometric enrollment',
            'Instant QR code generation',
            'Access to all campus services',
            'Complete data privacy control'
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-white/90">
              <CheckCircle size={20} className="text-success-400" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="bg-brand-500 p-2.5 rounded-xl text-white">
                <Fingerprint size={28} />
              </div>
              <span className="text-xl font-bold text-surface-950">TASUED BioVault</span>
            </Link>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    s < step ? 'bg-success-500 text-white' :
                    s === step ? 'bg-brand-500 text-white' :
                    'bg-surface-200 text-surface-500'
                  }`}>
                    {s < step ? <Check size={18} /> : s}
                  </div>
                  {s < 4 && (
                    <div className={`w-16 md:w-24 h-1 mx-2 rounded ${
                      s < step ? 'bg-success-500' : 'bg-surface-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-medium text-surface-500">
              <span>Personal Info</span>
              <span>Biometrics</span>
              <span>Security</span>
              <span>Review</span>
            </div>
          </div>

          {/* Form Steps */}
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
                  <h2 className="text-2xl font-bold text-surface-950 mb-2">Personal Information</h2>
                  <p className="text-surface-500">Let&apos;s start with your basic details</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">First Name</label>
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
                    <label className="input-label">Last Name</label>
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
                </div>

                <div>
                  <label className="input-label">Other Names (Optional)</label>
                  <input
                    type="text"
                    name="otherNames"
                    value={formData.otherNames}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Middle name"
                  />
                </div>

                <div>
                  <label className="input-label">Matriculation Number</label>
                  <input
                    type="text"
                    name="matricNumber"
                    value={formData.matricNumber}
                    onChange={handleChange}
                    className={`input-field font-mono ${errors.matricNumber ? 'input-field-error' : ''}`}
                    placeholder="CSC/2020/001"
                  />
                  {errors.matricNumber && <p className="text-error-500 text-xs mt-1">{errors.matricNumber}</p>}
                </div>

                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field ${errors.email ? 'input-field-error' : ''}`}
                    placeholder="john.doe@student.tasued.edu.ng"
                  />
                  {errors.email && <p className="text-error-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Phone Number</label>
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
                    <label className="input-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={`input-field ${errors.dateOfBirth ? 'input-field-error' : ''}`}
                    />
                    {errors.dateOfBirth && <p className="text-error-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Department</label>
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
                    <label className="input-label">Level</label>
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
                  <h2 className="text-2xl font-bold text-surface-950 mb-2">Biometric Capture</h2>
                  <p className="text-surface-500">Capture your biometric data for secure verification</p>
                </div>

                {/* Fingerprint Section */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-brand-50 rounded-xl text-brand-500">
                      <Fingerprint size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-surface-900">Fingerprint Capture</h3>
                      <p className="text-sm text-surface-500">Place your finger on the scanner</p>
                    </div>
                  </div>
                  <div className="bg-surface-100 rounded-xl p-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-surface-200 flex items-center justify-center">
                      <Fingerprint size={48} className="text-surface-400" />
                    </div>
                    <p className="text-surface-500 text-sm mb-4">Fingerprint scanner not detected</p>
                    <button className="btn-outline text-sm py-2 px-4">
                      Simulate Capture
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-success-600">
                    <CheckCircle size={16} />
                    <span>Demo mode: Fingerprint will be simulated</span>
                  </div>
                </div>

                {/* Facial Recognition Section */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-success-50 rounded-xl text-success-500">
                      <Camera size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-surface-900">Facial Recognition</h3>
                      <p className="text-sm text-surface-500">Position your face in the frame</p>
                    </div>
                  </div>
                  <div className="bg-surface-900 rounded-xl aspect-video relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full border-4 border-dashed border-white/30 flex items-center justify-center">
                          <User size={48} className="text-white/50" />
                        </div>
                        <p className="text-white/70 text-sm">Camera preview will appear here</p>
                      </div>
                    </div>
                    <div className="scanner-overlay" />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="btn-primary flex-1 py-2 text-sm">
                      <Camera size={16} className="inline mr-2" />
                      Start Camera
                    </button>
                    <button className="btn-outline py-2 text-sm">
                      Capture
                    </button>
                  </div>
                </div>

                <div className="bg-info-50 border border-info-200 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="text-info-500 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-info-700">
                    <p className="font-semibold mb-1">Your data is secure</p>
                    <p>Biometric data is encrypted using AES-256 and stored as templates only. Raw images are never saved.</p>
                  </div>
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
                  <h2 className="text-2xl font-bold text-surface-950 mb-2">Security Setup</h2>
                  <p className="text-surface-500">Create a strong password and security question</p>
                </div>

                <div>
                  <label className="input-label">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`input-field pr-12 ${errors.password ? 'input-field-error' : ''}`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-error-500 text-xs mt-1">{errors.password}</p>}
                  
                  {/* Password Strength Meter */}
                  {formData.password && (
                    <div className="mt-3">
                      <div className="flex gap-1 mb-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-surface-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        passwordStrength < 3 ? 'text-error-500' : 'text-success-500'
                      }`}>
                        {strengthLabels[passwordStrength - 1] || 'Enter password'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="input-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-field ${errors.confirmPassword ? 'input-field-error' : ''}`}
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && <p className="text-error-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <div>
                  <label className="input-label">Security Question</label>
                  <select
                    name="securityQuestion"
                    value={formData.securityQuestion}
                    onChange={handleChange}
                    className={`input-field ${errors.securityQuestion ? 'input-field-error' : ''}`}
                  >
                    <option value="">Select a security question</option>
                    <option value="pet">What was the name of your first pet?</option>
                    <option value="school">What was the name of your primary school?</option>
                    <option value="city">In what city were you born?</option>
                    <option value="mother">What is your mother&apos;s maiden name?</option>
                    <option value="book">What is your favorite book?</option>
                  </select>
                  {errors.securityQuestion && <p className="text-error-500 text-xs mt-1">{errors.securityQuestion}</p>}
                </div>

                <div>
                  <label className="input-label">Security Answer</label>
                  <input
                    type="text"
                    name="securityAnswer"
                    value={formData.securityAnswer}
                    onChange={handleChange}
                    className={`input-field ${errors.securityAnswer ? 'input-field-error' : ''}`}
                    placeholder="Your answer"
                  />
                  {errors.securityAnswer && <p className="text-error-500 text-xs mt-1">{errors.securityAnswer}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 4: Review & Consent */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-bold text-surface-950 mb-2">Review & Consent</h2>
                  <p className="text-surface-500">Please review your information before submitting</p>
                </div>

                {/* Summary Card */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="font-bold text-surface-900 flex items-center gap-2">
                    <User size={18} className="text-brand-500" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-surface-500">Full Name</span>
                      <p className="font-medium text-surface-900">{formData.firstName} {formData.lastName} {formData.otherNames}</p>
                    </div>
                    <div>
                      <span className="text-surface-500">Matric Number</span>
                      <p className="font-medium text-surface-900 font-mono">{formData.matricNumber}</p>
                    </div>
                    <div>
                      <span className="text-surface-500">Email</span>
                      <p className="font-medium text-surface-900">{formData.email}</p>
                    </div>
                    <div>
                      <span className="text-surface-500">Phone</span>
                      <p className="font-medium text-surface-900">{formData.phoneNumber}</p>
                    </div>
                    <div>
                      <span className="text-surface-500">Department</span>
                      <p className="font-medium text-surface-900">{formData.department}</p>
                    </div>
                    <div>
                      <span className="text-surface-500">Level</span>
                      <p className="font-medium text-surface-900">{formData.level} Level</p>
                    </div>
                  </div>
                </div>

                {/* Biometric Status */}
                <div className="glass-card p-6">
                  <h3 className="font-bold text-surface-900 flex items-center gap-2 mb-4">
                    <Fingerprint size={18} className="text-brand-500" />
                    Biometric Data
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-success-500" />
                      <span>Fingerprint (Simulated)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle size={16} className="text-success-500" />
                      <span>Facial Data (Simulated)</span>
                    </div>
                  </div>
                </div>

                {/* Terms & Consent */}
                <div className="space-y-4">
                  <div className="bg-surface-100 rounded-xl p-4 max-h-40 overflow-y-auto text-sm text-surface-600 scrollbar-thin">
                    <h4 className="font-bold text-surface-900 mb-2">Terms of Service & Privacy Policy</h4>
                    <p className="mb-2">By enrolling in TASUED BioVault, you agree to:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Allow the collection and storage of your biometric data for identity verification</li>
                      <li>Use the platform in accordance with university policies</li>
                      <li>Keep your login credentials secure and confidential</li>
                      <li>Report any unauthorized access to your account immediately</li>
                    </ul>
                    <p className="mt-2">Your data will be processed in accordance with GDPR and NITDA regulations.</p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-surface-600">
                      I have read and agree to the <Link href="#" className="text-brand-500 hover:underline">Terms of Service</Link> and <Link href="#" className="text-brand-500 hover:underline">Privacy Policy</Link>. I consent to the collection and processing of my biometric data.
                    </span>
                  </label>
                  {errors.terms && <p className="text-error-500 text-xs">{errors.terms}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button onClick={handleBack} className="btn-outline flex items-center gap-2 flex-1">
                <ArrowLeft size={18} />
                Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={handleNext} className="btn-primary flex items-center gap-2 flex-1">
                Next
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary flex items-center justify-center gap-2 flex-1"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Complete Enrollment
                    <CheckCircle size={18} />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-surface-500 mt-6">
            Already enrolled?{' '}
            <Link href="/login" className="text-brand-500 font-semibold hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
