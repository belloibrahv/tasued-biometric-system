'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileJson, FileSpreadsheet, FileText, Shield, Clock,
  CheckCircle, AlertTriangle, Lock, User, Fingerprint, History,
  Link2, Settings, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const dataCategories = [
  { id: 'personal', name: 'Personal Information', icon: User, description: 'Name, email, matric number, department' },
  { id: 'biometric', name: 'Biometric Templates', icon: Fingerprint, description: 'Encrypted fingerprint and facial data' },
  { id: 'access', name: 'Access History', icon: History, description: 'All verification and access logs' },
  { id: 'services', name: 'Connected Services', icon: Link2, description: 'Service connections and permissions' },
  { id: 'privacy', name: 'Privacy Settings', icon: Shield, description: 'Your privacy preferences' },
  { id: 'audit', name: 'Audit Logs', icon: Settings, description: 'Account activity and changes' },
];

const exportFormats = [
  { id: 'json', name: 'JSON', icon: FileJson, description: 'Machine-readable format' },
  { id: 'csv', name: 'CSV', icon: FileSpreadsheet, description: 'Spreadsheet compatible' },
  { id: 'pdf', name: 'PDF', icon: FileText, description: 'Human-readable report' },
  { id: 'fido2', name: 'FIDO2', icon: Shield, description: 'Standard biometric format' },
];

const exportHistory = [
  { id: 1, date: '2024-12-15', format: 'PDF', size: '2.4 MB', status: 'ready', expiresIn: '48 hours' },
  { id: 2, date: '2024-12-10', format: 'JSON', size: '1.8 MB', status: 'expired', expiresIn: null },
  { id: 3, date: '2024-12-01', format: 'CSV', size: '856 KB', status: 'downloaded', expiresIn: null },
];

export default function ExportPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['personal', 'access']);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one data category');
      return;
    }

    setIsExporting(true);
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsExporting(false);
    toast.success('Export ready! Check your downloads.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-950">Export Your Data</h1>
        <p className="text-surface-500 mt-1">Download your data in various formats. GDPR compliant.</p>
      </div>

      {/* Info Banner */}
      <div className="bg-info-50 border border-info-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="text-info-500 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-info-700">
          <p className="font-semibold mb-1">Your Data Rights</p>
          <p>Under GDPR and NITDA regulations, you have the right to export all your personal data. Exports are available for 72 hours after generation.</p>
        </div>
      </div>

      {/* Data Categories */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-surface-900 mb-4">Select Data to Export</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataCategories.map((category) => (
            <label
              key={category.id}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedCategories.includes(category.id)
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
                className="mt-1 w-5 h-5 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <category.icon size={18} className={selectedCategories.includes(category.id) ? 'text-brand-500' : 'text-surface-400'} />
                  <span className="font-semibold text-surface-900">{category.name}</span>
                </div>
                <p className="text-sm text-surface-500 mt-1">{category.description}</p>
              </div>
            </label>
          ))}
        </div>
        <button
          onClick={() => setSelectedCategories(dataCategories.map(c => c.id))}
          className="mt-4 text-sm text-brand-500 font-semibold hover:underline"
        >
          Select All
        </button>
      </div>

      {/* Export Format */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-surface-900 mb-4">Choose Export Format</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exportFormats.map((format) => (
            <button
              key={format.id}
              onClick={() => setSelectedFormat(format.id)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                selectedFormat === format.id
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-surface-200 hover:border-surface-300'
              }`}
            >
              <format.icon size={28} className={`mx-auto mb-2 ${selectedFormat === format.id ? 'text-brand-500' : 'text-surface-400'}`} />
              <p className="font-semibold text-surface-900">{format.name}</p>
              <p className="text-xs text-surface-500">{format.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-surface-900 mb-4">Export Options</h2>
        <label className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-surface-500" />
            <div>
              <p className="font-semibold text-surface-900">Password Protection</p>
              <p className="text-sm text-surface-500">Encrypt export with a password</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isEncrypted}
            onChange={(e) => setIsEncrypted(e.target.checked)}
            className="w-5 h-5 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
          />
        </label>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || selectedCategories.length === 0}
        className="btn-primary w-full py-4 flex items-center justify-center gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Generating Export...
          </>
        ) : (
          <>
            <Download size={20} />
            Generate Export
          </>
        )}
      </button>

      {/* Export History */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-surface-200">
          <h2 className="font-bold text-surface-900">Export History</h2>
          <p className="text-sm text-surface-500">Your previous data exports</p>
        </div>
        <div className="divide-y divide-surface-100">
          {exportHistory.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-surface-50">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  item.status === 'ready' ? 'bg-success-50 text-success-500' :
                  item.status === 'expired' ? 'bg-surface-100 text-surface-400' :
                  'bg-brand-50 text-brand-500'
                }`}>
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-semibold text-surface-900">Export - {item.date}</p>
                  <p className="text-sm text-surface-500">{item.format} • {item.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {item.status === 'ready' && (
                  <span className="text-xs text-surface-500 flex items-center gap-1">
                    <Clock size={12} />
                    Expires in {item.expiresIn}
                  </span>
                )}
                <span className={`badge ${
                  item.status === 'ready' ? 'badge-success' :
                  item.status === 'expired' ? 'bg-surface-100 text-surface-500' :
                  'badge-brand'
                }`}>
                  {item.status === 'ready' ? 'Ready' : item.status === 'expired' ? 'Expired' : 'Downloaded'}
                </span>
                {item.status === 'ready' && (
                  <button className="btn-outline py-1.5 px-3 text-sm">
                    <Download size={14} className="mr-1" />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GDPR Section */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-warning-500" />
          Data Deletion Request
        </h2>
        <p className="text-sm text-surface-600 mb-4">
          You have the right to request complete deletion of your data from our systems. This action is irreversible and will remove all your biometric data, access history, and account information.
        </p>
        <button className="btn-danger py-2 px-4 text-sm">
          Request Data Deletion
        </button>
      </div>
    </div>
  );
}
