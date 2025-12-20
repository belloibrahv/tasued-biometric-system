'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, CheckCircle, Server, Activity, TrendingUp, TrendingDown,
  UserPlus, Shield, AlertTriangle, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalVerifications: 0,
    activeServices: 0,
    newUsersToday: 0,
    verificationsTrend: 0,
    totalEnrollment: 0,
    successRate: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [serviceData, setServiceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setChartData(data.chartData || []);
          setServiceData(data.serviceData || []);
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
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-brand-500',
      change: `+${stats.newUsersToday} today`,
      positive: true,
    },
    {
      label: 'Biometric Enrollment',
      value: stats.totalEnrollment,
      icon: Shield,
      color: 'bg-success-500',
      change: `${stats.totalUsers > 0 ? Math.round((stats.totalEnrollment / stats.totalUsers) * 100) : 0}% enrolled`,
      positive: true,
    },
    {
      label: 'Total Verifications',
      value: stats.totalVerifications,
      icon: CheckCircle,
      color: 'bg-purple-500',
      change: `${stats.verificationsTrend > 0 ? '+' : ''}${stats.verificationsTrend}%`,
      positive: stats.verificationsTrend >= 0,
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: Activity,
      color: 'bg-accent-500',
      change: 'System optimal',
      positive: true,
    },
  ];

  const COLORS = ['#0066CC', '#059669', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] bg-mesh p-8 md:p-12 border border-white/40 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full" />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 bg-brand-500/10 px-3 py-1 rounded-full mb-4"
          >
            <Shield size={14} className="text-brand-600" />
            <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">System Controller Active</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
          >
            Administrative <span className="text-brand-400">Command Center</span>
          </motion.h1>
          <p className="text-surface-400 mt-4 text-lg max-w-lg font-medium">Real-time oversight of TASUED&apos;s biometric identity ecosystem and service nodes.</p>
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
            className="glass-card-dark p-6 group hover:translate-y-[-4px] transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color} text-white group-hover:scale-110 transition-transform shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-white/5 text-white/70 border border-white/10`}>
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-black text-white">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-surface-400 font-bold uppercase tracking-widest mt-2">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verifications Chart */}
        <div className="glass-card-dark p-8 border border-white/5">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Velocity</h3>
              <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">Verification Trends • Last 24 Hours</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVerifications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066CC" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff10" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#ffffff40"
                  fontSize={10}
                  fontWeight={800}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#ffffff40"
                  fontSize={10}
                  fontWeight={800}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0066CC"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorVerifications)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Usage */}
        <div className="bg-surface-800 rounded-2xl p-6 border border-surface-700">
          <h3 className="font-bold text-white mb-6">Service Usage</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {serviceData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-surface-300">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { href: '/admin/users', title: 'User Management', desc: 'Control student identities', icon: UserPlus, color: 'from-brand-500 to-brand-700' },
          { href: '/admin/services', title: 'Node Config', desc: 'Secure service terminals', icon: Server, color: 'from-success-500 to-success-700' },
          { href: '/admin/audit', title: 'Audit Engine', desc: 'Unified security logs', icon: Shield, color: 'from-accent-500 to-accent-700' },
        ].map((action, idx) => (
          <Link
            key={action.title}
            href={action.href}
            className="glass-card-dark p-8 group hover:scale-[1.05] transition-all duration-500 overflow-hidden relative"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.color} opacity-10 blur-[40px] rounded-full`} />
            <div className="flex items-center gap-6 relative z-10">
              <div className={`p-5 bg-gradient-to-br ${action.color} rounded-[24px] text-white shadow-xl`}>
                <action.icon size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{action.title}</h3>
                <p className="text-xs text-surface-500 font-bold uppercase tracking-widest mt-1">{action.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
