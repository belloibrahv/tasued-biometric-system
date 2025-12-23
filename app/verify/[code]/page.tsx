'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, User, GraduationCap, Building, Calendar, Shield, Clock, AlertTriangle } from 'lucide-react';

interface StudentData {
  id: string;
  matricNumber: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  department?: string;
  level?: string;
  profilePhoto?: string;
  biometricEnrolled: boolean;
  enrollmentDate: string;
}

interface VerificationResult {
  success: boolean;
  student?: StudentData;
  qrInfo?: {
    id: string;
    code: string;
    expiresAt: string;
    active: boolean;
    usageCount: number;
  };
  timestamp: string;
  verification?: {
    method: string;
    status: string;
  };
  message?: string;
  error?: string;
}

export default function VerifyPage({ params }: { params: { code: string } }) {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyCode = async () => {
      try {
        const res = await fetch(`/api/verify-qr/${encodeURIComponent(params.code)}`);
        const data = await res.json();
        
        if (res.ok) {
          setResult({ success: true, ...data });
        } else {
          setResult({ success: false, error: data.error || 'Verification failed', timestamp: new Date().toISOString() });
        }
      } catch (error) {
        setResult({ success: false, error: 'Network error. Please try again.', timestamp: new Date().toISOString() });
      } finally {
        setLoading(false);
      }
    };

    verifyCode();
  }, [params.code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying identity...</p>
        </div>
      </div>
    );
  }

  if (!result?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
            <p className="text-gray-500 mt-2">{result?.error || 'Invalid or expired QR code'}</p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Possible reasons:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>QR code has expired</li>
                <li>QR code has been revoked</li>
                <li>Invalid QR code format</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              TASUED BioVault Identity System
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Verified at {new Date(result?.timestamp || '').toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const student = result.student!;
  const qrInfo = result.qrInfo;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold">Identity Verified</h1>
          <p className="text-green-100 text-sm mt-1">This student is registered in TASUED BioVault</p>
        </div>

        {/* Student Info */}
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200">
              {student.profilePhoto ? (
                <img src={student.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h2>
              {student.otherNames && (
                <p className="text-gray-500 text-sm">{student.otherNames}</p>
              )}
              <p className="text-blue-600 font-mono font-medium">{student.matricNumber}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            {student.department && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                  <p className="font-medium text-gray-900">{student.department}</p>
                </div>
              </div>
            )}

            {student.level && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <GraduationCap size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Level</p>
                  <p className="font-medium text-gray-900">{student.level}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Biometric Status</p>
                <p className="font-medium text-gray-900">
                  {student.biometricEnrolled ? 'Enrolled ✓' : 'Not Enrolled'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Registered Since</p>
                <p className="font-medium text-gray-900">
                  {new Date(student.enrollmentDate).toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* QR Info */}
          {qrInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Clock size={16} />
                <span>QR Code expires: {new Date(qrInfo.expiresAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Scan count: {qrInfo.usageCount}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>TASUED BioVault</span>
            <span>{new Date(result.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
