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
import { supabase } from '@/lib/supabase';

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
      let loginEmail = email;

      // Logic to resolve Matric Number to Email if needed
      if (loginType === 'student' && !email.includes('@')) {
        console.log('Login: Resolving matric number to email...');
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('matricNumber', email.toUpperCase())
          .single();

        if (userError || !userData) {
          console.error('Login: Matric number not found in users table', userError);
          setError('Student profile not found. If you are a new student, please enroll first.');
          setLoading(false);
          return;
        }
        loginEmail = userData.email;
        console.log(`Login: Resolved to ${loginEmail}`);
      }

      // Login with Supabase
      console.log('Login: Signing in with Supabase Auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        console.error('Login: Supabase Auth error', error);
        setError(error.message);
        toast.error('Login Failed', { description: error.message });
        setLoading(false);
        return;
      }

      if (data.session) {
        console.log('Login: Session established');
        toast.success('Login Successful!');

        // Store session for legacy app logic
        localStorage.setItem('token', data.session.access_token);

        // Fetch user profile from public table to return rich data to local storage
        console.log(`Login: Fetching profile from ${loginType === 'admin' ? 'admins' : 'users'} table...`);
        const { data: profile, error: profileError } = await supabase
          .from(loginType === 'admin' ? 'admins' : 'users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('Login: Profile not found in public database after auth success', profileError);
        }

        const userObj = {
          ...(profile || {}),
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || (loginType === 'admin' ? 'ADMIN' : 'STUDENT'),
          type: loginType
        };

        localStorage.setItem('user', JSON.stringify(userObj));
        console.log('Login: User data saved to localStorage');

        // Set cookie for middleware with explicit domain and security flags
        document.cookie = `auth-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax; ${window.location.protocol === 'https:' ? 'Secure;' : ''}`;

        const targetUrl = loginType === 'admin'
          ? ((userObj as any).role === 'OPERATOR' ? '/operator' : '/admin')
          : (redirect === '/login' ? '/dashboard' : redirect); // Avoid self-redirect

        console.log(`Login: Redirecting to ${targetUrl}`);
        // Use replace to prevent back-button loops
        window.location.replace(targetUrl);
      }
    } catch (err: any) {
      console.error('Login: Unexpected catch block error', err);
      setError('Connection error. Please check your internet and try again.');
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
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${loginType === 'student' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500'
            }`}
        >
          <User size={16} /> Student
        </button>
        <button
          onClick={() => setLoginType('admin')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${loginType === 'admin' ? 'bg-white shadow-sm text-brand-600' : 'text-surface-500'
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
              The Future of <br />
              <span className="text-brand-400">Campus Identity.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-md font-medium">
              Join the elite academic community using the next generation of biometric identity management. Secure, seamless, and world-class.
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
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                <Shield size={24} className="text-brand-400" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-tight">AES-256 Vault</h3>
                <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mt-0.5">Quantum-Resistant Encryption</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.1em]">Verified Nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.1em]">Active Sync</span>
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
