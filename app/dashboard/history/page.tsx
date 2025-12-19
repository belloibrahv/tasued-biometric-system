'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Download, Calendar, CheckCircle, XCircle,
  Clock, MapPin, Smartphone, BookOpen, GraduationCap, Building2,
  Utensils, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';

// Mock data
const accessHistory = [
  { id: 1, service: 'Library', action: 'Check-in', location: 'Main Library', method: 'QR Code', status: 'success', timestamp: '2024-12-19 10:30:00', device: 'Terminal A1' },
  { id: 2, service: 'Cafeteria', action: 'Payment', location: 'Student Center', method: 'QR Code', status: 'success', timestamp: '2024-12-19 08:15:00', device: 'POS Terminal' },
  { id: 3, service: 'Exam Hall', action: 'Verification', location: 'Hall B', method: 'Fingerprint', status: 'success', timestamp: '2024-12-18 09:00:00', device: 'Biometric Scanner' },
  { id: 4, service: 'Hostel', action: 'Entry', location: 'Block C', method: 'QR Code', status: 'failed', timestamp: '2024-12-18 22:30:00', device: 'Gate Terminal' },
  { id: 5, service: 'Library', action: 'Check-out', location: 'Main Library', method: 'QR Code', status: 'success', timestamp: '2024-12-17 18:45:00', device: 'Terminal A1' },
  { id: 6, service: 'Health Center', action: 'Registration', location: 'Medical Block', method: 'Manual', status: 'success', timestamp: '2024-12-17 11:00:00', device: 'Reception' },
  { id: 7, service: 'Exam Hall', action: 'Verification', location: 'Hall A', method: 'Facial', status: 'success', timestamp: '2024-12-16 14:00:00', device: 'Camera System' },
  { id: 8, service: 'Cafeteria', action: 'Payment', location: 'Student Center', method: 'QR Code', status: 'success', timestamp: '2024-12-16 12:30:00', device: 'POS Terminal' },
];

const serviceIcons: Record<string, any> = {
  'Library': BookOpen,
  'Exam Hall': GraduationCap,
  'Hostel': Building2,
  'Cafeteria': Utensils,
  'Health Center': Building2,
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredHistory = accessHistory.filter(item => {
    const matchesSearch = item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesService = serviceFilter === 'all' || item.service === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const services = [...new Set(accessHistory.map(item => item.service))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-950">Access History</h1>
          <p className="text-surface-500 mt-1">View your complete verification and access history</p>
        </div>
        <button className="btn-outline py-2 px-4 text-sm flex items-center gap-2">
          <Download size={18} />
          Export History
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search by service, action, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full md:w-40"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="input-field w-full md:w-40"
          >
            <option value="all">All Services</option>
            {services.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>

          {/* Date Range */}
          <button className="btn-outline py-2 px-4 flex items-center gap-2">
            <Calendar size={18} />
            Date Range
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-surface-500">
        <span>Showing {paginatedHistory.length} of {filteredHistory.length} records</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle size={14} className="text-success-500" />
            {filteredHistory.filter(i => i.status === 'success').length} successful
          </span>
          <span className="flex items-center gap-1">
            <XCircle size={14} className="text-error-500" />
            {filteredHistory.filter(i => i.status === 'failed').length} failed
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="table-header text-left px-6 py-4">Service</th>
                <th className="table-header text-left px-6 py-4">Action</th>
                <th className="table-header text-left px-6 py-4">Location</th>
                <th className="table-header text-left px-6 py-4">Method</th>
                <th className="table-header text-left px-6 py-4">Status</th>
                <th className="table-header text-left px-6 py-4">Date & Time</th>
                <th className="table-header text-left px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paginatedHistory.map((item, idx) => {
                const ServiceIcon = serviceIcons[item.service] || Building2;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="table-row"
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-50 rounded-lg text-brand-500">
                          <ServiceIcon size={18} />
                        </div>
                        <span className="font-medium">{item.service}</span>
                      </div>
                    </td>
                    <td className="table-cell text-surface-600">{item.action}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-surface-500">
                        <MapPin size={14} />
                        {item.location}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="badge bg-surface-100 text-surface-600">{item.method}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        item.status === 'success' ? 'badge-success' : 'badge-error'
                      }`}>
                        {item.status === 'success' ? (
                          <><CheckCircle size={12} className="mr-1" /> Success</>
                        ) : (
                          <><XCircle size={12} className="mr-1" /> Failed</>
                        )}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-surface-500">
                        <Clock size={14} />
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="table-cell">
                      <button className="p-2 hover:bg-surface-100 rounded-lg text-surface-500 hover:text-brand-500 transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-200">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-outline py-2 px-4 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-brand-500 text-white'
                      : 'hover:bg-surface-100 text-surface-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-outline py-2 px-4 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
