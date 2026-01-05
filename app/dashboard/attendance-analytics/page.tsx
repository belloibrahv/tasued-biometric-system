'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Calendar, CheckCircle, XCircle, Clock,
  Loader2, RefreshCw, QrCode, Zap
} from 'lucide-react';

interface AttendanceStats {
  summary: {
    totalLectures: number;
    attendedLectures: number;
    attendanceRate: string;
    missedLectures: number;
  };
  verificationMethods: {
    qrCode: number;
    facial: number;
    manual: number;
    fingerprint: number;
  };
  recentAttendance: Array<{
    id: string;
    course: string;
    checkInTime: string;
    method: string;
    status: string;
  }>;
  trends: {
    period: string;
    data: Array<{
      date: string;
      count: number;
    }>;
  };
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
const METHOD_COLORS: { [key: string]: string } = {
  QR_CODE: '#3b82f6',
  FACIAL: '#8b5cf6',
  MANUAL: '#ec4899',
  FINGERPRINT: '#f59e0b',
};

export default function AttendanceAnalyticsPage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/lectures/stats');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load attendance statistics</p>
      </div>
    );
  }

  const methodData = [
    { name: 'QR Code', value: stats.verificationMethods.qrCode },
    { name: 'Facial', value: stats.verificationMethods.facial },
    { name: 'Manual', value: stats.verificationMethods.manual },
    { name: 'Fingerprint', value: stats.verificationMethods.fingerprint },
  ].filter(item => item.value > 0);

  const attendanceRate = parseFloat(stats.summary.attendanceRate);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Analytics</h1>
          <p className="text-gray-500 mt-1">Your attendance statistics and trends</p>
        </div>
        <button
          onClick={loadStats}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.summary.attendanceRate}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              attendanceRate >= 80 ? 'bg-green-100' : attendanceRate >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <TrendingUp size={24} className={
                attendanceRate >= 80 ? 'text-green-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              } />
            </div>
          </div>
        </div>

        {/* Attended Lectures */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Attended</p>
              <p className="text-3xl font-bold text-gray-900">{stats.summary.attendedLectures}</p>
              <p className="text-xs text-gray-500 mt-1">of {stats.summary.totalLectures}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        {/* Missed Lectures */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Missed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.summary.missedLectures}</p>
              <p className="text-xs text-gray-500 mt-1">lectures</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Total Lectures */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Lectures</p>
              <p className="text-3xl font-bold text-gray-900">{stats.summary.totalLectures}</p>
              <p className="text-xs text-gray-500 mt-1">last 30 days</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.trends.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Verification Methods */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Verification Methods</h2>
          {methodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={methodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {methodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No verification data available
            </div>
          )}
        </div>
      </div>

      {/* Verification Methods Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Verification Methods Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <QrCode size={18} className="text-blue-600" />
              <span className="text-sm text-gray-600">QR Code</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.verificationMethods.qrCode}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-purple-600" />
              <span className="text-sm text-gray-600">Facial</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.verificationMethods.facial}</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-pink-600" />
              <span className="text-sm text-gray-600">Manual</span>
            </div>
            <p className="text-2xl font-bold text-pink-600">{stats.verificationMethods.manual}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-amber-600" />
              <span className="text-sm text-gray-600">Fingerprint</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.verificationMethods.fingerprint}</p>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Check-ins</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.recentAttendance.length > 0 ? (
            stats.recentAttendance.map((record) => (
              <div key={record.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{record.course}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(record.checkInTime), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    record.method === 'QR_CODE' ? 'bg-blue-100 text-blue-700' :
                    record.method === 'FACIAL' ? 'bg-purple-100 text-purple-700' :
                    record.method === 'MANUAL' ? 'bg-pink-100 text-pink-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {record.method}
                  </span>
                  <CheckCircle size={18} className="text-green-600" />
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              No recent check-ins
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
