'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode, Shield, User, RefreshCw, Clock, CheckCircle, XCircle,
  BookOpen, GraduationCap, Building2, Utensils, TrendingUp
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<any>(null);
  const [qrRefreshTime, setQrRefreshTime] = useState(300);
  const [loading, setLoading] = useState(true);

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

        // Fetch QR code - rely on HttpOnly cookie being sent automatically
        const qrRes = await fetch('/api/dashboard/qr-code', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQrCode(qrData.qrCode);
          setQrRefreshTime(qrData.qrCode.secondsRemaining || 300);
        } else {
          console.error('QR Code API Error:', qrRes.status, await qrRes.text());
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
    if (!qrCode || qrRefreshTime <= 0) {
      if (qrCode) {
        refreshQRCode();
      }
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
        setQrRefreshTime(data.qrCode.secondsRemaining || 300);
      } else {
        console.error('QR Refresh Error:', res.status, await res.text());
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
      label: 'Successful Verifications',
      value: (stats?.totalVerifications || 0) - (stats?.failedVerifications || 0),
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50'
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.firstName || 'Student'}
            </h1>
            <p className="text-gray-600 mt-1">Access your biometric verification card</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/qr-code" className="btn-outline px-4 py-2 text-sm flex items-center gap-2">
              <QrCode size={16} /> Show QR Code
            </Link>
          </div>
        </div>
        
        {/* User Info Card */}
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h3>
            <p className="text-sm text-gray-600">{user?.matricNumber}</p>
            <p className="text-sm text-gray-500">{user?.department} • {user?.level}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon size={24} className={stat.color} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 p-4 text-white">
            <h3 className="font-bold">Your Verification QR</h3>
            <p className="text-sm opacity-80">Scan this at campus services</p>
          </div>

          <div className="p-8 flex flex-col items-center">
            <div className="mb-6 w-full flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">QR Code Valid</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                <RefreshCw size={10} className={qrRefreshTime <= 30 ? 'animate-spin' : ''} />
                {Math.floor(qrRefreshTime / 60)}:{(qrRefreshTime % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-inner w-fit mb-6">
              {qrCode ? (
                qrCode.code && qrCode.code.trim() !== '' ? (
                  <div className="w-48 h-48 flex items-center justify-center p-4 bg-white">
                    <QRCodeSVG
                      id="qr-code-svg"
                      value={qrCode.code}
                      size={192}
                      level="H"
                      includeMargin={false}
                      fgColor="#0F172A"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-yellow-100 rounded flex items-center justify-center">
                    <span className="text-yellow-800 text-sm text-center">QR code not available</span>
                  </div>
                )
              ) : (
                <div className="w-48 h-48 bg-gray-100 animate-pulse rounded flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Generating...</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <Link href="/dashboard/qr-code" className="btn-primary flex-1 py-2 text-sm">
                Full Screen
              </Link>
              <button onClick={refreshQRCode} className="btn-outline p-2 rounded-lg">
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-gray-400" size={20} />
                </div>
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              activities.map((item) => {
                const Icon = getServiceIcon(item.serviceSlug);
                return (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      item.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.service}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.action}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        item.status === 'SUCCESS' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status === 'SUCCESS' ? 'Success' : 'Failed'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}