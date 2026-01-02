'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fingerprint, Shield, QrCode, CheckCircle, ArrowRight, Loader2,
  AlertCircle, Home, Camera, Zap
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

type OnboardingStep = 'welcome' | 'biometric' | 'qr-code' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  // Check auth and user data on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        const userData = data.user;
        
        if (!userData) {
          router.push('/login');
          return;
        }

        // If admin, redirect to admin dashboard
        if (userData.type === 'admin') {
          router.push('/admin');
          return;
        }

        // If already enrolled, skip to dashboard
        if (userData.biometricEnrolled) {
          router.push('/dashboard');
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleSkipOnboarding = () => {
    setSkipped(true);
    router.push('/enroll-biometric');
  };

  const handleCompleteOnboarding = () => {
    router.push('/onboarding-complete');
  };

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to BioVault',
      description: 'Let\'s set up your account in just a few steps',
      icon: Shield,
    },
    {
      id: 'biometric',
      title: 'Biometric Enrollment',
      description: 'Secure your account with facial recognition',
      icon: Fingerprint,
    },
    {
      id: 'qr-code',
      title: 'Generate QR Code',
      description: 'Create your unique access code',
      icon: QrCode,
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold">Setup Progress</h2>
              <span className="text-sm text-slate-400">{currentStepIndex + 1} of {steps.length}</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex gap-3 mb-12">
            {steps.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isCompleted = idx < currentStepIndex;
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : isCompleted
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-600 bg-slate-700/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} />
                      ) : (
                        <StepIcon size={20} />
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-white">{step.title}</p>
                      <p className="text-xs text-slate-400">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Content Area */}
          <AnimatePresence mode="wait">
            {currentStep === 'welcome' && (
              <WelcomeStep
                key="welcome"
                user={user}
                onContinue={() => setCurrentStep('biometric')}
                onSkip={handleSkipOnboarding}
              />
            )}
            {currentStep === 'biometric' && (
              <BiometricStep
                key="biometric"
                onContinue={() => setCurrentStep('qr-code')}
                onSkip={handleSkipOnboarding}
              />
            )}
            {currentStep === 'qr-code' && (
              <QRCodeStep
                key="qr-code"
                onContinue={handleCompleteOnboarding}
                onSkip={handleSkipOnboarding}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

// Welcome Step Component
function WelcomeStep({
  user,
  onContinue,
  onSkip,
}: {
  user: any;
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800 rounded-2xl p-8 border border-slate-700"
    >
      <div className="text-center mb-8">
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Shield size={32} className="text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white mb-3">Welcome to BioVault</h1>
        <p className="text-slate-300 text-lg mb-2">
          Hi, {user?.firstName || 'there'}! 👋
        </p>
        <p className="text-slate-400">
          Let's secure your account and get you started in just a few minutes.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <FeatureItem
          icon={Fingerprint}
          title="Biometric Security"
          description="Enroll your facial recognition for secure access"
        />
        <FeatureItem
          icon={QrCode}
          title="QR Code Access"
          description="Generate your unique QR code for quick verification"
        />
        <FeatureItem
          icon={Zap}
          title="Quick Setup"
          description="Complete setup in less than 5 minutes"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
        >
          Skip for Now
        </button>
        <button
          onClick={onContinue}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// Biometric Step Component
function BiometricStep({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800 rounded-2xl p-8 border border-slate-700"
    >
      <div className="text-center mb-8">
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Camera size={32} className="text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Biometric Enrollment</h2>
        <p className="text-slate-400">
          Set up facial recognition for secure access to your account
        </p>
      </div>

      <div className="bg-slate-700/50 rounded-xl p-6 mb-8 border border-slate-600">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <CheckCircle size={24} className="text-green-500" />
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">Why biometric?</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>✓ More secure than passwords</li>
              <li>✓ Faster access verification</li>
              <li>✓ Your data stays encrypted</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
        <p className="text-sm text-blue-200">
          💡 <strong>Tip:</strong> Make sure you're in a well-lit area and your face is clearly visible for best results.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onContinue}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// QR Code Step Component
function QRCodeStep({
  onContinue,
  onSkip,
}: {
  onContinue: () => void;
  onSkip: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-slate-800 rounded-2xl p-8 border border-slate-700"
    >
      <div className="text-center mb-8">
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <QrCode size={32} className="text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Generate QR Code</h2>
        <p className="text-slate-400">
          Create your unique access code for quick verification
        </p>
      </div>

      <div className="bg-slate-700/50 rounded-xl p-6 mb-8 border border-slate-600">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <CheckCircle size={24} className="text-green-500" />
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">What's a QR Code?</h3>
            <p className="text-sm text-slate-300">
              Your personal QR code allows operators to quickly verify your identity and log your access. You can view and regenerate it anytime from your dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-8">
        <p className="text-sm text-green-200">
          ✓ Your QR code will be generated automatically after you complete biometric enrollment.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onContinue}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-medium hover:shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
        >
          Complete Setup
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

// Feature Item Component
function FeatureItem({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-slate-700/30 border border-slate-600 hover:border-slate-500 transition-colors">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Icon size={20} className="text-blue-400" />
        </div>
      </div>
      <div>
        <h3 className="text-white font-medium text-sm">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
