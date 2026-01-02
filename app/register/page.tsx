'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Fingerprint, Mail, Lock, ArrowRight, Loader2, AlertCircle,
  Eye, EyeOff, User, GraduationCap, Phone, CheckCircle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    matricNumber: '',
    phone: '',
    department: '',
    level: '100',
    password: '',
    confirmPassword: '',
  });

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
    'Mass Communication',
    'Education',
    'Other'
  ];

  const levels = ['100', '200', '300', '400', '500'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep1 = () => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Valid email is required');
      return false;
    }
    if (!formData.matricNumber.trim()) {
      toast.error('Matric number is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.department) {
      toast.error('Please select your department');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setLoading(true);
    setError('');

    try {
      // Register with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            matricNumber: formData.matricNumber,
            phone: formData.phone,
            department: formData.department,
            level: formData.level,
            type: 'student',
            role: 'STUDENT',
            biometricEnrolled: false,
          },
          emailRedirectTo: `${window.location.origin}/enroll-biometric`,
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // Session exists, user is logged in - redirect to success page
          toast.success('Registration successful! Redirecting...');
          setTimeout(() => {
            window.location.href = '/registration-success';
          }, 1000);
        } else {
          // No session - might need email confirmation or auto-sign in
          // Try to sign in automatically
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (signInError) {
            // If sign-in fails, it might be because email confirmation is required
            if (signInError.message.includes('Email not confirmed')) {
              toast.success('Registration successful! Please check your email to confirm your account.');
              setTimeout(() => {
                router.push('/login');
              }, 2000);
            } else {
              throw signInError;
            }
          } else if (signInData.session) {
            toast.success('Registration successful! Redirecting...');
            setTimeout(() => {
              window.location.href = '/registration-success';
            }, 1000);
          }
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" richColors />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-800 via-emerald-900 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
          <div>
            <Link href="/" className="flex items-center gap-4 mb-16 group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl">
                <Fingerprint size={36} className="text-white" />
              </div>
              <div className="border-l border-white/20 pl-4">
                <span className="text-2xl font-black text-white tracking-tight">TASUED</span>
                <p className="text-sm font-bold text-green-300 tracking-widest">BIOVAULT</p>
              </div>
            </Link>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white"
            >
              <h1 className="text-4xl md:text-5xl font-black leading-tight max-w-lg">
                Join the<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                  Digital Campus
                </span>
              </h1>
              <p className="text-white/80 text-lg max-w-lg leading-relaxed font-light mt-4">
                Create your secure biometric identity and access all university services with ease.
              </p>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 space-y-4"
            >
              {[
                'One-time enrollment for all services',
                'Secure biometric verification',
                'Instant QR code access',
                'Real-time activity tracking'
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-400" />
                  <span className="text-white/90">{benefit}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="text-white/60 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-green-400 font-semibold hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md py-8"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-2xl text-white shadow-lg">
                <Fingerprint size={28} />
              </div>
              <div className="text-left">
                <span className="text-xl font-black text-surface-900">TASUED</span>
                <p className="text-sm font-bold text-green-500">BIOVAULT</p>
              </div>
            </Link>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-surface-900">Create Account</h2>
            <p className="text-surface-600 mt-2">Step {step} of 2</p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-6">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-surface-700 block mb-1">First Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="John"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-surface-700 block mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">Matric Number</label>
                  <div className="relative">
                    <GraduationCap size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="text"
                      name="matricNumber"
                      value={formData.matricNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="20220294001"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="08012345678"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => validateStep1() && setStep(2)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>{level} Level</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Min. 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-surface-700 block mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-surface-100 text-surface-700 py-3.5 rounded-xl font-bold hover:bg-surface-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Account <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="text-center text-sm text-surface-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-surface-400 mt-6">
            &copy; {new Date().getFullYear()} TASUED BioVault • CSC 415 Project
          </p>
        </motion.div>
      </div>
    </div>
  );
}
