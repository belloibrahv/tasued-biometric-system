'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Download, Calendar, CheckCircle, XCircle,
  Clock, MapPin, Smartphone, BookOpen, GraduationCap, Building2,
  Utensils, ChevronLeft, ChevronRight, Eye, Loader2
} from 'lucide-react';

const serviceIcons: Record<string, any> = {
  'library': BookOpen,
  'exam-hall': GraduationCap,
  'hostel': Building2,
  'cafeteria': Utensils,
  'health-center': Building2,
};

export default function HistoryPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [counts, setCounts] = useState({ success: 0, failed: 0 });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchQuery,
      });

      const res = await fetch(`/api/dashboard/activity?${params}`);
      const data = await res.json();

      if (res.ok) {
        setActivities(data.activities);
        setTotalPages(data.pagination.totalPages);
        setTotalRecords(data.pagination.total);

        // Simple counts for current view (or we could fetch these from global stats)
        const success = data.activities.filter((a: any) => a.status === 'SUCCESS').length;
        const failed = data.activities.filter((a: any) => a.status === 'FAILED').length;
        setCounts({ success, failed });
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter, serviceFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const getServiceDisplayName = (slug: string) => {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

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
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search by service or activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-full md:w-40"
          >
            <option value="all">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>

          <button type="submit" className="btn-primary py-2 px-6">
            Search
          </button>
        </form>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-surface-500">
        <span>Showing {activities.length} of {totalRecords} records</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle size={14} className="text-success-500" />
            {counts.success} success
          </span>
          <span className="flex items-center gap-1">
            <XCircle size={14} className="text-error-500" />
            {counts.failed} failed
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
                <th className="table-header text-left px-6 py-4">Verification Method</th>
                <th className="table-header text-left px-6 py-4">Location</th>
                <th className="table-header text-left px-6 py-4">Status</th>
                <th className="table-header text-left px-6 py-4">Date & Time</th>
                <th className="table-header text-right px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-brand-500" size={32} />
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-surface-400">
                    No history found
                  </td>
                </tr>
              ) : (
                activities.map((item, idx) => {
                  const ServiceIcon = serviceIcons[item.serviceSlug] || Building2;
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
                      <td className="table-cell">
                        <span className="badge bg-surface-100 text-surface-600">
                          {item.action}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 text-surface-500">
                          <MapPin size={14} />
                          {item.location}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${item.status === 'SUCCESS' ? 'badge-success' : 'badge-error'
                          }`}>
                          {item.status === 'SUCCESS' ? (
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
                      <td className="table-cell text-right">
                        <button className="p-2 hover:bg-surface-100 rounded-lg text-surface-500 hover:text-brand-500 transition-colors">
                          <Eye size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-surface-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline py-2 px-4 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-surface-500">Page {page} of {totalPages}</span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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
