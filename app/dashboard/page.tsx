'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, History, Shield, ChevronRight, CheckCircle, Clock, Activity, TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalAccess: 0, thisMonth: 0, lastAccess: null });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          console.log('User data from /api/auth/me:', userData);
          setUser(userData.user);
          
          // Check if user data is incomplete
          if (userData.error) {
            setError(userData.details || userData.error);
          }
        } else {
          const errorData = await userRes.json();
          console.error('User fetch error:', errorData);
          setError(errorData.details || errorData.error || 'Failed to load user data');
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
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  // Get display name - fallback to email if name is missing
  const displayName = user?.firstName && user.firstName !== 'Unknown' 
    ? user.firstName 
    : user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Error banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">Profile sync issue</p>
            <p className="text-sm text-yellow-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-blue-100 text-sm lg:text-base">
              {user?.department || 'Department not set'} • Level {user?.level || '-'}
            </p>
            <p className="text-blue-200 text-xs mt-1 font-mono">{user?.matricNumber || user?.email}</p>
          </div>
          {user?.biometricEnrolled && (
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
              <Shield size={18} />
              <span className="text-sm font-medium">Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-blue-600" />
            </div>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalAccess}</p>
          <p className="text-sm text-gray-500 mt-1">Total Access</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.thisMonth}</p>
          <p className="text-sm text-gray-500 mt-1">This Month</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-purple-600" />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {stats.lastAccess ? new Date(stats.lastAccess).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Last Access</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href="/dashboard/qr-code" 
            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <QrCode size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-0.5">My QR Code</h3>
                <p className="text-sm text-gray-500">View and share your identity</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </Link>

          <Link 
            href="/dashboard/history" 
            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <History size={24} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-0.5">Access History</h3>
                <p className="text-sm text-gray-500">View your activity log</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          {recentActivity.length > 0 && (
            <Link href="/dashboard/history" className="text-sm text-blue-600 font-medium hover:text-blue-700">
              View all
            </Link>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.status === 'SUCCESS' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <CheckCircle size={18} className={activity.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.action || 'Access Verification'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.location || 'Campus'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={32} className="text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No activity yet</h3>
              <p className="text-sm text-gray-500">Your verification history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
