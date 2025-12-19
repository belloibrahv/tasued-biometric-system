'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, CheckCircle, XCircle, Clock, ScanLine, QrCode,
  TrendingUp, Activity, AlertTriangle
} from 'lucide-react';

export default function OperatorDashboard() {
  const [stats, setStats] = useState({
    todayVerifications: 0,
    successRate: 0,
    pendingVerifications: 0,
    failedAttempts: 0,
  });
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/operator/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentVerifications(data.recentVerifications || []);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: "Today's Verifications",
      value: stats.todayVerifications,
      icon: ScanLine,
      color: 'bg-brand-500',
      change: '+12%',
    },
    {
      label: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: CheckCircle,
      color: 'bg-success-500',
      change: '+2.5%',
    },
    {
      label: 'Pending',
      value: stats.pendingVerifications,
      icon: Clock,
      color: 'bg-warning-500',
      change: '-5',
    },
    {
      label: 'Failed Attempts',
      value: stats.failedAttempts,
      icon: XCircle,
      color: 'bg-error-500',
      change: '-8%',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-950">Operator Dashboard</h1>
        <p className="text-surface-500 mt-1">Monitor and manage student verifications</p>
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
              <div className={`p-2.5 rounded-xl ${stat.color} text-white`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-bold text-success-600 bg-success-50 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-surface-900">{stat.value}</div>
            <div className="text-xs text-surface-500 font-medium mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/operator/verify"
          className="glass-card p-6 hover:border-brand-300 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-brand-50 rounded-2xl text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-all">
              <ScanLine size={28} />
            </div>
            <div>
              <h3 className="font-bold text-surface-900">Verify Student</h3>
              <p className="text-sm text-surface-500">Single student verification</p>
            </div>
          </div>
        </a>

        <a
          href="/operator/scanner"
          className="glass-card p-6 hover:border-success-300 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-success-50 rounded-2xl text-success-500 group-hover:bg-success-500 group-hover:text-white transition-all">
              <QrCode size={28} />
            </div>
            <div>
              <h3 className="font-bold text-surface-900">QR Scanner</h3>
              <p className="text-sm text-surface-500">Scan student QR codes</p>
            </div>
          </div>
        </a>

        <a
          href="/operator/bulk"
          className="glass-card p-6 hover:border-accent-300 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-accent-50 rounded-2xl text-accent-500 group-hover:bg-accent-500 group-hover:text-white transition-all">
              <Users size={28} />
            </div>
            <div>
              <h3 className="font-bold text-surface-900">Bulk Verification</h3>
              <p className="text-sm text-surface-500">Verify multiple students</p>
            </div>
          </div>
        </a>
      </div>

      {/* Recent Verifications */}
      <div className="glass-card">
        <div className="p-6 border-b border-surface-100">
          <h3 className="font-bold text-surface-900">Recent Verifications</h3>
        </div>
        <div className="divide-y divide-surface-100">
          {loading ? (
            <div className="p-8 text-center text-surface-500">Loading...</div>
          ) : recentVerifications.length === 0 ? (
            <div className="p-8 text-center text-surface-500">
              No verifications yet today
            </div>
          ) : (
            recentVerifications.map((verification, idx) => (
              <div key={idx} className="p-4 flex items-center gap-4 hover:bg-surface-50">
                <div className={`p-2.5 rounded-xl ${
                  verification.status === 'SUCCESS' ? 'bg-success-50 text-success-500' : 'bg-error-50 text-error-500'
                }`}>
                  {verification.status === 'SUCCESS' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-surface-900">{verification.studentName}</p>
                  <p className="text-sm text-surface-500">{verification.matricNumber}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    verification.status === 'SUCCESS' ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-600'
                  }`}>
                    {verification.status}
                  </span>
                  <p className="text-xs text-surface-400 mt-1">{verification.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
