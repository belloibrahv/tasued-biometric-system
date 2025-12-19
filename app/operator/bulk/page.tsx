'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Users, CheckCircle, XCircle, Loader2, Download,
  FileText, AlertTriangle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function BulkVerificationPage() {
  const [matricNumbers, setMatricNumbers] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serviceSlug, setServiceSlug] = useState('library');

  const handleBulkVerify = async () => {
    const numbers = matricNumbers
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (numbers.length === 0) {
      toast.error('Please enter at least one matric number');
      return;
    }

    setLoading(true);
    setResults([]);

    const verificationResults = [];

    for (const matricNumber of numbers) {
      try {
        // Search for student
        const searchRes = await fetch(`/api/operator/search?q=${encodeURIComponent(matricNumber)}`);
        
        if (!searchRes.ok) {
          verificationResults.push({
            matricNumber,
            status: 'NOT_FOUND',
            message: 'Student not found',
          });
          continue;
        }

        const searchData = await searchRes.json();
        
        // Verify student
        const verifyRes = await fetch('/api/operator/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: searchData.student.id,
            method: 'MANUAL',
            serviceSlug,
          }),
        });

        const verifyData = await verifyRes.json();

        verificationResults.push({
          matricNumber,
          studentName: `${searchData.student.firstName} ${searchData.student.lastName}`,
          status: verifyRes.ok ? 'SUCCESS' : 'FAILED',
          message: verifyData.message || verifyData.error,
        });
      } catch (error) {
        verificationResults.push({
          matricNumber,
          status: 'ERROR',
          message: 'Network error',
        });
      }
    }

    setResults(verificationResults);
    setLoading(false);

    const successCount = verificationResults.filter(r => r.status === 'SUCCESS').length;
    toast.success(`Verified ${successCount} of ${numbers.length} students`);
  };

  const exportResults = () => {
    const csv = [
      'Matric Number,Student Name,Status,Message',
      ...results.map(r => `${r.matricNumber},${r.studentName || ''},${r.status},${r.message}`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-verification-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-950">Bulk Verification</h1>
        <p className="text-surface-500 mt-1">Verify multiple students at once</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-surface-900 mb-4">Enter Matric Numbers</h3>
          <p className="text-sm text-surface-500 mb-4">
            Enter one matric number per line
          </p>

          <div className="mb-4">
            <label className="input-label">Service</label>
            <select
              value={serviceSlug}
              onChange={(e) => setServiceSlug(e.target.value)}
              className="input-field"
            >
              <option value="library">Library</option>
              <option value="exam-hall">Exam Hall</option>
              <option value="hostel">Hostel</option>
              <option value="cafeteria">Cafeteria</option>
            </select>
          </div>

          <textarea
            value={matricNumbers}
            onChange={(e) => setMatricNumbers(e.target.value)}
            placeholder="CSC/2020/001&#10;CSC/2020/015&#10;CSC/2020/023"
            className="input-field h-48 font-mono text-sm resize-none"
          />

          <button
            onClick={handleBulkVerify}
            disabled={loading || !matricNumbers.trim()}
            className="btn-primary w-full mt-4"
          >
            {loading ? (
              <><Loader2 className="animate-spin mr-2" size={18} /> Verifying...</>
            ) : (
              <><Users size={18} className="mr-2" /> Verify All</>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-surface-900">Results</h3>
            {results.length > 0 && (
              <button onClick={exportResults} className="btn-outline py-2 px-4 text-sm">
                <Download size={16} className="mr-2" /> Export CSV
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-surface-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Results will appear here</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((result, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-3 rounded-xl flex items-center gap-3 ${
                    result.status === 'SUCCESS' ? 'bg-success-50' :
                    result.status === 'NOT_FOUND' ? 'bg-warning-50' : 'bg-error-50'
                  }`}
                >
                  {result.status === 'SUCCESS' ? (
                    <CheckCircle size={20} className="text-success-500" />
                  ) : result.status === 'NOT_FOUND' ? (
                    <AlertTriangle size={20} className="text-warning-500" />
                  ) : (
                    <XCircle size={20} className="text-error-500" />
                  )}
                  <div className="flex-1">
                    <p className="font-mono text-sm font-medium">{result.matricNumber}</p>
                    {result.studentName && (
                      <p className="text-xs text-surface-500">{result.studentName}</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    result.status === 'SUCCESS' ? 'bg-success-100 text-success-700' :
                    result.status === 'NOT_FOUND' ? 'bg-warning-100 text-warning-700' : 'bg-error-100 text-error-700'
                  }`}>
                    {result.status}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 pt-4 border-t border-surface-200 flex justify-between text-sm">
              <span className="text-success-600">
                ✓ {results.filter(r => r.status === 'SUCCESS').length} Success
              </span>
              <span className="text-warning-600">
                ⚠ {results.filter(r => r.status === 'NOT_FOUND').length} Not Found
              </span>
              <span className="text-error-600">
                ✗ {results.filter(r => r.status === 'FAILED' || r.status === 'ERROR').length} Failed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
