'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, User, Loader2 } from 'lucide-react';

export default function VerifyPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchStudent = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/operator/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'Search failed' });
    } finally {
      setLoading(false);
    }
  };

  const verifyStudent = async (userId: string) => {
    try {
      const res = await fetch('/api/operator/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, method: 'MANUAL' }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ...result, verified: true });
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Verify Student</h1>
        <p className="text-gray-500 mt-1">Search and verify student identity</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
              placeholder="Search by name, email, or matric number..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={searchStudent}
            disabled={loading || !query.trim()}
            className="px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {result.students?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {result.students.map((student: any) => (
                <div key={student.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">{student.matricNumber}</p>
                      <p className="text-sm text-gray-500">
                        {student.department} • {student.level} Level
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.biometricEnrolled ? (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                          Enrolled
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                          Not Enrolled
                        </span>
                      )}
                      <button
                        onClick={() => verifyStudent(student.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : result.message ? (
            <div className="p-8 text-center">
              <XCircle size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{result.message}</p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <User size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No students found</p>
            </div>
          )}
        </div>
      )}

      {result?.verified && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={24} className="text-green-600" />
          <div>
            <p className="font-medium text-green-800">Verification Successful</p>
            <p className="text-sm text-green-600">Student identity has been verified</p>
          </div>
        </div>
      )}
    </div>
  );
}