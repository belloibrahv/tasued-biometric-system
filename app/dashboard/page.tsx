'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, History, Shield, ChevronRight, CheckCircle, Clock, MapPin } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalAccess: 0, thisMonth: 0, lastAccess: null });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, statsRes, activityRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity?limit=5')
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData.activities || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Welcome card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {user?.firstName}
            </h1>
            <p className="text-gray-500 mt-1">
              {user?.department} • {user?.level} Level
            </p>
          </div>
          {user?.biometricEnrolled && (
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
              <Shield size={14} />
              Verified
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Access</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.totalAccess}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.thisMonth}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Last Access</p>
          <p className="text-lg font-medium text-gray-900 mt-1">
            {stats.lastAccess ? new Date(stats.lastAccess).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/qr-code" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <QrCode size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">My QR Code</h3>
              <p className="text-sm text-gray-500">View and share your identity</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>

        <Link href="/dashboard/history" className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <History size={24} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Access History</h3>
              <p className="text-sm text-gray-500">View your activity log</p>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, idx) => (
              <div key={idx} className="px-4 py-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.status === 'SUCCESS' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <CheckCircle size={16} className={activity.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.action || 'Access'}</p>
                  <p className="text-xs text-gray-500">{activity.location || 'Campus'}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <Clock size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
        {recentActivity.length > 0 && (
          <Link href="/dashboard/history" className="block px-4 py-3 text-center text-sm text-blue-600 font-medium hover:bg-gray-50 border-t border-gray-100">
            View all activity
          </Link>
        )}
      </div>
    </div>
  );
}