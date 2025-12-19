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
      label: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-success-500',
      change: '98% active',
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
      label: 'Active Services',
      value: stats.activeServices,
      icon: Server,
      color: 'bg-accent-500',
      change: 'All operational',
      positive: true,
    },
  ];

  const COLORS = ['#0066CC', '#059669', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-surface-400 mt-1">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-surface-800 rounded-2xl p-5 border border-surface-700"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.color} text-white`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                stat.positive ? 'bg-success-500/20 text-success-400' : 'bg-error-500/20 text-error-400'
              }`}>
                {stat.positive ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-surface-400 font-medium mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verifications Chart */}
        <div className="bg-surface-800 rounded-2xl p-6 border border-surface-700">
          <h3 className="font-bold text-white mb-6">Verification Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVerifications" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066CC" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0066CC" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                  }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0066CC"
                  strokeWidth={2}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/admin/users"
          className="bg-surface-800 rounded-2xl p-6 border border-surface-700 hover:border-brand-500 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-brand-500/20 rounded-2xl text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
              <UserPlus size={28} />
            </div>
            <div>
              <h3 className="font-bold text-white">Manage Users</h3>
              <p className="text-sm text-surface-400">View and manage students</p>
            </div>
          </div>
        </a>

        <a
          href="/admin/services"
          className="bg-surface-800 rounded-2xl p-6 border border-surface-700 hover:border-success-500 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-success-500/20 rounded-2xl text-success-400 group-hover:bg-success-500 group-hover:text-white transition-all">
              <Server size={28} />
            </div>
            <div>
              <h3 className="font-bold text-white">Services</h3>
              <p className="text-sm text-surface-400">Configure services</p>
            </div>
          </div>
        </a>

        <a
          href="/admin/audit"
          className="bg-surface-800 rounded-2xl p-6 border border-surface-700 hover:border-accent-500 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-accent-500/20 rounded-2xl text-accent-400 group-hover:bg-accent-500 group-hover:text-white transition-all">
              <Shield size={28} />
            </div>
            <div>
              <h3 className="font-bold text-white">Audit Logs</h3>
              <p className="text-sm text-surface-400">View system activity</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
