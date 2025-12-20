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
    <div className="space-y-10 pb-12">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-[32px] bg-mesh p-8 md:p-12 border border-white/40 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 bg-brand-500/10 px-3 py-1 rounded-full mb-4"
            >
              <Shield size={14} className="text-brand-600" />
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-widest">Global Identity Active</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-black text-surface-950 tracking-tight"
            >
              Hello, {user?.firstName || 'Student'} <span className="text-brand-500 underline decoration-brand-200 underline-offset-8">BioVault</span>
            </motion.h1>
            <p className="text-surface-600 mt-4 text-lg max-w-lg font-medium">Manage your smart university identity and monitor your secure access logs in real-time.</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Link href="/dashboard/qr-code" className="btn-outline !bg-white/50 backdrop-blur-sm flex-1 md:flex-none justify-center py-3 px-6 text-sm flex items-center gap-2 group hover:border-brand-500 transition-all">
              <QrCode size={18} className="group-hover:scale-110 transition-transform" /> Show ID
            </Link>
            <Link href="/dashboard/export" className="btn-primary flex-1 md:flex-none justify-center py-3 px-6 text-sm flex items-center gap-2 shadow-brand-lg">
              <Download size={18} /> Export Data
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 group hover:translate-y-[-4px] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${stat.positive ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
                }`}>
                {stat.positive ? '+' : '-'}{stat.change.replace(/[+-]/g, '')}
              </span>
            </div>
            <div className="text-3xl font-black text-surface-950">{stat.value}</div>
            <div className="text-xs text-surface-500 font-bold uppercase tracking-widest mt-2">{stat.label}</div>
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
          <div className="glass-card overflow-hidden h-full flex flex-col">
            <div className="bg-brand-gradient p-8 text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full" />
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 bg-white/20 px-3 py-1 rounded-full">Official Student Card</span>
                <Shield size={24} className="opacity-80" />
              </div>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[24px] bg-white text-brand-600 flex items-center justify-center shadow-lg transform rotate-3">
                  <User size={40} />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight leading-tight">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm opacity-80 font-mono mt-1 tracking-widest">{user?.matricNumber}</p>
                </div>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col justify-center bg-white/50">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-surface-500 uppercase tracking-widest">Global QR Passport</span>
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded flex items-center gap-1.5">
                  <RefreshCw size={10} className={qrRefreshTime <= 30 ? 'animate-spin' : ''} />
                  {Math.floor(qrRefreshTime / 60)}:{(qrRefreshTime % 60).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="bg-white p-6 rounded-[32px] border-4 border-brand-500/10 mx-auto w-fit shadow-2xl shadow-brand-500/10 group cursor-pointer active:scale-95 transition-transform">
                {qrCode ? (
                  <QRCodeSVG value={qrCode.code} size={200} level="H" fgColor="#0F172A" />
                ) : (
                  <div className="w-[200px] h-[200px] bg-surface-100 animate-pulse rounded-[24px]" />
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <Link href="/dashboard/qr-code" className="btn-primary flex-1 py-3 text-xs uppercase font-bold tracking-widest text-center !rounded-2xl">
                  Fullscreen Access
                </Link>
                <button onClick={refreshQRCode} className="btn-outline !bg-white p-3 !rounded-2xl hover:border-brand-500 hover:text-brand-500 transition-colors">
                  <RefreshCw size={20} />
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
          <div className="glass-card p-8 h-full bg-mesh/50">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-surface-950 uppercase tracking-tight">Access Journey</h3>
                <p className="text-xs font-bold text-surface-500 uppercase tracking-widest mt-1">Verification traffic • Last 7 Days</p>
              </div>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-brand-500 shadow-brand animate-pulse" />
                <span className="text-[10px] font-black uppercase text-brand-600">Live Telemetry</span>
              </div>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0066CC" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#CBD5E1" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '24px',
                      border: '1px solid rgba(226, 232, 240, 0.5)',
                      boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
                      padding: '12px 16px',
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#0F172A' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0066CC"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorAccess)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card flex flex-col"
        >
          <div className="p-8 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-surface-950 uppercase tracking-tight">Access History</h3>
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">Real-time audit log</p>
            </div>
            <Link href="/dashboard/history" className="text-xs font-black text-brand-600 uppercase tracking-widest hover:underline px-4 py-2 bg-brand-50 rounded-full transition-colors">
              Full Log
            </Link>
          </div>
          <div className="divide-y divide-surface-100 flex-1">
            {activities.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-surface-300" size={24} />
                </div>
                <p className="text-surface-500 font-medium">No activity recorded yet</p>
              </div>
            ) : (
              activities.map((item) => {
                const Icon = getServiceIcon(item.serviceSlug);
                return (
                  <div key={item.id} className="p-6 flex items-center gap-6 hover:bg-surface-50/50 transition-colors group">
                    <div className={`p-4 rounded-2xl ${item.status === 'SUCCESS' ? 'bg-success-100 text-success-600' : 'bg-error-100 text-error-600'
                      } group-hover:scale-110 transition-transform shadow-sm`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-surface-950 text-sm uppercase tracking-tight">{item.service}</p>
                      <p className="text-xs text-surface-500 font-medium mt-1">{item.action}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${item.status === 'SUCCESS' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
                        }`}>
                        {item.status === 'SUCCESS' ? 'Verified' : 'Flagged'}
                      </span>
                      <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest mt-2">{formatTimeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Connected Services */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card flex flex-col"
        >
          <div className="p-8 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-surface-950 uppercase tracking-tight">Active Nodes</h3>
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">Authorized service points</p>
            </div>
            <Link href="/dashboard/services" className="text-xs font-black text-brand-600 uppercase tracking-widest hover:underline px-4 py-2 bg-brand-50 rounded-full transition-colors">
              Manage
            </Link>
          </div>
          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {services.length === 0 ? (
              <div className="col-span-2 p-12 text-center">
                <p className="text-surface-500 font-medium">Link university services to begin</p>
              </div>
            ) : (
              services.map((service) => {
                const Icon = getServiceIcon(service.slug);
                return (
                  <motion.div
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-surface-50/50 rounded-[28px] border border-surface-100 hover:border-brand-200 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-600 mb-4 shadow-sm group-hover:bg-brand-500 group-hover:text-white transition-all">
                      <Icon size={24} />
                    </div>
                    <h4 className="font-black text-surface-950 text-sm uppercase tracking-tight">{service.name}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                      <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{service.accessCount} Accesses</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          <div className="p-8 pt-0">
            <Link href="/dashboard/services" className="btn-primary w-full py-4 text-xs font-black uppercase tracking-[0.2em] shadow-brand-lg">
              Authorized Marketplace
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
