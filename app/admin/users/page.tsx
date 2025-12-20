'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, CheckCircle, XCircle, Shield, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, Eye, Ban, Trash2, Mail, Users
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, enrolled: 0, pending: 0, enrollmentRate: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchQuery,
        filter,
      });

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-surface-400 mt-1">Total {stats.total} students registered</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total, icon: Users, color: 'text-brand-400' },
          { label: 'Enrolled', value: stats.enrolled, icon: Shield, color: 'text-success-400' },
          { label: 'Pending', value: stats.pending, icon: AlertTriangle, color: 'text-warning-400' },
          { label: 'Enrollment Rate', value: `${stats.enrollmentRate}%`, icon: CheckCircle, color: 'text-brand-300' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-800 border border-surface-700 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-surface-700 rounded-lg ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-surface-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-xl font-black text-white">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, or matric number..."
              className="w-full pl-12 pr-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white placeholder:text-surface-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </form>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-white focus:ring-2 focus:ring-brand-500/20 min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="enrolled">Enrolled Only</option>
            <option value="pending">Pending Enrollment</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700 bg-surface-900/50">
                <th className="text-left px-6 py-4 text-xs font-black text-surface-500 uppercase tracking-widest">Student Info</th>
                <th className="text-left px-6 py-4 text-xs font-black text-surface-500 uppercase tracking-widest">Matric & Level</th>
                <th className="text-left px-6 py-4 text-xs font-black text-surface-500 uppercase tracking-widest">Department</th>
                <th className="text-left px-6 py-4 text-xs font-black text-surface-500 uppercase tracking-widest">Biometric Status</th>
                <th className="text-right px-6 py-4 text-xs font-black text-surface-500 uppercase tracking-widest">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-surface-500 uppercase font-bold text-sm tracking-widest">
                    <Loader2 className="animate-spin mx-auto text-brand-500 mb-2" size={32} />
                    Syncing database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-surface-400">
                    No students found matching current filters
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-700/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} className="w-12 h-12 rounded-xl object-cover border-2 border-surface-700" alt="" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-surface-700 border-2 border-surface-600 flex items-center justify-center text-surface-400 font-black text-lg">
                              {user.firstName[0]}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-800 ${user.isActive ? 'bg-success-500' : 'bg-error-500'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-brand-400 transition-colors">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-surface-500 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-brand-500 font-mono tracking-tighter">{user.matricNumber}</p>
                      <p className="text-[10px] text-surface-500 uppercase font-black">{user.level} Level</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-surface-300 bg-surface-700/50 px-2 py-1 rounded">
                        {user.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.biometricEnrolled ? (
                        <div className="flex items-center gap-2 text-success-400 bg-success-500/10 px-3 py-1.5 rounded-xl border border-success-500/20 w-fit">
                          <Shield size={14} className="fill-current/20" />
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-surface-500 bg-surface-700/50 px-3 py-1.5 rounded-xl border border-surface-600 w-fit">
                          <AlertTriangle size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Pending</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setSelectedUser(user); setShowModal(true); }}
                        className="bg-surface-700 hover:bg-brand-600 p-2.5 rounded-xl text-surface-300 hover:text-white transition-all shadow-sm"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-surface-700 flex items-center justify-between bg-surface-900/20">
            <p className="text-xs font-black text-surface-500 uppercase tracking-widest leading-none">
              Records {((page - 1) * 10) + 1} - {Math.min(page * 10, stats.total)} of {stats.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2.5 rounded-xl bg-surface-700 text-surface-300 hover:bg-surface-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-surface-800 border border-surface-700 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-brand-gradient h-32 relative">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute right-4 top-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="px-8 pb-8 -mt-16">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  {selectedUser.profilePhoto ? (
                    <img src={selectedUser.profilePhoto} className="w-full h-full rounded-3xl object-cover border-4 border-surface-800 shadow-xl" alt="" />
                  ) : (
                    <div className="w-full h-full rounded-3xl bg-surface-700 border-4 border-surface-800 flex items-center justify-center text-4xl font-black text-surface-500 shadow-xl">
                      {selectedUser.firstName[0]}
                    </div>
                  )}
                  <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-surface-800 ${selectedUser.isActive ? 'bg-success-500' : 'bg-error-500'}`} />
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-white">{selectedUser.firstName} {selectedUser.lastName}</h2>
                  <p className="text-brand-500 font-mono font-bold tracking-widest">{selectedUser.matricNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-surface-700/30 p-4 rounded-2xl border border-surface-700">
                    <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1">Department</p>
                    <p className="text-sm font-bold text-surface-200">{selectedUser.department}</p>
                  </div>
                  <div className="bg-surface-700/30 p-4 rounded-2xl border border-surface-700">
                    <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1">Academic Level</p>
                    <p className="text-sm font-bold text-surface-200">{selectedUser.level} Level</p>
                  </div>
                  <div className="bg-surface-700/30 p-4 rounded-2xl border border-surface-700">
                    <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1">Email Connection</p>
                    <p className="text-sm font-bold text-surface-200 truncate">{selectedUser.email}</p>
                  </div>
                  <div className="bg-surface-700/30 p-4 rounded-2xl border border-surface-700">
                    <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-1">Enrollment Date</p>
                    <p className="text-sm font-bold text-surface-200">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full py-4 bg-surface-700 rounded-2xl text-white font-black uppercase tracking-widest text-xs border border-surface-600 opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Ban size={16} /> Disconnect Account
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-4 bg-brand-600 hover:bg-brand-500 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
