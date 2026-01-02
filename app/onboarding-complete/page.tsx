'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

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
          className="mb-8 relative"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/50">
            <CheckCircle size={48} className="text-white" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-500"
            animate={{ scale: [1, 1.3], opacity: [1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>

        {/* Confetti Animation */}
        <motion.div className="mb-8">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{ y: 0, x: 0, opacity: 1 }}
              animate={{
                y: -100,
                x: Math.cos(i * Math.PI / 3) * 80,
                opacity: 0,
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
              style={{
                left: '50%',
                top: '50%',
              }}
            >
              {['🎉', '✨', '🎊', '⭐', '🚀', '💫'][i]}
            </motion.div>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-2">
            <Sparkles size={32} className="text-yellow-400" />
            All Set!
          </h1>
          <p className="text-slate-300 text-lg mb-2">
            {user?.firstName ? `Great job, ${user.firstName}!` : 'Setup complete!'}
          </p>
          <p className="text-slate-400 mb-8">
            Your account is now fully configured and ready to use.
          </p>

          {/* Completed Items */}
          <div className="space-y-3 mb-8">
            <CompletedItem title="Account Created" />
            <CompletedItem title="Biometric Enrolled" />
            <CompletedItem title="QR Code Generated" />
          </div>

          {/* What's Next */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-200">
              <strong>You can now:</strong> Access all university services, verify your identity with biometrics, and track your attendance.
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard
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

function CompletedItem({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
    >
      <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
      <span className="text-white font-medium text-sm">{title}</span>
    </motion.div>
  );
}
