'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, QrCode, Users, CheckCircle, ChevronRight, Clock } from 'lucide-react';

export default function OperatorDashboard() {
  const [stats, setStats] = useState({
    todayVerifications: 0,
    successRate: 0,
    pendingVerifications: 0,
  });
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/operator/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || {});
          setRecentVerifications(data.recentVerifications || []);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Operator Dashboard</h1>
        <p className="text-gray-500 mt-1">Verify student identities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Today's Verifications</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.todayVerifications}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.successRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.pendingVerifications}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/operator/verify" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Eye size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Verify</h3>
              <p className="text-sm text-gray-500">Manual verification</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/operator/scanner" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <QrCode size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Scanner</h3>
              <p className="text-sm text-gray-500">QR code scanner</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/operator/bulk" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-green-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Users size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Bulk</h3>
              <p className="text-sm text-gray-500">Multiple students</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Recent verifications */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Recent Verifications</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentVerifications.length > 0 ? (
            recentVerifications.slice(0, 5).map((v, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  v.status === 'SUCCESS' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <CheckCircle size={16} className={v.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {v.user?.firstName} {v.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{v.user?.matricNumber}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <Clock size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent verifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
