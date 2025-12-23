'use client';

import { useState, useEffect } from 'react';
import { QrCode, Download, RefreshCw, Clock, Copy, Check, AlertCircle } from 'lucide-react';

export default function QRCodePage() {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    setError(null);
    try {
      const res = await fetch('/api/dashboard/qr-code');
      const data = await res.json();
      
      if (res.ok) {
        setQrData(data);
      } else {
        setError(data.error || data.details || 'Failed to fetch QR code');
        console.error('QR fetch error:', data);
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const generateNewQR = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/qr-code', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setQrData(data);
      } else {
        setError(data.error || data.details || 'Failed to generate QR code');
        console.error('QR generate error:', data);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (qrData?.qrCode?.code) {
      navigator.clipboard.writeText(qrData.qrCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetchQRCode();
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="aspect-square bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Get the QR code data from the nested response
  const qrCode = qrData?.qrCode;
  const user = qrData?.user;

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My QR Code</h1>
        <p className="text-gray-500 mt-1">Use this code for identity verification</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button 
              onClick={fetchQRCode}
              className="text-sm text-red-700 underline mt-2 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* QR Code card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {qrCode?.qrCodeImage ? (
          <div className="space-y-4">
            {/* User info */}
            {user && (
              <div className="text-center pb-4 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{user.fullName}</p>
                <p className="text-sm text-gray-500">{user.matricNumber}</p>
                {user.department && (
                  <p className="text-xs text-gray-400 mt-1">{user.department} • Level {user.level}</p>
                )}
              </div>
            )}
            
            <div className="aspect-square bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-center">
              <img 
                src={qrCode.qrCodeImage} 
                alt="QR Code" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Code display */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
              <code className="flex-1 text-sm font-mono text-gray-700 truncate">
                {qrCode.code}
              </code>
              <button 
                onClick={copyCode}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} className="text-gray-500" />
                )}
              </button>
            </div>

            {/* Expiry info */}
            {qrCode.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={16} />
                <span>Expires: {new Date(qrCode.expiresAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">No QR code generated yet</p>
            <button
              onClick={generateNewQR}
              disabled={generating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      {qrCode?.qrCodeImage && (
        <div className="flex gap-3">
          <button
            onClick={generateNewQR}
            disabled={generating}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={generating ? 'animate-spin' : ''} />
            Regenerate
          </button>
          <a
            href={qrCode.qrCodeImage}
            download="my-qr-code.png"
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            Download
          </a>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Show this QR code at verification points for quick identity confirmation. 
          The code is linked to your biometric data for secure verification.
        </p>
      </div>
    </div>
  );
}