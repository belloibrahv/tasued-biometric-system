'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Fingerprint, Mail, Lock, ArrowRight, Loader2, AlertCircle,
  Eye, EyeOff, Shield, CheckCircle, User, Users
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { login } from '@/app/actions/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log(`Login: Attempting ${loginType} login for ${email}`);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('loginType', loginType);
      formData.append('redirect', redirect);

      const result = await login(formData);

      if (result.error) {
        setError(result.error);
        toast.error('Login Failed', { description: result.error });
        setLoading(false);
        return;
      }

      if (result.success) {
        toast.success('Login Successful!');

        // We still store user info in localStorage for UI purposes, but token is in HttpOnly cookie
        // The middleware will handle verification

        // Fetch minimal user info for localStorage UI state
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const userData = await res.json();
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (e) {
          console.warn('Failed to fetch user info for localStorage', e);
        }

        window.location.replace(result.target);
      }
    } catch (err: any) {
      console.error('Login: Unexpected error', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };


  return (
    <>
      {/* Login Type Toggle */}
      <div className="flex bg-surface-100 p-1 rounded-2xl mb-8 shadow-sm">
        <button
          onClick={() => setLoginType('student')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            loginType === 'student'
              ? 'bg-white shadow-md text-brand-600'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <User size={18} className={loginType === 'student' ? 'text-brand-600' : 'text-surface-500'} />
          Student Access
        </button>
        <button
          onClick={() => setLoginType('admin')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            loginType === 'admin'
              ? 'bg-white shadow-md text-brand-600'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <Shield size={18} className={loginType === 'admin' ? 'text-brand-600' : 'text-surface-500'} />
          Staff/Admin
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-surface-200/50 overflow-hidden">
        {error && (
          <div className="bg-red-50 border-b border-red-200 p-4 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-surface-700 block">
                {loginType === 'student' ? 'Email or Matric Number' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-surface-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-surface-900 placeholder:text-surface-400"
                  placeholder={loginType === 'student' ? 'CSC/2020/001 or email@example.com' : 'staff@tasued.edu.ng'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-surface-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-all">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-surface-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-surface-900 placeholder:text-surface-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-surface-700">
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:from-brand-600 hover:to-brand-700 transition-all shadow-brand-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {loginType === 'student' && (
        <div className="text-center mt-8">
          <p className="text-surface-600 mb-4">
            Don&apos;t have an account?
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-success-500 to-success-600 text-white px-6 py-3 rounded-xl font-bold hover:from-success-600 hover:to-success-700 transition-all shadow-success-lg">
            <CheckCircle size={18} />
            <span>Enroll Now</span>
          </Link>
        </div>
      )}
    </>
  );
}

export default function LoginPage() {
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
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)]"></div>

        {/* Content */}
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
                <h1 className="text-4xl md:text-5xl font-black leading-tight max-w-lg">
                  Welcome Back,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-success-400">
                    Campus Community
                  </span>
                </h1>
                <p className="text-white/80 text-lg max-w-lg leading-relaxed font-light mt-4">
                  Secure access to all university services with your biometric identity.
                  Fast, reliable, and always protected.
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
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-400/30">
                <Shield size={24} className="text-brand-400" />
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

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
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
              Secure <span className="text-brand-500">Identity</span> Access
            </h2>
            <p className="text-surface-600 mt-3 max-w-md mx-auto">
              Authenticate with your institutional credentials to access biometric services
            </p>
          </div>

          <Suspense fallback={
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-full mb-4">
                <Loader2 className="animate-spin text-brand-600" size={24} />
              </div>
              <p className="text-surface-500">Loading authentication system...</p>
            </div>
          }>
            <LoginForm />
          </Suspense>

          <p className="text-center text-xs text-surface-400 mt-8">
            &copy; {new Date().getFullYear()} TASUED BioVault • CSC 415 Project
          </p>
        </motion.div>
      </div>
    </div>
  );
}
