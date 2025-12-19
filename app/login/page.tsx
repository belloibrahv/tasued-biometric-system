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

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        toast.error('Login Failed', { description: data.error });
        setLoading(false);
        return;
      }

      toast.success('Login Successful!');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      const targetUrl = data.user.type === 'admin' 
        ? (data.user.role === 'OPERATOR' ? '/operator' : '/admin')
        : redirect;
      
      setTimeout(() => { window.location.href = targetUrl; }, 500);
    } catch (err) {
      setError('Connection error. Please try again.');
      toast.error('Network Error');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Login Type Toggle */}
      <div className="flex bg-surface-100 p-1 rounded-xl mb-8">
        <button
          onClick={() => setLoginType('student')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            loginType === 'student' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500'
          }`}
        >
          <User size={16} /> Student
        </button>
        <button
          onClick={() => setLoginType('admin')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            loginType === 'admin' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500'
          }`}
        >
          <Users size={16} /> Staff/Admin
        </button>
      </div>

      <div className="glass-card p-8">
        {error && (
          <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-xl flex items-center gap-3 text-error-700 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">
              {loginType === 'student' ? 'Email or Matric Number' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-11"
                placeholder={loginType === 'student' ? 'CSC/2020/001 or email' : 'admin@tasued.edu.ng'}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="input-label mb-0">Password</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-brand-500 hover:text-brand-600">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-11 pr-11"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-surface-100 rounded-xl">
          <p className="text-xs font-bold text-surface-500 uppercase mb-2">Demo Credentials</p>
          {loginType === 'student' ? (
            <div className="text-sm text-surface-600">
              <p><span className="font-medium">Email:</span> john.doe@student.tasued.edu.ng</p>
              <p><span className="font-medium">Password:</span> studentPassword123!</p>
            </div>
          ) : (
            <div className="text-sm text-surface-600">
              <p><span className="font-medium">Admin:</span> admin@tasued.edu.ng</p>
              <p><span className="font-medium">Password:</span> adminPassword123!</p>
            </div>
          )}
        </div>
      </div>

      {loginType === 'student' && (
        <p className="text-center text-sm text-surface-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand-500 font-semibold hover:underline">
            Enroll now
          </Link>
        </p>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" richColors />

      {/* Left Panel */}
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

          <h1 className="text-4xl font-bold text-white mb-6">Welcome Back</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Access your digital identity and manage your campus services with a single secure login.
          </p>
        </div>

        <div className="relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <Shield size={24} className="text-white" />
              <h3 className="font-bold text-white">Secure Authentication</h3>
            </div>
            <div className="flex gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-success-400" /> Encrypted</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-success-400" /> 2FA Ready</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-success-400" /> Biometric</span>
            </div>
          </div>
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
              <div className="bg-brand-500 p-2.5 rounded-xl text-white">
                <Fingerprint size={28} />
              </div>
              <span className="text-xl font-bold text-surface-950">TASUED BioVault</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-surface-950 mb-2">Sign In</h2>
            <p className="text-surface-500">Access your BioVault account</p>
          </div>

          <Suspense fallback={<div className="text-center"><Loader2 className="animate-spin mx-auto" size={32} /></div>}>
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
