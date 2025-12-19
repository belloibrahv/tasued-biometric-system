'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Filter, ChevronLeft, ChevronRight,
  Loader2, User, Shield, Server, Clock
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        filter,
      });
      
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('USER')) return User;
    if (actionType.includes('SERVICE')) return Server;
    return Shield;
  };

  const getActionColor = (status: string) => {
    if (status === 'SUCCESS') return 'bg-success-500/20 text-success-400';
    if (status === 'FAILED') return 'bg-error-500/20 text-error-400';
    return 'bg-warning-500/20 text-warning-400';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-surface-400 mt-1">System activity and security logs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Actions</option>
          <option value="LOGIN">Logins</option>
          <option value="VERIFICATION">Verifications</option>
          <option value="USER">User Actions</option>
          <option value="SERVICE">Service Actions</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Action</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Actor</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Resource</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin mx-auto text-brand-500" size={32} />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-surface-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = getActionIcon(log.actionType);
                  return (
                    <tr key={log.id} className="hover:bg-surface-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                            <Icon size={16} />
                          </div>
                          <span className="font-medium text-white">{log.actionType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-surface-300">{log.actorType}</p>
                          <p className="text-xs text-surface-500">{log.actorId.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-surface-300">
                        {log.resourceType}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getActionColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-surface-400 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-700 flex items-center justify-between">
            <p className="text-sm text-surface-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
