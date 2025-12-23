'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart3, TrendingUp, Users, CheckCircle, Download,
  Calendar, Filter, RefreshCw, Loader2, FileSpreadsheet, FileText
} from 'lucide-react';

interface ReportStats {
  totalVerifications: number;
  successRate: number;
  totalAttendance: number;
  activeUsers: number;
  verificationsByDay: { date: string; count: number; success: number }[];
  verificationsByService: { service: string; count: number }[];
  verificationsByMethod: { method: string; count: number }[];
  topUsers: { name: string; matricNumber: string; count: number }[];
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const [reportType, setReportType] = useState<'verifications' | 'attendance' | 'services'>('verifications');

  useEffect(() => {
    loadStats();
  }, [dateRange, reportType]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports?from=${dateRange.from}&to=${dateRange.to}&type=${reportType}`
      );
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const res = await fetch(
        `/api/admin/reports/export?from=${dateRange.from}&to=${dateRange.to}&type=${reportType}&format=${format}`
      );
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `biovault-report-${reportType}-${dateRange.from}-to-${dateRange.to}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const setQuickRange = (range: 'today' | 'week' | 'month' | 'quarter') => {
    const today = new Date();
    let from: Date;
    
    switch (range) {
      case 'today':
        from = today;
        break;
      case 'week':
        from = subDays(today, 7);
        break;
      case 'month':
        from = startOfMonth(today);
        break;
      case 'quarter':
        from = subDays(today, 90);
        break;
    }
    
    setDateRange({
      from: format(from, 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">View system statistics and export reports</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReport('csv')}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            Export CSV
          </button>
          <button
            onClick={() => exportReport('pdf')}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="verifications">Verifications</option>
              <option value="attendance">Attendance</option>
              <option value="services">Service Access</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Ranges */}
          <div className="flex items-end gap-2">
            <button onClick={() => setQuickRange('today')} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Today</button>
            <button onClick={() => setQuickRange('week')} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">7 Days</button>
            <button onClick={() => setQuickRange('month')} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">This Month</button>
            <button onClick={() => setQuickRange('quarter')} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">90 Days</button>
          </div>

          <button
            onClick={loadStats}
            disabled={loading}
            className="ml-auto p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : stats ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalVerifications.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Verifications</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.successRate}%</p>
                  <p className="text-sm text-gray-500">Success Rate</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalAttendance.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Attendance Records</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Active Users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Daily Trend</h3>
              <div className="h-64 flex items-end gap-1">
                {stats.verificationsByDay.slice(-14).map((day, idx) => {
                  const maxCount = Math.max(...stats.verificationsByDay.map(d => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${day.count} verifications`}
                      />
                      <span className="text-xs text-gray-400 -rotate-45 origin-left whitespace-nowrap">
                        {format(new Date(day.date), 'MM/dd')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Service */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">By Service</h3>
              <div className="space-y-3">
                {stats.verificationsByService.map((item, idx) => {
                  const maxCount = Math.max(...stats.verificationsByService.map(s => s.count), 1);
                  const width = (item.count / maxCount) * 100;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.service}</span>
                        <span className="font-medium text-gray-900">{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {stats.verificationsByService.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No service data</p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Method */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Verification Methods</h3>
              <div className="grid grid-cols-2 gap-4">
                {stats.verificationsByMethod.map((item, idx) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.method}</p>
                        <p className="text-xs text-gray-500">{item.count} uses</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Users */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Most Active Users</h3>
              <div className="space-y-2">
                {stats.topUsers.map((user, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.matricNumber}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.count}</span>
                  </div>
                ))}
                {stats.topUsers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No user data</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No data available for the selected period</p>
        </div>
      )}
    </div>
  );
}
