'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Calendar, Clock, MapPin, CheckCircle, XCircle, 
  Loader2, RefreshCw, QrCode, X, TrendingUp, Activity, AlertCircle, ChevronRight
} from 'lucide-react';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

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

interface AttendanceRecord {
  id: string;
  lectureSessionId: string;
  checkInTime: string;
  checkOutTime: string | null;
  method: string;
  lectureSession: LectureSession;
}

export default function StudentAttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<LectureSession[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({ totalAttendance: 0, thisMonth: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user data
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      // Load active sessions for student's department/level
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // 30 min ago
      const to = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
      
      const [sessionsRes, attendanceRes] = await Promise.all([
        fetch(`/api/lectures?from=${from}&to=${to}`),
        fetch('/api/dashboard/attendance'),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setActiveSessions(data.items || []);
      }

      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        setMyAttendance(data.attendance || []);
        
        // Calculate stats
        const totalAttendance = data.attendance?.length || 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const thisMonthCount = data.attendance?.filter((a: AttendanceRecord) => {
          const date = new Date(a.checkInTime);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length || 0;
        
        setStats({
          totalAttendance,
          thisMonth: thisMonthCount,
          attendanceRate: totalAttendance > 0 ? Math.round((thisMonthCount / totalAttendance) * 100) : 0
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async (sessionId: string) => {
    setCheckingIn(sessionId);
    setMessage(null);

    try {
      const res = await fetch(`/api/lectures/${sessionId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'QR_CODE' }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Successfully checked in!' });
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Check-in failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setCheckingIn(null);
    }
  };

  const isCheckedIn = (sessionId: string) => {
    return myAttendance.some((a) => a.lectureSessionId === sessionId);
  };

  const isSessionActive = (session: LectureSession) => {
    const now = new Date();
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return now >= start && now <= end;
  };

  const handleQRScan = async (code: string) => {
    setScanMessage(null);

    try {
      let sessionId = code;
      
      if (code.includes('/')) {
        try {
          const url = new URL(code);
          const pathParts = url.pathname.split('/');
          sessionId = pathParts[pathParts.length - 1] || code;
        } catch (e) {
          sessionId = code;
        }
      }

      const matchingSession = activeSessions.find(s => s.id === sessionId);
      
      if (!matchingSession) {
        setScanMessage({ type: 'error', text: 'Session not found. Please try again.' });
        return;
      }

      if (isCheckedIn(matchingSession.id)) {
        setScanMessage({ type: 'error', text: 'You are already checked in to this session.' });
        return;
      }

      if (!isSessionActive(matchingSession)) {
        setScanMessage({ type: 'error', text: 'This session is not currently active.' });
        return;
      }

      setCheckingIn(matchingSession.id);
      const res = await fetch(`/api/lectures/${matchingSession.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'QR_CODE' }),
      });

      const data = await res.json();

      if (res.ok) {
        setScanMessage({ type: 'success', text: `Successfully checked in to ${matchingSession.courseCode}!` });
        loadData();
        setTimeout(() => setShowScanner(false), 2000);
      } else {
        setScanMessage({ type: 'error', text: data.error || 'Check-in failed' });
      }
    } catch (error) {
      setScanMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const displayName = user?.firstName && user.firstName !== 'Unknown' 
    ? user.firstName 
    : user?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold mb-2">
              Lecture Attendance
            </h1>
            <p className="text-blue-100 text-sm lg:text-base">
              Track and manage your class attendance
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-brand-600" />
            </div>
            <TrendingUp size={16} className="text-success-500" />
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalAttendance}</p>
          <p className="text-sm text-gray-500 mt-1">Total Attendance</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-success-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.thisMonth}</p>
          <p className="text-sm text-gray-500 mt-1">This Month</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-brand-600" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{stats.attendanceRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Attendance Rate</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <XCircle size={20} className="text-red-600" />
          )}
          <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </p>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Scan Lecture QR Code</h2>
              <button
                onClick={() => setShowScanner(false)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {scanMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                scanMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {scanMessage.type === 'success' ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <XCircle size={18} className="text-red-600" />
                )}
                <p className={`text-sm ${scanMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {scanMessage.text}
                </p>
              </div>
            )}

            <QRScanner
              onScan={handleQRScan}
              width={280}
              height={280}
            />

            <p className="text-xs text-gray-500 text-center">
              Point your camera at the lecture QR code to check in
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowScanner(true)}
            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                <QrCode size={24} className="text-brand-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-0.5">Scan QR Code</h3>
                <p className="text-sm text-gray-500">Check in to a lecture</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-brand-600 transition-colors" />
            </div>
          </button>

          <Link 
            href="/dashboard/attendance-analytics" 
            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-brand-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                <TrendingUp size={24} className="text-brand-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-0.5">View Analytics</h3>
                <p className="text-sm text-gray-500">See your attendance trends</p>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-brand-600 transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Available Sessions</h2>
          {activeSessions.length > 0 && (
            <span className="text-sm text-gray-500">{activeSessions.length} session(s)</span>
          )}
        </div>

        {activeSessions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activeSessions.map((session) => {
              const checkedIn = isCheckedIn(session.id);
              const active = isSessionActive(session);

              return (
                <div key={session.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                      active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">
                        {session.courseCode} - {session.courseName}
                      </h3>
                      {session.lecturer && (
                        <p className="text-sm text-gray-500 mt-0.5">{session.lecturer}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {session.venue}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium whitespace-nowrap">
                          <CheckCircle size={16} />
                          Checked In
                        </span>
                      ) : active ? (
                        <button
                          onClick={() => checkIn(session.id)}
                          disabled={checkingIn === session.id}
                          className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap transition-colors"
                        >
                          {checkingIn === session.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <QrCode size={16} />
                          )}
                          Check In
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">Not started</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar size={32} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No Active Sessions</h3>
            <p className="text-sm text-gray-500">There are no lectures available for check-in right now</p>
          </div>
        )}
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Attendance</h2>
          {myAttendance.length > 0 && (
            <Link href="/dashboard/attendance-analytics" className="text-sm text-brand-600 font-medium hover:text-brand-700">
              View all
            </Link>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {myAttendance.length > 0 ? (
            myAttendance.slice(0, 5).map((record) => (
              <div key={record.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={18} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {record.lectureSession.courseCode} - {record.lectureSession.courseName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(record.checkInTime), 'MMM d, yyyy')} at {format(new Date(record.checkInTime), 'HH:mm')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                  record.method === 'QR_CODE' ? 'bg-blue-50 text-blue-700' :
                  record.method === 'FACIAL' ? 'bg-purple-50 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {record.method}
                </span>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={32} className="text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No attendance yet</h3>
              <p className="text-sm text-gray-500">Your attendance records will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
