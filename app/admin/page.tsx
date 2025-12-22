'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Shield, CheckCircle, Server, ChevronRight, TrendingUp, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalVerifications: 0,
    activeServices: 0,
    newUsersToday: 0,
    totalEnrollment: 0,
    successRate: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats || {});
          setRecentUsers(data.recentUsers || []);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue', change: `+${stats.newUsersToday} today` },
    { label: 'Enrolled', value: stats.totalEnrollment, icon: Shield, color: 'green', change: `${stats.totalUsers > 0 ? Math.round((stats.totalEnrollment / stats.totalUsers) * 100) : 0}%` },
    { label: 'Verifications', value: stats.totalVerifications, icon: CheckCircle, color: 'purple', change: 'All time' },
    { label: 'Services', value: stats.activeServices, icon: Server, color: 'orange', change: 'Active' },
  ];

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'bg-orange-100' },
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of the biometric system</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const colors = colorMap[stat.color];
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center`}>
                  <stat.icon size={20} className={colors.text} />
                </div>
                <span className="text-xs text-gray-500 font-medium">{stat.change}</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/users" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Users size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-500">View and edit users</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/admin/services" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Server size={24} className="text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Services</h3>
              <p className="text-sm text-gray-500">Configure services</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/admin/audit" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Shield size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Audit Logs</h3>
              <p className="text-sm text-gray-500">View system logs</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-medium text-gray-900">Recent Users</h2>
          <Link href="/admin/users" className="text-sm text-blue-600 font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentUsers.length > 0 ? (
            recentUsers.slice(0, 5).map((user, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.biometricEnrolled ? (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">Enrolled</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Pending</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <Users size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No users yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
