'use client';

import { useState } from 'react';
import Link from 'next/link';

const RecordDetailPage = () => {
  // Mock data for demonstration
  const [record] = useState({
    id: 'rec_001',
    userId: 'usr_001',
    user: 'John Doe',
    biometricType: 'FINGERPRINT',
    createdAt: '2023-11-15T09:30:00Z',
    updatedAt: '2023-11-15T09:30:00Z',
    confidenceScore: 92,
    device: 'Fingerprint Scanner Model XYZ',
    location: 'Main Campus - Admin Building',
    temperature: '22°C',
    notes: 'High quality capture, no artifacts detected',
    templateFormat: 'ISO_19794',
    status: 'VERIFIED',
    metadata: {
      quality: 'Excellent',
      imageResolution: '500 DPI',
      captureMethod: 'Live scan',
      processingTime: '2.3s'
    }
  });

  const [showRawData, setShowRawData] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FINGERPRINT': return 'bg-blue-100 text-blue-800';
      case 'FACE_RECOGNITION': return 'bg-purple-100 text-purple-800';
      case 'IRIS_SCAN': return 'bg-indigo-100 text-indigo-800';
      case 'VOICE_RECOGNITION': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Biometric Record Details</h2>
                <p className="mt-1 text-sm text-gray-500">Record ID: {record.id}</p>
              </div>
              <div className="flex space-x-3">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Record Info and Biometric Preview */}
              <div className="lg:col-span-2 space-y-6">
                {/* Record Overview */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Record Overview</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Record ID</p>
                      <p className="font-medium">{record.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Biometric Type</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(record.biometricType)}`}>
                        {record.biometricType.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Confidence Score</p>
                      <div className="flex items-center">
                        <span className="font-medium">{record.confidenceScore}%</span>
                        <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${record.confidenceScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date Created</p>
                      <p className="font-medium">{new Date(record.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Template Format</p>
                      <p className="font-medium">{record.templateFormat}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Associated User</p>
                      <p className="font-medium">{record.user} ({record.userId})</p>
                    </div>
                  </div>
                </div>

                {/* Biometric Preview */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Biometric Preview</h3>
                  <div className="flex justify-center">
                    <div className="bg-black rounded-lg overflow-hidden w-64 h-64 flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2">Biometric Preview</p>
                        <p className="text-xs mt-1">Secure Encrypted Data</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowRawData(!showRawData)}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      {showRawData ? 'Hide' : 'Show'} Encrypted Data
                    </button>
                  </div>

                  {showRawData && (
                    <div className="mt-4">
                      <div className="text-xs font-mono bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
                        <div className="mb-2">Encrypted Biometric Template:</div>
                        <div className="truncate">a2Fsa2pka2xqamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGprbGpkamtsZGpr</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Note: This is encrypted data. Decryption requires proper authorization.</p>
                    </div>
                  )}
                </div>

                {/* Notes and Additional Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notes and Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Capture Notes</p>
                      <p className="font-medium">{record.notes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Device Used</p>
                      <p className="font-medium">{record.device}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Capture Location</p>
                      <p className="font-medium">{record.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ambient Temperature</p>
                      <p className="font-medium">{record.temperature}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Metadata and Actions */}
              <div className="space-y-6">
                {/* Metadata */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                  <div className="space-y-3">
                    {Object.entries(record.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export Record
                    </button>
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      View History
                    </button>
                    <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Compare with Template
                    </button>
                  </div>
                </div>

                {/* Related Records */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Related Records</h3>
                  <div className="space-y-3">
                    <Link href="/records/rec_001" className="block p-3 bg-white rounded border border-gray-200 hover:border-indigo-300">
                      <div className="flex justify-between">
                        <span className="font-medium">Fingerprint - Left Index</span>
                        <span className="text-indigo-600">View</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Created: Nov 10, 2023</div>
                    </Link>
                    <Link href="/records/rec_002" className="block p-3 bg-white rounded border border-gray-200 hover:border-indigo-300">
                      <div className="flex justify-between">
                        <span className="font-medium">Face Recognition</span>
                        <span className="text-indigo-600">View</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Created: Nov 12, 2023</div>
                    </Link>
                    <Link href="/records/rec_003" className="block p-3 bg-white rounded border border-gray-200 hover:border-indigo-300">
                      <div className="flex justify-between">
                        <span className="font-medium">Iris Scan - Right Eye</span>
                        <span className="text-indigo-600">View</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Created: Nov 14, 2023</div>
                    </Link>
                  </div>
                </div>

                {/* Compliance */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">GDPR Compliant</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Data Protection Act</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Biometric Information Privacy Act</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetailPage;
