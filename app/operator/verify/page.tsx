'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, CheckCircle, XCircle, Fingerprint, QrCode,
  Camera, AlertTriangle, Loader2, Shield, Clock, TrendingUp
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function VerifyStudentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState({ todayCount: 0, successRate: 0 });
  const audioContext = useRef<AudioContext | null>(null);

  const fetchSessionStats = async () => {
    try {
      const res = await fetch('/api/operator/stats');
      if (res.ok) {
        const data = await res.json();
        setSessionStats({
          todayCount: data.stats.todayVerifications,
          successRate: data.stats.successRate,
        });
      }
    } catch (error) {
      console.error('Failed to fetch session stats');
    }
  };

  useEffect(() => {
    fetchSessionStats();
    // Initialize audio context on first interaction
    const initAudio = () => {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    return () => window.removeEventListener('click', initAudio);
  }, []);

  const playSound = (success: boolean) => {
    if (!audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(success ? 880 : 220, audioContext.current.currentTime);
    osc.frequency.exponentialRampToValueAtTime(success ? 110 : 110, audioContext.current.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioContext.current.destination);

    osc.start();
    osc.stop(audioContext.current.currentTime + 0.1);
  };

  const searchStudent = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a matric number or email');
      return;
    }

    setLoading(true);
    setStudent(null);
    setVerificationResult(null);

    try {
      const res = await fetch(`/api/operator/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Student not found');
        playSound(false);
        return;
      }

      setStudent(data.student);
    } catch (error) {
      toast.error('Failed to search student');
      playSound(false);
    } finally {
      setLoading(false);
    }
  };

  const verifyStudent = async (method: 'QR_CODE' | 'FINGERPRINT' | 'FACIAL' | 'MANUAL') => {
    if (!student) return;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/operator/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          method,
          serviceSlug: 'library', // Default service
        }),
      });

      const data = await res.json();

      setVerificationResult({
        success: res.ok,
        message: data.message || (res.ok ? 'Verification successful' : 'Verification failed'),
        details: data,
      });

      playSound(res.ok);

      if (res.ok) {
        toast.success('Student verified successfully!');
        fetchSessionStats();
        // Auto-reset after 5 seconds
        setTimeout(() => {
          setStudent(null);
          setVerificationResult(null);
          setSearchQuery('');
        }, 5000);
      } else {
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed');
      playSound(false);
      setVerificationResult({
        success: false,
        message: 'Network error occurred',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header & Session Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-950">Verify Student</h1>
          <p className="text-surface-500 mt-1">Rapid identity verification workflow</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-surface-200 flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-500">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-xs text-surface-500 font-medium">Today</p>
              <p className="text-sm font-bold text-surface-900">{sessionStats.todayCount}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-surface-200 flex items-center gap-3">
            <div className="p-2 bg-success-50 rounded-lg text-success-500">
              <CheckCircle size={16} />
            </div>
            <div>
              <p className="text-xs text-surface-500 font-medium">Success</p>
              <p className="text-sm font-bold text-surface-900">{sessionStats.successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Box */}
      <div className="glass-card p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
              placeholder="Scan QR or enter matric number..."
              className="input-field pl-12 h-14 text-lg"
              autoFocus
            />
          </div>
          <button
            onClick={searchStudent}
            disabled={loading}
            className="btn-primary px-10 h-14 text-lg"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Search'}
          </button>
        </div>
      </div>

      {/* Student Card */}
      <AnimatePresence mode="wait">
        {student && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card overflow-hidden"
          >
            {/* Student Info Header */}
            <div className="bg-brand-gradient p-6 text-white">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden backdrop-blur-md border border-white/30">
                  {student.profilePhoto ? (
                    <img src={student.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} />
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{student.firstName} {student.lastName}</h2>
                  <p className="text-brand-100 font-mono text-xl mt-1">{student.matricNumber}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-brand-100">
                    <span className="bg-white/20 px-3 py-1 rounded-full">{student.department}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full">{student.level} Level</span>
                  </div>
                </div>
                <div className="ml-auto flex flex-col items-end gap-3">
                  {student.biometricEnrolled ? (
                    <div className="bg-success-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                      <Shield size={20} /> Biometric Enrolled
                    </div>
                  ) : (
                    <div className="bg-error-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                      <AlertTriangle size={20} /> NOT ENROLLED
                    </div>
                  )}
                  {student.isActive ? (
                    <div className="text-xs bg-white/20 px-2 py-1 rounded text-white font-bold tracking-widest uppercase">
                      Account Active
                    </div>
                  ) : (
                    <div className="text-xs bg-error-500 text-white px-2 py-1 rounded font-bold tracking-widest uppercase">
                      Account Disabled
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Methods */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-surface-900">Choose Verification Method</h3>
                <span className="text-sm text-surface-400">Select one to finalize</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => verifyStudent('QR_CODE')}
                  disabled={verifying}
                  className="group p-6 bg-surface-50 rounded-2xl hover:bg-brand-50 hover:border-brand-500/30 border-2 border-transparent transition-all text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl shadow-sm flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform">
                    <QrCode size={32} />
                  </div>
                  <span className="text-sm font-bold text-surface-700">QR Code</span>
                </button>

                <button
                  onClick={() => verifyStudent('FINGERPRINT')}
                  disabled={verifying || !student.biometricEnrolled}
                  className="group p-6 bg-surface-50 rounded-2xl hover:bg-success-50 hover:border-success-500/30 border-2 border-transparent transition-all text-center disabled:opacity-40 disabled:grayscale"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl shadow-sm flex items-center justify-center text-success-500 group-hover:scale-110 transition-transform">
                    <Fingerprint size={32} />
                  </div>
                  <span className="text-sm font-bold text-surface-700">Fingerprint</span>
                </button>

                <button
                  onClick={() => verifyStudent('FACIAL')}
                  disabled={verifying || !student.biometricEnrolled}
                  className="group p-6 bg-surface-50 rounded-2xl hover:bg-purple-50 hover:border-purple-500/30 border-2 border-transparent transition-all text-center disabled:opacity-40 disabled:grayscale"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <Camera size={32} />
                  </div>
                  <span className="text-sm font-bold text-surface-700">Face ID</span>
                </button>

                <button
                  onClick={() => verifyStudent('MANUAL')}
                  disabled={verifying}
                  className="group p-6 bg-surface-50 rounded-2xl hover:bg-accent-50 hover:border-accent-500/30 border-2 border-transparent transition-all text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl shadow-sm flex items-center justify-center text-accent-500 group-hover:scale-110 transition-transform">
                    <User size={32} />
                  </div>
                  <span className="text-sm font-bold text-surface-700">Manual</span>
                </button>
              </div>

              {verifying && (
                <div className="mt-8 pt-8 border-t border-surface-100 text-center">
                  <div className="relative w-16 h-16 mx-auto">
                    <Loader2 className="animate-spin text-brand-500 w-full h-full" />
                    <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-600" size={20} />
                  </div>
                  <p className="text-surface-600 font-bold mt-4">Security Verification in Progress</p>
                  <p className="text-surface-400 text-sm">Please wait while we secure the perimeter</p>
                </div>
              )}
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-8 border-t-4 ${verificationResult.success ? 'bg-success-50 border-success-500' : 'bg-error-50 border-error-500'
                  }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${verificationResult.success ? 'bg-success-500 text-white' : 'bg-error-500 text-white'
                    }`}>
                    {verificationResult.success ? <CheckCircle size={36} /> : <XCircle size={36} />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-2xl font-black uppercase tracking-tight ${verificationResult.success ? 'text-success-800' : 'text-error-800'
                      }`}>
                      {verificationResult.success ? 'Access Granted' : 'Verification Denied'}
                    </h4>
                    <p className={`font-medium ${verificationResult.success ? 'text-success-700' : 'text-error-700'}`}>
                      {verificationResult.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-surface-500 flex items-center justify-end gap-1">
                      <Clock size={16} />
                      {new Date().toLocaleTimeString()}
                    </div>
                    {verificationResult.success && (
                      <p className="text-xs text-success-600 font-bold mt-1">Transaction ID: {verificationResult.details?.verification?.id?.slice(0, 8)}</p>
                    )}
                  </div>
                </div>
                {verificationResult.success && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-surface-400 animate-pulse">Auto-resetting in 5 seconds...</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!student && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-20 text-center"
        >
          <div className="w-24 h-24 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ScanLine size={48} className="text-surface-300" />
          </div>
          <h3 className="text-2xl font-bold text-surface-900">Ready for Verification</h3>
          <p className="text-surface-500 mt-2 max-w-sm mx-auto">
            Please search for a student using their matric number or scan their digital identity QR code.
          </p>
        </motion.div>
      )}
    </div>
  );
}

const ScanLine = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);
