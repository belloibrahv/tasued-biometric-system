'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Users, Shield, MoreVertical, ChevronLeft, ChevronRight, RefreshCw, Loader2, CheckCircle } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [fixingNames, setFixingNames] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);
  const [unknownCount, setUnknownCount] = useState(0);
  const perPage = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: perPage.toString(),
        ...(search && { search }),
        ...(filter !== 'all' && { filter }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      console.log('Users API response status:', res.status);
      const data = await res.json();
      console.log('Users API response data:', data);
      if (res.ok) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        // Count unknown users
        const unknown = (data.users || []).filter((u: any) => 
          u.firstName === 'Unknown' || u.lastName === 'User'
        ).length;
        setUnknownCount(unknown);
      } else {
        console.error('Users API error:', data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, filter]);

  const handleFixNames = async () => {
    setFixingNames(true);
    setFixResult(null);
    try {
      const res = await fetch('/api/admin/fix-user-names', { method: 'POST' });
      const data = await res.json();
      setFixResult(data);
      if (data.fixed > 0) {
        // Refresh the user list
        fetchUsers();
      }
    } catch (error) {
      setFixResult({ error: 'Failed to fix names' });
    } finally {
      setFixingNames(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">{total} total users</p>
        </div>
        <div className="flex items-center gap-2">
          {unknownCount > 0 && (
            <button
              onClick={handleFixNames}
              disabled={fixingNames}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
            >
              {fixingNames ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Fix {unknownCount} Unknown Names
                </>
              )}
            </button>
          )}
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Fix Result Message */}
      {fixResult && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          fixResult.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
        }`}>
          {fixResult.error ? (
            <span className="text-red-700">{fixResult.error}</span>
          ) : (
            <>
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-green-700">
                Fixed {fixResult.fixed} user names. {fixResult.skipped} skipped.
              </span>
            </>
          )}
          <button 
            onClick={() => setFixResult(null)} 
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or matric number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'enrolled', label: 'Enrolled' },
            { key: 'pending', label: 'Pending' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : users.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Matric No.</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium text-sm">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{user.matricNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.department || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.level || '-'}</td>
                      <td className="px-4 py-3">
                        {user.biometricEnrolled ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                            <Shield size={12} /> Enrolled
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {user.biometricEnrolled ? (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Enrolled</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Pending</span>
                    )}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>{user.matricNumber}</span>
                    <span>{user.department || '-'}</span>
                    <span>{user.level || '-'} Level</span>
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
              <Users size={32} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-sm text-gray-500">
              {search ? 'Try a different search term' : 'Users will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}