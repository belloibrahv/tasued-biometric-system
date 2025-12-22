'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
      <div className="relative overflow-hidden rounded-[32px] bg-mesh p-8 md:p-12 border border-white/40 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full" />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 bg-brand-500/10 px-3 py-1 rounded-full mb-4"
          >
            <Activity size={14} className="text-brand-600" />
            <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Operator Terminal Live</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black text-surface-950 tracking-tight"
          >
            Verification <span className="text-brand-500">Workspace</span>
          </motion.h1>
          <p className="text-surface-600 mt-4 text-lg max-w-lg font-medium">Streamlined frontline interface for secure identity validation and student onboarding.</p>
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
              <div className={`p-3 rounded-2xl ${stat.color} text-white group-hover:scale-110 transition-transform shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-success-100 text-success-700`}>
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-black text-surface-950">{stat.value}</div>
            <div className="text-xs text-surface-500 font-bold uppercase tracking-widest mt-2">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { href: '/operator/verify', title: 'Verify Student', desc: 'Secure biometric portal', icon: ScanLine, color: 'from-brand-500 to-brand-700' },
          { href: '/operator/scanner', title: 'QR Scanner', desc: 'Instant barcode entry', icon: QrCode, color: 'from-success-500 to-success-700' },
          { href: '/operator/bulk', title: 'Bulk Mode', desc: 'High-traffic processing', icon: Users, color: 'from-accent-500 to-accent-700' },
        ].map((action, idx) => (
          <Link
            key={action.title}
            href={action.href}
            className="glass-card p-8 group hover:scale-[1.05] transition-all duration-500 overflow-hidden relative"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.color} opacity-10 blur-[40px] rounded-full transition-transform group-hover:scale-150`} />
            <div className="flex items-center gap-6 relative z-10">
              <div className={`p-5 bg-gradient-to-br ${action.color} rounded-[24px] text-white shadow-xl group-hover:-rotate-6 transition-transform`}>
                <action.icon size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black text-surface-950 uppercase tracking-tight">{action.title}</h3>
                <p className="text-xs text-surface-500 font-bold uppercase tracking-widest mt-1">{action.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card flex flex-col overflow-hidden"
      >
        <div className="p-8 border-b border-surface-100 flex items-center justify-between bg-white/50">
          <div>
            <h3 className="text-lg font-black text-surface-950 uppercase tracking-tight">Recent Sessions</h3>
            <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mt-1">Live verification stream</p>
          </div>
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-success-500 shadow-brand animate-pulse" />
            <span className="text-[10px] font-black uppercase text-brand-600">Active Node</span>
          </div>
        </div>
        <div className="divide-y divide-surface-100 flex-1">
          {loading ? (
            <div className="p-12 text-center text-surface-500 animate-pulse font-bold uppercase tracking-widest text-xs">Synchronizing Buffer...</div>
          ) : recentVerifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-surface-300" size={24} />
              </div>
              <p className="text-surface-500 font-medium">No sessions initiated yet</p>
            </div>
          ) : (
            recentVerifications.map((verification, idx) => (
              <div key={idx} className="p-6 flex items-center gap-6 hover:bg-surface-50/50 transition-colors group">
                <div className={`p-4 rounded-2xl ${verification.status === 'SUCCESS' ? 'bg-success-100 text-success-600' : 'bg-error-100 text-error-600'
                  } group-hover:scale-110 transition-transform shadow-sm`}>
                  {verification.status === 'SUCCESS' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                </div>
                <div className="flex-1">
                  <p className="font-black text-surface-950 text-sm uppercase tracking-tight">{verification.studentName}</p>
                  <p className="text-xs text-surface-500 font-bold uppercase tracking-widest mt-1">{verification.matricNumber}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${verification.status === 'SUCCESS' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
                    }`}>
                    {verification.status === 'SUCCESS' ? 'Authorized' : 'Rejected'}
                  </span>
                  <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest mt-2">{verification.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
