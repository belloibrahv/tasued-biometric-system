'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, User, CheckCircle, XCircle, Fingerprint, QrCode,
  Camera, AlertTriangle, Loader2, Shield, Clock
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function VerifyStudentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

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
        return;
      }

      setStudent(data.student);
    } catch (error) {
      toast.error('Failed to search student');
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

      if (res.ok) {
        toast.success('Student verified successfully!');
      } else {
        toast.error(data.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed');
      setVerificationResult({
        success: false,
        message: 'Network error occurred',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-950">Verify Student</h1>
        <p className="text-surface-500 mt-1">Search and verify student identity</p>
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
              placeholder="Enter matric number or email..."
              className="input-field pl-12"
            />
          </div>
          <button
            onClick={searchStudent}
            disabled={loading}
            className="btn-primary px-8"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
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
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  {student.profilePhoto ? (
                    <img src={student.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={40} />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
                  <p className="text-brand-100 font-mono text-lg">{student.matricNumber}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-brand-100">
                    <span>{student.department}</span>
                    <span>•</span>
                    <span>{student.level} Level</span>
                  </div>
                </div>
                <div className="ml-auto">
                  {student.biometricEnrolled ? (
                    <span className="bg-success-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      <Shield size={16} /> Biometric Enrolled
                    </span>
                  ) : (
                    <span className="bg-warning-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                      <AlertTriangle size={16} /> Not Enrolled
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Methods */}
            <div className="p-6">
              <h3 className="font-bold text-surface-900 mb-4">Verification Methods</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => verifyStudent('QR_CODE')}
                  disabled={verifying}
                  className="p-4 bg-surface-50 rounded-xl hover:bg-brand-50 hover:border-brand-200 border-2 border-transparent transition-all text-center"
                >
                  <QrCode size={32} className="mx-auto mb-2 text-brand-500" />
                  <span className="text-sm font-medium">QR Code</span>
                </button>
                <button
                  onClick={() => verifyStudent('FINGERPRINT')}
                  disabled={verifying || !student.biometricEnrolled}
                  className="p-4 bg-surface-50 rounded-xl hover:bg-success-50 hover:border-success-200 border-2 border-transparent transition-all text-center disabled:opacity-50"
                >
                  <Fingerprint size={32} className="mx-auto mb-2 text-success-500" />
                  <span className="text-sm font-medium">Fingerprint</span>
                </button>
                <button
                  onClick={() => verifyStudent('FACIAL')}
                  disabled={verifying || !student.biometricEnrolled}
                  className="p-4 bg-surface-50 rounded-xl hover:bg-purple-50 hover:border-purple-200 border-2 border-transparent transition-all text-center disabled:opacity-50"
                >
                  <Camera size={32} className="mx-auto mb-2 text-purple-500" />
                  <span className="text-sm font-medium">Face ID</span>
                </button>
                <button
                  onClick={() => verifyStudent('MANUAL')}
                  disabled={verifying}
                  className="p-4 bg-surface-50 rounded-xl hover:bg-accent-50 hover:border-accent-200 border-2 border-transparent transition-all text-center"
                >
                  <User size={32} className="mx-auto mb-2 text-accent-500" />
                  <span className="text-sm font-medium">Manual</span>
                </button>
              </div>

              {verifying && (
                <div className="mt-6 text-center">
                  <Loader2 className="animate-spin mx-auto text-brand-500" size={32} />
                  <p className="text-surface-500 mt-2">Verifying...</p>
                </div>
              )}
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-6 border-t ${
                  verificationResult.success ? 'bg-success-50' : 'bg-error-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {verificationResult.success ? (
                    <CheckCircle size={48} className="text-success-500" />
                  ) : (
                    <XCircle size={48} className="text-error-500" />
                  )}
                  <div>
                    <h4 className={`text-xl font-bold ${
                      verificationResult.success ? 'text-success-700' : 'text-error-700'
                    }`}>
                      {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
                    </h4>
                    <p className={verificationResult.success ? 'text-success-600' : 'text-error-600'}>
                      {verificationResult.message}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-surface-500">
                      <Clock size={14} className="inline mr-1" />
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!student && !loading && (
        <div className="glass-card p-12 text-center">
          <Search size={48} className="mx-auto text-surface-300 mb-4" />
          <h3 className="text-lg font-semibold text-surface-700">Search for a Student</h3>
          <p className="text-surface-500 mt-2">Enter a matric number or email to begin verification</p>
        </div>
      )}
    </div>
  );
}
