'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Fingerprint, User, Search, Filter, Plus, Eye, Trash2, ArrowLeft, ArrowRight, XCircle, AlertCircle, CheckCircle, Database, Eye as EyeIcon, Mic } from 'lucide-react';
import Header from '@/components/Header';

const RecordsPage = () => {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const biometricRecords = [
    {
      id: 'rec_001',
      userId: 'usr_001',
      user: 'John Doe',
      biometricType: 'FINGERPRINT',
      createdAt: '2023-11-15T09:30:00Z',
      confidenceScore: 92,
      status: 'VERIFIED',
      templateFormat: 'ISO_19794',
    },
    {
      id: 'rec_002',
      userId: 'usr_002',
      user: 'Jane Smith',
      biometricType: 'FACE_RECOGNITION',
      createdAt: '2023-11-16T14:22:00Z',
      confidenceScore: 87,
      status: 'VERIFIED',
      templateFormat: 'proprietary',
    },
    {
      id: 'rec_003',
      userId: 'usr_003',
      user: 'Robert Johnson',
      biometricType: 'IRIS_SCAN',
      createdAt: '2023-11-17T11:45:00Z',
      confidenceScore: 65,
      status: 'PENDING',
      templateFormat: 'ISO_19794',
    },
    {
      id: 'rec_004',
      userId: 'usr_004',
      user: 'Emily Davis',
      biometricType: 'VOICE_RECOGNITION',
      createdAt: '2023-11-18T16:30:00Z',
      confidenceScore: 78,
      status: 'FAILED',
      templateFormat: 'proprietary',
    },
    {
      id: 'rec_005',
      userId: 'usr_005',
      user: 'Michael Brown',
      biometricType: 'FINGERPRINT',
      createdAt: '2023-11-19T10:15:00Z',
      confidenceScore: 95,
      status: 'VERIFIED',
      templateFormat: 'ISO_19794',
    },
  ];

  const filteredRecords = biometricRecords.filter(record => {
    const matchesType = filterType === 'ALL' || record.biometricType === filterType;
    const matchesSearch = record.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

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

  const getBiometricIcon = (type: string) => {
    switch (type) {
      case 'FINGERPRINT':
        return Fingerprint;
      case 'FACE_RECOGNITION':
        return User;
      case 'IRIS_SCAN':
        return EyeIcon;
      case 'VOICE_RECOGNITION':
        return Mic;
      default:
        return Database;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Biometric Records</h2>
              <p className="mt-1 text-sm text-gray-500">
                View and manage all collected biometric data
              </p>
            </div>

            <div className="p-6">
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter by Type
                    </label>
                    <select
                      id="filter-type"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="block w-full md:w-48 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="ALL">All Types</option>
                      <option value="FINGERPRINT">Fingerprint</option>
                      <option value="FACE_RECOGNITION">Face Recognition</option>
                      <option value="IRIS_SCAN">Iris Scan</option>
                      <option value="VOICE_RECOGNITION">Voice Recognition</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Search className="mr-2 h-4 w-4" />
                      Search Records
                    </label>
                    <input
                      type="text"
                      id="search"
                      placeholder="Search by user or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full md:w-64 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/collect"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none flex items-center"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Collection
                  </Link>
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => {
                      const Icon = getBiometricIcon(record.biometricType);
                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                            <User className="mr-2 h-4 w-4 text-gray-400" />
                            {record.user}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(record.biometricType)} flex items-center`}>
                              <Icon className="mr-1 h-3 w-3" />
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)} flex items-center`}>
                              {record.status === 'VERIFIED' ? (
                                <CheckCircle className="mr-1 h-3 w-3" />
                              ) : record.status === 'PENDING' ? (
                                <AlertCircle className="mr-1 h-3 w-3" />
                              ) : (
                                <XCircle className="mr-1 h-3 w-3" />
                              )}
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/records/${record.id}`}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                              <button className="text-red-600 hover:text-red-900 ml-2 flex items-center">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setFilterType('ALL');
                        setSearchTerm('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </button>
                  <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
                      <span className="font-medium">12</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center">
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        1
                      </button>
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        2
                      </button>
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        3
                      </button>
                      <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 flex items-center">
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </nav>
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

export default RecordsPage;