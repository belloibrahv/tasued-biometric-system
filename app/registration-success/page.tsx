'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function RegistrationSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/onboarding');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleContinue = () => {
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        {/* Success Icon */}
        <motion.div
          className="mb-8"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/50">
            <CheckCircle size={48} className="text-white" />
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome to BioVault!
          </h1>
          <p className="text-slate-300 text-lg mb-2">
            {user?.firstName ? `Hi ${user.firstName}!` : 'Registration successful!'}
          </p>
          <p className="text-slate-400 mb-8">
            Your account has been created successfully. Let's complete your setup to get started.
          </p>

          {/* Account Details */}
          <div className="bg-slate-700/50 rounded-xl p-6 mb-8 border border-slate-600 text-left space-y-3">
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Matric Number</p>
              <p className="text-white font-medium">{user?.matricNumber}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Department</p>
              <p className="text-white font-medium">{user?.department || 'Not set'}</p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-200">
              <strong>Next:</strong> We'll guide you through biometric enrollment and QR code generation.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
            >
              Continue to Setup
              <ArrowRight size={18} />
            </button>
            <p className="text-sm text-slate-400">
              Redirecting in <span className="font-bold text-slate-300">{countdown}s</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
