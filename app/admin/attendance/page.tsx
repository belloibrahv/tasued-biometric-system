'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Download, Loader2, RefreshCw, Search, Filter, Calendar,
  Users, TrendingUp, CheckCircle
} from 'lucide-react';

interface LectureSession {
  id: string;
  courseCode: string;
  courseName: string;
  lecturer: string | null;
  venue: string;
  startTime: string;
  endTime: string;
  department: string;
  level: string;
}

interface AttendanceStats {
  session: LectureSession;
  stats: {
    totalStudents: number;
    successfulCheckins: number;
    failedCheckins: number;
    successRate: string;
    verificationMethods: {
      qrCode: number;
      facial: number;
      manual: number;
    };
  };
  attendance: Array<{
    id: string;
    matricNumber: string;
    name: string;
    email: string;
    department: string;
    level: string;
    checkInTime: string;
    method: string;
    status: string;
  }>;
}

export default function AdminAttendancePage() {
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LectureSession | null>(null);
  const [report, setReport] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`/api/lectures?from=${from}&to=${to}&take=100`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (sessionId: string) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/lectures/${sessionId}/attendance-report`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleSessionSelect = (session: LectureSession) => {
    setSelectedSession(session);
    loadReport(session.id);
  };

  const downloadReport = async (format: 'json' | 'csv') => {
    if (!selectedSession) return;

    try {
      const res = await fetch(`/api/lectures/${selectedSession.id}/attendance-report?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${selectedSession.courseCode}-${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  const filteredAttendance = report?.attendance.filter(a => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(query) ||
      a.email.toLowerCase().includes(query) ||
      a.matricNumber.toLowerCase().includes(query)
    );
  }) || [];

  const chartData = report ? [
    { name: 'Successful', value: report.stats.successfulCheckins },
    { name: 'Failed', value: report.stats.failedCheckins },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 mt-1">View and manage lecture attendance records</p>
        </div>
        <button
          onClick={loadSessions}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Session Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Lecture Session</label>
        <select
          value={selectedSession?.id || ''}
          onChange={(e) => {
            const session = sessions.find(s => s.id === e.target.value);
            if (session) handleSessionSelect(session);
          }}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a session...</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.courseCode} - {session.courseName} ({format(new Date(session.startTime), 'MMM d, HH:mm')})
            </option>
          ))}
        </select>
      </div>

      {selectedSession && report && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">{report.stats.totalStudents}</p>
                </div>
                <Users size={24} className="text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Checked In</p>
                  <p className="text-3xl font-bold text-green-600">{report.stats.successfulCheckins}</p>
                </div>
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{report.stats.successRate}%</p>
                </div>
                <TrendingUp size={24} className="text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">QR Code Scans</p>
                  <p className="text-3xl font-bold text-purple-600">{report.stats.verificationMethods.qrCode}</p>
                </div>
                <Calendar size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          {/* Session Details & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Session Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Session Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Course</p>
                  <p className="font-medium text-gray-900">{report.session.courseCode} - {report.session.courseName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Lecturer</p>
                  <p className="font-medium text-gray-900">{report.session.lecturer || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Venue</p>
                  <p className="font-medium text-gray-900">{report.session.venue}</p>
                </div>
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(report.session.startTime), 'HH:mm')} - {format(new Date(report.session.endTime), 'HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Department</p>
                  <p className="font-medium text-gray-900">{report.session.department} - Level {report.session.level}</p>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => downloadReport('csv')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download CSV
                </button>
                <button
                  onClick={() => downloadReport('json')}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download JSON
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Check-in Status</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Attendance List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Attendance Records</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Matric Number</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Check-in Time</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Method</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{record.matricNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{record.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{record.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {format(new Date(record.checkInTime), 'MMM d, HH:mm')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.method === 'QR_CODE' ? 'bg-blue-100 text-blue-700' :
                            record.method === 'FACIAL' ? 'bg-purple-100 text-purple-700' :
                            record.method === 'MANUAL' ? 'bg-pink-100 text-pink-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {record.method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
