'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  QrCode, Shield, Activity, Clock, CheckCircle, XCircle,
  ArrowUpRight, ArrowDownRight, RefreshCw, Download,
  BookOpen, GraduationCap, Building2, Utensils,
  TrendingUp, User, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { DashboardSkeleton } from '@/components/Skeleton';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
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
        if (statsRes.ok) {
          setStats(statsData.stats);
          setChartData(statsData.chartData);
        }

        // Fetch recent activity
        const activityRes = await fetch('/api/dashboard/activity?limit=5');
        const activityData = await activityRes.json();
        if (activityRes.ok) setActivities(activityData.activities);

        // Fetch connected services
        const servicesRes = await fetch('/api/dashboard/services');
        const servicesData = await servicesRes.json();
        if (servicesRes.ok) setServices(servicesData.services.filter((s: any) => s.isConnected).slice(0, 4));

        // Fetch QR code
        const qrRes = await fetch('/api/dashboard/qr-code');
        const qrData = await qrRes.json();
        if (qrRes.ok) {
          setQrCode(qrData.qrCode);
          setQrRefreshTime(qrData.qrCode.secondsRemaining);
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
    if (qrRefreshTime <= 0) {
      refreshQRCode();
      return;
    }
    const timer = setInterval(() => {
      setQrRefreshTime((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [qrRefreshTime]);

  const refreshQRCode = async () => {
    try {
      const res = await fetch('/api/dashboard/qr-code', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setQrRefreshTime(data.qrCode.secondsRemaining);
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
    return icons[slug] || Activity;
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
    return <DashboardSkeleton />;
  }

  const statCards = [
    { 
      label: 'Total Verifications', 
      value: stats?.totalVerifications || 0, 
      change: `+${stats?.weeklyChange || 0}%`, 
      positive: (stats?.weeklyChange || 0) >= 0, 
      icon: CheckCircle, 
      color: 'text-success-500', 
      bg: 'bg-success-50' 
    },
    { 
      label: 'Services Connected', 
      value: stats?.connectedServices || 0, 
      change: '+2', 
      positive: true, 
      icon: Activity, 
      color: 'text-brand-500', 
      bg: 'bg-brand-50' 
    },
    { 
      label: 'This Week', 
      value: stats?.thisWeekVerifications || 0, 
      change: `+${stats?.weeklyChange || 0}%`, 
      positive: true, 
      icon: TrendingUp, 
      color: 'text-purple-500', 
      bg: 'bg-purple-50' 
    },
    { 
      label: 'Failed Attempts', 
      value: stats?.failedVerifications || 0, 
      change: '-50%', 
      positive: true, 
      icon: XCircle, 
      color: 'text-error-500', 
      bg: 'bg-error-50' 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold text-surface-950"
          >
            Welcome back, {user?.firstName || 'Student'}! 👋
          </motion.h1>
          <p className="text-surface-500 mt-1">Here&apos;s what&apos;s happening with your account today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/qr-code" className="btn-outline py-2 px-4 text-sm flex items-center gap-2">
            <QrCode size={18} /> Show QR
          </Link>
          <Link href="/dashboard/export" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <Download size={18} /> Export Data
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                stat.positive ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-600'
              }`}>
                {stat.positive ? <ArrowUpRight size={12} className="inline" /> : <ArrowDownRight size={12} className="inline" />}
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-surface-900">{stat.value}</div>
            <div className="text-xs text-surface-500 font-medium mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital ID Card with QR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="glass-card overflow-hidden">
            <div className="bg-brand-gradient p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Digital Student ID</span>
                <Shield size={20} className="opacity-80" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm opacity-80 font-mono">{user?.matricNumber}</p>
                  <p className="text-xs opacity-70">{user?.department} • {user?.level} Level</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-surface-700">Your QR Code</span>
                <span className="text-xs text-surface-500 flex items-center gap-1">
                  <RefreshCw size={12} className={qrRefreshTime <= 30 ? 'animate-spin text-warning-500' : ''} />
                  {Math.floor(qrRefreshTime / 60)}:{(qrRefreshTime % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border-2 border-brand-500 mx-auto w-fit">
                {qrCode ? (
                  <QRCodeSVG value={qrCode.code} size={160} level="H" fgColor="#0066CC" />
                ) : (
                  <div className="w-40 h-40 bg-surface-100 animate-pulse rounded" />
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Link href="/dashboard/qr-code" className="btn-primary flex-1 py-2 text-sm text-center">
                  Full Screen
                </Link>
                <button onClick={refreshQRCode} className="btn-outline py-2 px-4 text-sm">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-surface-900">Access Frequency</h3>
                <p className="text-sm text-surface-500">Your verification activity this week</p>
              </div>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066CC" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#0066CC" strokeWidth={3} fillOpacity={1} fill="url(#colorAccess)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card"
        >
          <div className="p-6 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-bold text-surface-900">Recent Activity</h3>
            <Link href="/dashboard/history" className="text-sm text-brand-500 font-semibold hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-surface-100">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-surface-500">No recent activity</div>
            ) : (
              activities.map((item) => {
                const Icon = getServiceIcon(item.serviceSlug);
                return (
                  <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-surface-50 transition-colors">
                    <div className={`p-2.5 rounded-xl ${
                      item.status === 'SUCCESS' ? 'bg-success-50 text-success-500' : 'bg-error-50 text-error-500'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-surface-900">{item.service}</p>
                      <p className="text-sm text-surface-500">{item.action}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        item.status === 'SUCCESS' ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-600'
                      }`}>
                        {item.status === 'SUCCESS' ? 'Success' : 'Failed'}
                      </span>
                      <p className="text-xs text-surface-400 mt-1">{formatTimeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Connected Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card"
        >
          <div className="p-6 border-b border-surface-100 flex items-center justify-between">
            <h3 className="font-bold text-surface-900">Connected Services</h3>
            <Link href="/dashboard/services" className="text-sm text-brand-500 font-semibold hover:underline">
              Manage
            </Link>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            {services.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-surface-500">No services connected</div>
            ) : (
              services.map((service) => {
                const Icon = getServiceIcon(service.slug);
                return (
                  <div key={service.id} className="p-4 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white mb-3">
                      <Icon size={20} />
                    </div>
                    <h4 className="font-semibold text-surface-900">{service.name}</h4>
                    <p className="text-xs text-surface-500 mt-1">{service.accessCount} accesses</p>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 border-t border-surface-100">
            <Link href="/dashboard/services" className="btn-outline w-full py-2 text-sm text-center block">
              Connect More Services
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
