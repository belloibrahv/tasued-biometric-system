'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Fingerprint, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-error-500" />
        </div>
        <h3 className="text-lg font-bold text-surface-900 mb-2">Invalid Link</h3>
        <p className="text-surface-500 mb-6">{error}</p>
        <Link href="/forgot-password" className="btn-primary inline-block px-6 py-3">
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-success-500" />
        </div>
        <h3 className="text-lg font-bold text-surface-900 mb-2">Password Reset!</h3>
        <p className="text-surface-500 mb-6">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="input-label">New Password</label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field pl-11 pr-11"
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="input-label">Confirm Password</label>
        <div className="relative">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field pl-11"
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-4 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
      <Toaster position="top-center" richColors />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="bg-brand-500 p-2.5 rounded-xl text-white">
              <Fingerprint size={28} />
            </div>
            <span className="text-xl font-bold text-surface-950">TASUED BioVault</span>
          </Link>
          <h1 className="text-2xl font-bold text-surface-950 mb-2">Reset Password</h1>
          <p className="text-surface-500">Enter your new password</p>
        </div>

        <div className="glass-card p-8">
          <Suspense fallback={<div className="text-center"><Loader2 className="animate-spin mx-auto" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
