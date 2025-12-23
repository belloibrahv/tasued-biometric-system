'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, User, Loader2, Shield, MapPin, Calendar, RefreshCw } from 'lucide-react';

export default function VerifyPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const searchStudent = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/operator/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'Search failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const verifyStudent = async (userId: string) => {
    setVerifying(true);
    try {
      const res = await fetch('/api/operator/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, method: 'MANUAL' }),
      });
      const data = await res.json();
      if (res.ok && data.verification) {
        // Find the student from the current results
        const student = result.students?.find((s: any) => s.id === userId);
        setResult({ 
          ...result, 
          verified: true, 
          verifiedStudent: student || {
            firstName: data.verification.student?.name?.split(' ')[0],
            lastName: data.verification.student?.name?.split(' ').slice(1).join(' '),
            matricNumber: data.verification.student?.matricNumber,
          }
        });
      } else {
        console.error('Verification failed:', data.error);
      }
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  const reset = () => {
    setQuery('');
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">Manual Verification</h1>
        <p className="text-gray-500 mt-1">Search and verify student identity</p>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
              placeholder="Search by name, email, or matric number..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors"
            />
          </div>
          <button
            onClick={searchStudent}
            disabled={loading || !query.trim()}
            className="px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={18} />
                Search
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && !result.verified && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {result.students?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {result.students.map((student: any) => (
                <div key={student.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono mt-0.5">{student.matricNumber}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-gray-400" />
                          {student.department}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          Level {student.level}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {student.biometricEnrolled ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium">
                          <Shield size={12} /> Enrolled
                        </span>
                      ) : (
                        <span className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full font-medium">
                          Not Enrolled
                        </span>
                      )}
                      <button
                        onClick={() => verifyStudent(student.id)}
                        disabled={verifying}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {verifying ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={14} />
                            Verify
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : result.message ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={40} className="text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">{result.message}</p>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={40} className="text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No results</h3>
              <p className="text-sm text-gray-500">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* Verification Success */}
      {result?.verified && (
        <div className="space-y-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={28} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Verification Successful</h3>
                <p className="text-sm text-green-600">Student identity has been verified</p>
              </div>
            </div>
          </div>

          {/* Verified Student Info */}
          {result.verifiedStudent && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">
                    {result.verifiedStudent.firstName?.[0]}{result.verifiedStudent.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {result.verifiedStudent.firstName} {result.verifiedStudent.lastName}
                  </h4>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">{result.verifiedStudent.matricNumber}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400" />
                      {result.verifiedStudent.department}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400" />
                      Level {result.verifiedStudent.level}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={reset}
            className="w-full py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Verify Another Student
          </button>
        </div>
      )}

      {/* Help Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <div className="flex gap-3">
          <Search size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">How to verify</h4>
            <p className="text-sm text-blue-700">
              Enter the student's name, email, or matric number to search. 
              Once found, click the Verify button to confirm their identity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}