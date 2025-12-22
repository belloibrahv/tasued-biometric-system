'use client';

import { useState, useEffect } from 'react';
import { Shield, Search, Filter, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: perPage.toString(),
          ...(search && { search }),
        });
        const res = await fetch(`/api/admin/audit?${params}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, search]);

  const totalPages = Math.ceil(total / perPage);

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN') || action.includes('SUCCESS')) return 'bg-green-50 text-green-700';
    if (action.includes('FAIL') || action.includes('ERROR')) return 'bg-red-50 text-red-700';
    if (action.includes('CREATE') || action.includes('ENROLL')) return 'bg-blue-50 text-blue-700';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-yellow-50 text-yellow-700';
    if (action.includes('DELETE')) return 'bg-red-50 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 mt-1">System activity and security logs</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Logs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : logs.length > 0 ? (
          <>
            <div className="divide-y divide-gray-100">
              {logs.map((log, idx) => (
                <div key={idx} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={16} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getActionColor(log.actionType)}`}>
                          {log.actionType}
                        </span>
                        {log.resourceType && (
                          <span className="text-xs text-gray-500">{log.resourceType}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {log.user?.email || log.admin?.email || 'System'}
                      </p>
                      {log.details && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield size={32} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No logs found</h3>
            <p className="text-sm text-gray-500">
              {search ? 'Try a different search term' : 'Activity logs will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}