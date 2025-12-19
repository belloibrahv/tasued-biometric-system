'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Eye, Database, MapPin, Clock, User, Building2,
  FileText, Download, AlertTriangle, CheckCircle, Lock
} from 'lucide-react';

const dataAccessLog = [
  { id: 1, accessor: 'Library System', type: 'Service', data: 'Student ID, Name', timestamp: '2024-12-19 10:30:00', purpose: 'Access verification' },
  { id: 2, accessor: 'Exam Management', type: 'Service', data: 'Student ID, Photo', timestamp: '2024-12-18 09:00:00', purpose: 'Exam verification' },
  { id: 3, accessor: 'Admin Portal', type: 'Admin', data: 'Full profile', timestamp: '2024-12-17 14:20:00', purpose: 'Account review' },
  { id: 4, accessor: 'Cafeteria POS', type: 'Service', data: 'Student ID', timestamp: '2024-12-17 12:30:00', purpose: 'Payment verification' },
];

const dataCategories = [
  { name: 'Personal Information', items: ['Full Name', 'Email', 'Phone', 'Date of Birth'], retention: '5 years after graduation' },
  { name: 'Academic Data', items: ['Matric Number', 'Department', 'Level'], retention: 'Permanent' },
  { name: 'Biometric Data', items: ['Fingerprint Template', 'Facial Encoding'], retention: '1 year after graduation' },
  { name: 'Access Logs', items: ['Verification History', 'Service Access'], retention: '2 years' },
];

export default function PrivacyPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-950">Privacy Center</h1>
        <p className="text-surface-500 mt-1">Complete transparency about your data</p>
      </div>

      {/* Privacy Score */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-surface-900">Privacy Score</h2>
            <p className="text-sm text-surface-500">Based on your current settings</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-success-500">92</div>
            <div className="text-sm text-surface-500">out of 100</div>
          </div>
        </div>
        <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden">
          <div className="h-full bg-success-gradient rounded-full" style={{ width: '92%' }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <CheckCircle size={20} className="mx-auto text-success-500 mb-1" />
            <p className="text-xs text-surface-500">Data Encrypted</p>
          </div>
          <div>
            <CheckCircle size={20} className="mx-auto text-success-500 mb-1" />
            <p className="text-xs text-surface-500">2FA Enabled</p>
          </div>
          <div>
            <AlertTriangle size={20} className="mx-auto text-warning-500 mb-1" />
            <p className="text-xs text-surface-500">Review Permissions</p>
          </div>
        </div>
      </div>

      {/* Who Accessed Your Data */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <Eye size={24} className="text-brand-500" />
            <div>
              <h2 className="font-bold text-surface-900">Who Accessed Your Data</h2>
              <p className="text-sm text-surface-500">Recent data access by services and administrators</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-surface-100">
          {dataAccessLog.map((log) => (
            <div key={log.id} className="p-4 hover:bg-surface-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${log.type === 'Admin' ? 'bg-warning-50 text-warning-500' : 'bg-brand-50 text-brand-500'}`}>
                    {log.type === 'Admin' ? <User size={18} /> : <Building2 size={18} />}
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900">{log.accessor}</p>
                    <p className="text-sm text-surface-500">Accessed: {log.data}</p>
                    <p className="text-xs text-surface-400 mt-1">Purpose: {log.purpose}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${log.type === 'Admin' ? 'badge-warning' : 'badge-brand'}`}>
                    {log.type}
                  </span>
                  <p className="text-xs text-surface-400 mt-2 flex items-center gap-1 justify-end">
                    <Clock size={12} />
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-surface-50 text-center">
          <button className="text-sm text-brand-500 font-semibold hover:underline">
            View Full Access History
          </button>
        </div>
      </div>

      {/* What Data Is Stored */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <Database size={24} className="text-brand-500" />
            <div>
              <h2 className="font-bold text-surface-900">What Data Is Stored</h2>
              <p className="text-sm text-surface-500">Complete breakdown of your stored information</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-surface-100">
          {dataCategories.map((category, idx) => (
            <div key={idx} className="p-4">
              <button
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-surface-100 rounded-lg">
                    <FileText size={18} className="text-surface-500" />
                  </div>
                  <span className="font-semibold text-surface-900">{category.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-surface-500">{category.items.length} items</span>
                  <motion.div
                    animate={{ rotate: selectedCategory === category.name ? 180 : 0 }}
                    className="text-surface-400"
                  >
                    ▼
                  </motion.div>
                </div>
              </button>
              {selectedCategory === category.name && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 pl-12"
                >
                  <div className="bg-surface-50 rounded-xl p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {category.items.map((item, i) => (
                        <span key={i} className="badge bg-white text-surface-600 border border-surface-200">
                          {item}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-surface-500 flex items-center gap-1">
                      <Clock size={12} />
                      Retention: {category.retention}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Location */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin size={24} className="text-brand-500" />
          <div>
            <h2 className="font-bold text-surface-900">Where Your Data Is Stored</h2>
            <p className="text-sm text-surface-500">Geographic location of data storage</p>
          </div>
        </div>
        <div className="bg-surface-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                🇳🇬
              </div>
              <div>
                <p className="font-semibold text-surface-900">Nigeria (Primary)</p>
                <p className="text-sm text-surface-500">Lagos Data Center</p>
              </div>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          <div className="text-sm text-surface-600">
            <p className="flex items-center gap-2 mb-2">
              <Lock size={14} className="text-success-500" />
              Data encrypted with AES-256
            </p>
            <p className="flex items-center gap-2">
              <Shield size={14} className="text-success-500" />
              NITDA compliant storage
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="font-bold text-surface-900 mb-2">Download Your Data</h3>
          <p className="text-sm text-surface-500 mb-4">Get a complete copy of all your stored data</p>
          <button className="btn-outline w-full py-2 flex items-center justify-center gap-2">
            <Download size={18} />
            Request Data Export
          </button>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-bold text-surface-900 mb-2">Delete Your Data</h3>
          <p className="text-sm text-surface-500 mb-4">Permanently remove all your data from our systems</p>
          <button className="btn-danger w-full py-2 flex items-center justify-center gap-2">
            <AlertTriangle size={18} />
            Request Deletion
          </button>
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-surface-900">Privacy Policy</h3>
            <p className="text-sm text-surface-500">Last updated: December 1, 2024</p>
          </div>
          <button className="btn-outline py-2 px-4 text-sm">
            Read Full Policy
          </button>
        </div>
      </div>
    </div>
  );
}
