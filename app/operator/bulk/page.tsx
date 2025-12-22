'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2, Download, AlertCircle, RefreshCw } from 'lucide-react';

export default function BulkVerifyPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadAndVerify = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/operator/bulk-verify', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      setResults({ success: false, message: 'Upload failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'Matric Number,First Name,Last Name\n12345,John,Doe\n12346,Jane,Smith';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'verification-template.csv';
    a.click();
  };

  const reset = () => {
    setFile(null);
    setResults(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">Bulk Verification</h1>
        <p className="text-gray-500 mt-1">Verify multiple students at once using CSV</p>
      </div>

      {/* Upload Card */}
      {!results ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-8">
            {/* File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={32} className="text-gray-400" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {file ? file.name : 'Upload CSV File'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {file ? 'Ready to verify' : 'Drag and drop your CSV file here, or click to select'}
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <FileText size={18} />
                {file ? 'Change File' : 'Select File'}
              </label>
            </div>

            {/* File Info */}
            {file && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">{file.name}</p>
                    <p className="text-sm text-blue-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Template Info */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">CSV Format Required</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Your file must contain columns: Matric Number, First Name, Last Name
                  </p>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium hover:text-blue-700"
                  >
                    <Download size={14} />
                    Download Template
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={uploadAndVerify}
                disabled={!file || loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Verify Students
                  </>
                )}
              </button>
              {file && (
                <button
                  onClick={() => setFile(null)}
                  className="px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Results */
        <div className="space-y-4">
          {/* Summary */}
          <div className={`rounded-xl border-2 p-6 ${
            results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                results.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {results.success ? (
                  <CheckCircle size={28} className="text-green-600" />
                ) : (
                  <XCircle size={28} className="text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${
                  results.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {results.success ? 'Verification Complete' : 'Verification Failed'}
                </h3>
                <p className={`text-sm ${
                  results.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {results.message}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {results.stats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-semibold text-gray-900">{results.stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-semibold text-green-600">{results.stats.verified}</p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-semibold text-red-600">{results.stats.failed}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
            </div>
          )}

          {/* Results List */}
          {results.results && results.results.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h4 className="font-semibold text-gray-900">Verification Results</h4>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {results.results.map((r: any, idx: number) => (
                  <div key={idx} className="px-6 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      r.success ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {r.success ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{r.matricNumber}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${
                      r.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {r.success ? 'Verified' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Verify Another Batch
            </button>
            {results.downloadUrl && (
              <a
                href={results.downloadUrl}
                download="verification-results.csv"
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Results
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
