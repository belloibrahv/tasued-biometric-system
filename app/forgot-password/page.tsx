'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Fingerprint, Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
        setResetToken(data.demoToken || '');
        toast.success('Reset link sent!');
      } else {
        toast.error(data.error || 'Failed to send reset link');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-surface-950 mb-2">Forgot Password?</h1>
          <p className="text-surface-500">Enter your email to receive a reset link</p>
        </div>

        <div className="glass-card p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="your.email@student.tasued.edu.ng"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-success-500" />
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">Check Your Email</h3>
              <p className="text-surface-500 mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              
              {/* Demo token display */}
              {resetToken && (
                <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-bold text-warning-600 uppercase mb-2">Demo Mode</p>
                  <p className="text-sm text-warning-700 mb-2">Use this link to reset your password:</p>
                  <Link 
                    href={`/reset-password?token=${resetToken}`}
                    className="text-brand-500 text-sm font-mono break-all hover:underline"
                  >
                    /reset-password?token={resetToken.slice(0, 20)}...
                  </Link>
                </div>
              )}

              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="btn-outline w-full py-3"
              >
                Try Another Email
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="text-brand-500 font-semibold hover:underline inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
