'use client';

import { useState } from 'react';
import { Users, Upload, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';

export default function BulkVerifyPage() {
  const [codes, setCodes] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);

  const verifyBulk = async () => {
    const codeList = codes.split('\n').map(c => c.trim()).filter(c => c);
    if (codeList.length === 0) return;

    setLoading(true);
    setResults([]);
    setProcessed(false);

    try {
      const res = await fetch('/api/operator/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: codeList, bulk: true }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setProcessed(true);
    } catch (error) {
      console.error('Bulk verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bulk Verification</h1>
        <p className="text-gray-500 mt-1">Verify multiple students at once</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            QR Codes (one per line)
          </label>
          <textarea
            value={codes}
            onChange={(e) => setCodes(e.target.value)}
            placeholder="BIOVAULT-CSC/2020/001-abc123&#10;BIOVAULT-CSC/2020/002-def456&#10;..."
            rows={8}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {codes.split('\n').filter(c => c.trim()).length} codes entered
          </p>
          <button
            onClick={verifyBulk}
            disabled={loading || !codes.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Users size={18} />
            )}
            Verify All
          </button>
        </div>
      </div>

      {/* Results summary */}
      {processed && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="text-2xl font-semibold text-green-800">{successCount}</p>
                <p className="text-sm text-green-600">Verified</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <XCircle size={24} className="text-red-600" />
              <div>
                <p className="text-2xl font-semibold text-red-800">{failCount}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">Results</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {results.map((result, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  {result.success ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <XCircle size={16} className="text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {result.student ? (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.student.firstName} {result.student.lastName}
                      </p>
                      <p className="text-xs text-gray-500 font-mono truncate">{result.code}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900 truncate font-mono">{result.code}</p>
                      <p className="text-xs text-red-500">{result.message || 'Invalid code'}</p>
                    </>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {result.success ? 'Verified' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!processed && results.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No verifications yet</h3>
          <p className="text-sm text-gray-500">Enter QR codes above to verify multiple students</p>
        </div>
      )}
    </div>
  );
}