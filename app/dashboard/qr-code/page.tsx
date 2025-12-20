'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  RefreshCw, Download, Copy, CheckCircle, Clock, User, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function QRCodePage() {
  const [qrRefreshTime, setQrRefreshTime] = useState(300);
  const [qrCode, setQrCode] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch QR code from API
  const fetchQRCode = async () => {
    try {
      const res = await fetch('/api/dashboard/qr-code');
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setUser(data.user);
        setQrRefreshTime(data.qrCode.secondsRemaining);
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh QR code
  const refreshQRCode = async () => {
    try {
      const res = await fetch('/api/dashboard/qr-code', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setQrRefreshTime(data.qrCode.secondsRemaining);
        toast.success('QR Code refreshed!');
      }
    } catch (error) {
      toast.error('Failed to refresh QR code');
    }
  };

  useEffect(() => {
    fetchQRCode();
  }, []);

  // QR Code countdown timer
  useEffect(() => {
    if (qrRefreshTime <= 0) {
      refreshQRCode();
      return;
    }
    const timer = setInterval(() => {
      setQrRefreshTime((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [qrRefreshTime]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(qrCode?.code || '');
    setCopied(true);
    toast.success('QR code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = 'biovault-qr-code.png';
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
    toast.success('QR Code downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900">My Verification QR</h1>
        <p className="text-gray-600 mt-1">Scan this at campus services</p>
      </div>

      {/* Main QR Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Student Info Header */}
        <div className="bg-blue-600 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h2 className="font-bold">{user?.fullName || 'Student'}</h2>
              <p className="text-white/80 text-sm font-mono">{user?.matricNumber}</p>
              <p className="text-xs text-white/60">{user?.department} • {user?.level} Level</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-8">
          <div className="flex flex-col items-center">
            {/* Refresh Timer */}
            <div className="flex items-center gap-2 mb-6">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm text-gray-500">
                Expires in <span className={`font-bold ${qrRefreshTime <= 30 ? 'text-orange-500' : 'text-blue-600'}`}>
                  {Math.floor(qrRefreshTime / 60)}:{(qrRefreshTime % 60).toString().padStart(2, '0')}
                </span>
              </span>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-6">
              {qrCode ? (
                <QRCodeSVG
                  id="qr-code-svg"
                  value={qrCode.code}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#0066CC"
                />
              ) : (
                <div className="w-[200px] h-[200px] bg-gray-100 animate-pulse rounded" />
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-green-600 mb-6">
              <CheckCircle size={18} />
              <span className="font-semibold">QR Code Active</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap justify-center gap-3">
              <button 
                onClick={refreshQRCode} 
                className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button 
                onClick={handleDownload} 
                className="btn-outline py-2 px-4 flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Download
              </button>
              <button 
                onClick={handleCopyCode} 
                className="btn-outline py-2 px-4 flex items-center gap-2 text-sm"
              >
                {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">How to Use</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: 1, title: 'Present QR', desc: 'Show your QR code to the verification terminal' },
            { step: 2, title: 'Wait for Scan', desc: 'The terminal will scan and verify your identity' },
            { step: 3, title: 'Access Granted', desc: 'Upon successful verification, access is granted' },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}