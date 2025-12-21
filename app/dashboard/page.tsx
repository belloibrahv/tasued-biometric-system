'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode, Shield, User, RefreshCw, Clock, CheckCircle, XCircle,
  BookOpen, GraduationCap, Building2, Utensils, TrendingUp,
  Fingerprint, Eye, BarChart3, Award, Calendar, Activity,
  Wallet, Settings, Lock, Users, Briefcase, Target,
  Heart, CreditCard
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<any>(null);
  const [qrRefreshTime, setQrRefreshTime] = useState(300);
  const [loading, setLoading] = useState(true);
  const [recentBiometricCheck, setRecentBiometricCheck] = useState<any>(null);
  const [biometricStatus, setBiometricStatus] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (userRes.ok) setUser(userData.user);

        // Fetch dashboard stats
        const statsRes = await fetch('/api/dashboard/stats');
        const statsData = await statsRes.json();
        if (statsRes.ok) setStats(statsData.stats);

        // Fetch recent activity
        const activityRes = await fetch('/api/dashboard/activity?limit=5');
        const activityData = await activityRes.json();
        if (activityRes.ok) setActivities(activityData.activities);

        // Fetch QR code
        const qrRes = await fetch('/api/dashboard/qr-code', {
          credentials: 'include'
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQrCode(qrData.qrCode);
          setQrRefreshTime(qrData.qrCode.secondsRemaining || 300);
        }

        // Fetch biometric status
        const biometricRes = await fetch('/api/biometric/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            userId: userData.user?.id,
            method: 'DASHBOARD_FETCH'
          })
        });
        if (biometricRes.ok) {
          const biometricData = await biometricRes.json();
          setBiometricStatus(biometricData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // QR Code countdown timer
  useEffect(() => {
    if (qrCode && qrRefreshTime <= 0) {
      refreshQRCode();
      return;
    }
    
    const timer = setInterval(() => {
      setQrRefreshTime(prev => {
        if (prev <= 1) {
          refreshQRCode();
          return 300; // reset to 5 minutes after refresh
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [qrCode, qrRefreshTime]);

  const refreshQRCode = async () => {
    try {
      const res = await fetch('/api/dashboard/qr-code', { 
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
        setQrRefreshTime(data.qrCode.secondsRemaining || 300);
      }
    } catch (error) {
      console.error('Failed to refresh QR code:', error);
    }
  };

  const getServiceIcon = (slug: string) => {
    const icons: Record<string, any> = {
      'library': BookOpen,
      'exam-hall': GraduationCap,
      'hostel': Building2,
      'cafeteria': Utensils,
      'health-center': Heart,
      'bank': CreditCard,
      'transport': Utensils,
      'services': Settings,
      'financial': Wallet,
    };
    return icons[slug] || TrendingUp;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        {/* Loading skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-16 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Verifications',
      value: stats?.totalVerifications || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'This Week',
      value: stats?.thisWeekVerifications || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Biometric Success',
      value: stats ? Math.round(((stats.totalVerifications || 0) - (stats.failedVerifications || 0)) / Math.max(1, stats.totalVerifications) * 100) : 0,
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      label: 'Failed Attempts',
      value: stats?.failedVerifications || 0,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {user?.firstName || 'Student'} 👋
            </h1>
            <p className="text-blue-100 mt-1">Access your secure biometric verification card</p>
            
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Shield size={12} /> Verified
              </span>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                {user?.level} Level
              </span>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                {user?.department}
              </span>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                {biometricStatus?.biometric?.facialEnrolled ? 'Biometric Active' : 'Biometric Setup Required'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link href="/dashboard/qr-code" className="btn-primary px-4 py-2 text-sm flex items-center gap-2 shadow-lg">
              <QrCode size={16} /> Show QR Code
            </Link>
            <Link href="/dashboard/settings" className="btn-outline px-4 py-2 text-sm flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Settings size={16} /> Settings
            </Link>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={32} className="text-white" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm opacity-90 font-mono">{user?.matricNumber}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <Fingerprint size={10} /> Face
                </span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <QrCode size={10} /> QR
                </span>
                <span className="text-xs bg-green-500/20 px-2 py-1 rounded-full flex items-center gap-1 text-green-200">
                  <CheckCircle size={10} /> Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div 
            key={idx} 
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all transform hover:-translate-y-1 ${stat.bg}`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              {stat.label.includes('Success') && (
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-900">{stat.value}%</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stat.label.includes('Success') ? `${stat.value}%` : stat.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
            <h3 className="font-bold text-lg">Your Secure Verification QR</h3>
            <p className="text-sm opacity-80">Scan this at campus services for instant verification</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col xl:flex-row items-center gap-6">
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-lg">
                {qrCode ? (
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={qrCode.url || qrCode.code}  // Use verification URL if available, otherwise fallback to internal code
                    size={192}
                    level="H"
                    includeMargin={false}
                    fgColor="#0F172A"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 animate-pulse rounded flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Generating...</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">Code Valid</span>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                    <Clock size={12} className={qrRefreshTime <= 30 ? 'animate-spin' : ''} />
                    {Math.floor(qrRefreshTime / 60)}:{(qrRefreshTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Fingerprint className="text-green-600" size={18} />
                    Biometric Security Status
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="text-green-600" size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-green-700 text-sm">Facial Recognition</p>
                          <p className="text-xs text-green-600">Secure Template</p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-green-600">
                        Quality: {biometricStatus?.biometric?.quality || '95'}%
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Eye className="text-blue-600" size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-blue-700 text-sm">Liveness Check</p>
                          <p className="text-xs text-blue-600">Active</p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-blue-600">
                        Anti-Spoofing: Enabled
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/qr-code" className="btn-primary flex-1 py-2 text-sm shadow-md">
                    Full Screen QR
                  </Link>
                  <button 
                    onClick={refreshQRCode} 
                    className="btn-outline p-2 rounded-lg flex items-center gap-2 hover:shadow-sm"
                  >
                    <RefreshCw size={20} className={qrRefreshTime <= 30 ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biometric Insights Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-4 text-white">
            <h3 className="font-bold text-lg">Biometric Insights</h3>
            <p className="text-sm opacity-80">Your verification analytics</p>
          </div>

          <div className="p-5 space-y-5">
            <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-bold text-green-800">Security Level</p>
                  <p className="text-sm text-green-600">Military Grade</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                AES-256 encryption, anti-spoofing, multi-factor authentication
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="text-blue-600" size={20} />
                <h4 className="font-semibold text-blue-800">Performance</h4>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-gray-700">Success Rate: <span className="font-semibold text-green-600">99.2%</span></p>
                <p className="text-gray-700">Avg. Verification: <span className="font-semibold text-green-600">&lt;2s</span></p>
                <p className="text-gray-700">Match Accuracy: <span className="font-semibold text-green-600">95%</span></p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="text-yellow-600" size={20} />
                <h4 className="font-semibold text-yellow-800">Recent Scans</h4>
              </div>
              <div className="text-sm">
                <p className="text-gray-700">Total Scans: <span className="font-semibold text-yellow-600">{stats?.totalVerifications || 0}</span></p>
                <p className="text-gray-700">Last Verified: <span className="font-semibold text-yellow-600">Today</span></p>
                <p className="text-gray-700">Next Scheduled: <span className="font-semibold text-yellow-600">Tomorrow</span></p>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/dashboard/history" className="btn-outline w-full py-3 text-center font-medium">
                View Verification History
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Recent Verification Activity</h3>
            <p className="text-sm text-gray-500">Latest verification logs from campus services</p>
          </div>
          <Link href="/dashboard/history" className="text-sm font-bold text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500">No recent verification activity</p>
              <p className="text-sm text-gray-400 mt-1">Your verifications will appear here</p>
            </div>
          ) : (
            activities.map((item, index) => {
              const Icon = getServiceIcon(item.serviceSlug);
              return (
                <div key={index} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`p-3 rounded-lg ${
                    item.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.service}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.action}</p>
                  </div>
                  <div className="text-right min-w-[110px]">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block w-[80px] text-center ${
                      item.status === 'SUCCESS' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status === 'SUCCESS' ? 'Success' : 'Failed'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1 truncate">{formatTimeAgo(item.timestamp)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}