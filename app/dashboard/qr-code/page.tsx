'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  RefreshCw, Download, Share2, Copy, CheckCircle, Shield,
  Clock, Maximize2, User, QrCode, Loader2
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
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success('QR data copied to clipboard');
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My BioVault QR Code',
          text: 'Scan this QR code to verify my identity',
        });
      } catch (err) {
        toast.error('Failed to share');
      }
    } else {
      handleCopyCode();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-brand-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-surface-950">My QR Code</h1>
        <p className="text-surface-500 mt-1 text-sm md:text-base">Your unique verification QR code for campus services</p>
      </div>

      {/* Main QR Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        {/* Student Info Header */}
        <div className="bg-brand-gradient p-4 md:p-6 text-white">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <User size={24} className="md:hidden" />
              <User size={32} className="hidden md:block" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold truncate">{user?.fullName || 'Student'}</h2>
              <p className="text-white/80 font-mono text-sm md:text-base">{user?.matricNumber}</p>
              <p className="text-xs md:text-sm text-white/60 truncate">{user?.department} • {user?.level} Level</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full flex-shrink-0">
              <Shield size={16} />
              <span className="text-sm font-semibold">Verified</span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-4 md:p-8">
          <div className="flex flex-col items-center">
            {/* Refresh Timer */}
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <RefreshCw size={16} className={`text-surface-500 ${qrRefreshTime <= 30 ? 'animate-spin text-warning-500' : ''}`} />
              <span className="text-sm text-surface-500">
                Auto-refresh in <span className={`font-bold ${qrRefreshTime <= 30 ? 'text-warning-500' : 'text-brand-500'}`}>
                  {Math.floor(qrRefreshTime / 60)}:{(qrRefreshTime % 60).toString().padStart(2, '0')}
                </span>
              </span>
            </div>

            {/* QR Code */}
            <div className="relative">
              <div className="absolute inset-0 bg-brand-500/10 blur-3xl rounded-full" />
              <div className="relative bg-white p-4 md:p-6 rounded-2xl border-4 border-brand-500 shadow-brand">
                {qrCode ? (
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={qrCode.code}
                    size={typeof window !== 'undefined' && window.innerWidth < 640 ? 200 : 240}
                    level="H"
                    includeMargin={false}
                    fgColor="#0066CC"
                  />
                ) : (
                  <div className="w-[200px] h-[200px] md:w-[240px] md:h-[240px] bg-surface-100 animate-pulse rounded" />
                )}
              </div>
            </div>

            {/* Status */}
            <div className="mt-6 flex items-center gap-2 text-success-600">
              <CheckCircle size={18} />
              <span className="font-semibold">QR Code Active</span>
            </div>

            {/* Actions */}
            <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
              <button onClick={refreshQRCode} className="btn-primary py-2.5 md:py-3 px-4 md:px-6 flex items-center gap-2 text-sm md:text-base">
                <RefreshCw size={18} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={handleDownload} className="btn-outline py-2.5 md:py-3 px-4 md:px-6 flex items-center gap-2 text-sm md:text-base">
                <Download size={18} />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button onClick={handleShare} className="btn-outline py-2.5 md:py-3 px-4 md:px-6 flex items-center gap-2 text-sm md:text-base">
                <Share2 size={18} />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button onClick={handleCopyCode} className="btn-outline py-2.5 md:py-3 px-4 md:px-6 flex items-center gap-2 text-sm md:text-base">
                {copied ? <CheckCircle size={18} className="text-success-500" /> : <Copy size={18} />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* QR Code Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-500">
              <Clock size={18} />
            </div>
            <span className="font-semibold text-surface-900">Auto-Refresh</span>
          </div>
          <p className="text-sm text-surface-500">QR code refreshes every 30 seconds for security</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success-50 rounded-lg text-success-500">
              <Shield size={18} />
            </div>
            <span className="font-semibold text-surface-900">Encrypted</span>
          </div>
          <p className="text-sm text-surface-500">Contains encrypted identity data with timestamp</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
              <QrCode size={18} />
            </div>
            <span className="font-semibold text-surface-900">Universal</span>
          </div>
          <p className="text-sm text-surface-500">Works with all campus verification terminals</p>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-surface-900 mb-4">How to Use</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: 1, title: 'Present QR', desc: 'Show your QR code to the verification terminal' },
            { step: 2, title: 'Wait for Scan', desc: 'The terminal will scan and verify your identity' },
            { step: 3, title: 'Access Granted', desc: 'Upon successful verification, access is granted' },
          ].map((item) => (
            <div key={item.step} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-gradient text-white flex items-center justify-center font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h4 className="font-semibold text-surface-900">{item.title}</h4>
                <p className="text-sm text-surface-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
