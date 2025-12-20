'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Filter, ChevronLeft, ChevronRight,
  Loader2, User, Shield, Server, Clock, CheckCircle
} from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        filter,
        search: searchQuery,
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

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('USER') || actionType.includes('ENROLL')) return User;
    if (actionType.includes('SERVICE')) return Server;
    if (actionType.includes('LOGIN')) return Shield;
    if (actionType.includes('VERIFICATION')) return CheckCircle;
    return FileText;
  };

  const getActionColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'SUCCESS' || s === 'READY') return 'bg-success-500/20 text-success-400';
    if (s === 'FAILED' || s === 'ERROR') return 'bg-error-500/20 text-error-400';
    return 'bg-warning-500/20 text-warning-400';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-surface-400 mt-1">System activity and security trail</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, actor ID, or resource..."
              className="w-full pl-12 pr-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white placeholder:text-surface-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </form>
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
          <option value="ENROLL">Enrollments</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700 bg-surface-900/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-surface-400 uppercase tracking-wider">Action & Category</th>
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
                    <p className="text-sm text-surface-500 mt-2">Fetching security trail...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-surface-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    No audit logs matching your criteria
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const Icon = getActionIcon(log.actionType);
                  const isStudent = log.actorType === 'STUDENT';

                  return (
                    <tr key={log.id} className="hover:bg-surface-700/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-surface-700 rounded-lg text-brand-400 group-hover:bg-brand-500/20 group-hover:text-brand-300 transition-colors">
                            <Icon size={16} />
                          </div>
                          <div>
                            <span className="font-bold text-surface-100 block">{log.actionType}</span>
                            <span className="text-[10px] text-surface-500 uppercase font-black">{log.actorType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.user ? (
                          <div>
                            <p className="text-surface-200 font-medium">{log.user.firstName} {log.user.lastName}</p>
                            <p className="text-xs text-brand-500 font-mono">{log.user.matricNumber}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-surface-300 font-medium">{log.actorType}</p>
                            <p className="text-[10px] text-surface-500 font-mono tracking-tighter truncate max-w-[120px]">{log.actorId}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-surface-400 font-medium bg-surface-900/50 px-2 py-1 rounded border border-surface-700">
                          {log.resourceType}
                        </span>
                        {log.resourceId && (
                          <p className="text-[10px] text-surface-600 font-mono mt-1">ID: {log.resourceId.slice(0, 8)}...</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${getActionColor(log.status)} border-current`}>
                          {log.status === 'SUCCESS' ? <CheckCircle size={10} className="inline mr-1 -mt-0.5" /> : null}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-surface-400 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-surface-500" />
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
          <div className="px-6 py-4 border-t border-surface-700 flex items-center justify-between bg-surface-900/20">
            <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
