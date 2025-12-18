'use client';

import { useState } from 'react';
import Link from 'next/link';

const ExportPage = () => {
  const [selectedFormat, setSelectedFormat] = useState('JSON');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'completed'>('idle');
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // Mock data for demonstration
  const biometricRecords = [
    {
      id: 'rec_001',
      user: 'John Doe',
      biometricType: 'FINGERPRINT',
      createdAt: '2023-11-15T09:30:00Z',
      confidenceScore: 92,
    },
    {
      id: 'rec_002',
      user: 'Jane Smith',
      biometricType: 'FACE_RECOGNITION',
      createdAt: '2023-11-16T14:22:00Z',
      confidenceScore: 87,
    },
    {
      id: 'rec_003',
      user: 'Robert Johnson',
      biometricType: 'IRIS_SCAN',
      createdAt: '2023-11-17T11:45:00Z',
      confidenceScore: 65,
    },
  ];

  const handleRecordSelect = (id: string) => {
    if (selectedRecords.includes(id)) {
      setSelectedRecords(selectedRecords.filter(recordId => recordId !== id));
    } else {
      setSelectedRecords([...selectedRecords, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRecords.length === biometricRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(biometricRecords.map(record => record.id));
    }
  };

  const handleExport = () => {
    if (selectedRecords.length === 0) {
      alert('Please select at least one record to export');
      return;
    }

    setExportStatus('processing');
    
    // Simulate export processing
    setTimeout(() => {
      setExportStatus('completed');
      // In a real implementation, this would be the URL to download the exported file
      setExportUrl('https://example.com/export/12345');
    }, 2000);
  };

  const exportFormats = [
    { id: 'JSON', name: 'JSON', description: 'JavaScript Object Notation - Best for programmatic access' },
    { id: 'XML', name: 'XML', description: 'eXtensible Markup Language - Standard format for data exchange' },
    { id: 'ISO_19794', name: 'ISO 19794', description: 'International standard for biometric data interchange' },
    { id: 'CSV', name: 'CSV', description: 'Comma Separated Values - Best for spreadsheet applications' },
    { id: 'CUSTOM', name: 'Custom Format', description: 'Proprietary format for specific systems' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Export Biometric Data</h2>
            <p className="mt-1 text-sm text-gray-500">
              Export your biometric records in various formats for use in other systems
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Format Selection */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Export Format</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Select the format in which you want to export your biometric data
                  </p>
                  
                  <div className="space-y-4">
                    {exportFormats.map((format) => (
                      <div 
                        key={format.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedFormat === format.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedFormat(format.id)}
                      >
                        <div className="flex items-center">
                          <div className={`h-4 w-4 rounded-full border flex items-center justify-center mr-3 ${
                            selectedFormat === format.id
                              ? 'border-indigo-500 bg-indigo-500'
                              : 'border-gray-400'
                          }`}>
                            {selectedFormat === format.id && (
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{format.name}</h4>
                            <p className="text-sm text-gray-500">{format.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="include-encrypted"
                            name="include-encrypted"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="include-encrypted" className="font-medium text-gray-700">
                            Include encrypted biometric templates
                          </label>
                          <p className="text-gray-500">Include the actual encrypted biometric data in the export</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="include-metadata"
                            name="include-metadata"
                            type="checkbox"
                            defaultChecked
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="include-metadata" className="font-medium text-gray-700">
                            Include metadata
                          </label>
                          <p className="text-gray-500">Include additional information like timestamps and quality scores</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="include-user-info"
                            name="include-user-info"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="include-user-info" className="font-medium text-gray-700">
                            Include associated user information
                          </label>
                          <p className="text-gray-500">Include user identifiers and details (if applicable)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Record Selection and Export */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Select Records to Export</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose which biometric records to include in the export
                    </p>
                  </div>
                  
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              checked={selectedRecords.length === biometricRecords.length}
                              onChange={handleSelectAll}
                            />
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Record ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Biometric Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Confidence
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {biometricRecords.map((record) => (
                          <tr 
                            key={record.id} 
                            className={`${
                              selectedRecords.includes(record.id) ? 'bg-indigo-50' : ''
                            } hover:bg-gray-50 cursor-pointer`}
                            onClick={() => handleRecordSelect(record.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={selectedRecords.includes(record.id)}
                                onChange={() => handleRecordSelect(record.id)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.user}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {record.biometricType.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <span>{record.confidenceScore}%</span>
                                <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full" 
                                    style={{ width: `${record.confidenceScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(record.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Selected <span className="font-medium">{selectedRecords.length}</span> of{' '}
                        <span className="font-medium">{biometricRecords.length}</span> records
                      </div>
                      
                      <button
                        onClick={handleExport}
                        disabled={exportStatus === 'processing'}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          exportStatus === 'processing'
                            ? 'bg-indigo-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        } focus:outline-none`}
                      >
                        {exportStatus === 'processing' ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export Selected Records
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Export Status */}
                {exportStatus === 'completed' && exportUrl && (
                  <div className="mt-6 bg-white rounded-lg border border-gray-200">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Export Completed</h3>
                      <p className="mt-1 text-sm text-gray-500">Your biometric data has been successfully exported</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">Export Successful</h4>
                          <p className="mt-2 text-sm text-gray-500">
                            Your {selectedRecords.length} biometric records have been exported in {selectedFormat} format.
                          </p>
                          <p className="mt-2 text-sm text-gray-500">
                            Exported using format: {exportFormats.find(f => f.id === selectedFormat)?.name}
                          </p>
                          
                          <div className="mt-4 flex space-x-3">
                            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download File
                            </button>
                            
                            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Generate Report
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Export Details</h4>
                        <ul className="text-sm text-gray-500 space-y-1">
                          <li className="flex justify-between">
                            <span>Format:</span>
                            <span className="font-medium">{exportFormats.find(f => f.id === selectedFormat)?.name}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Number of Records:</span>
                            <span className="font-medium">{selectedRecords.length}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>File Size:</span>
                            <span className="font-medium">~{Math.ceil(selectedRecords.length * 0.5)} KB</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Encryption:</span>
                            <span className="font-medium">AES-256</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;