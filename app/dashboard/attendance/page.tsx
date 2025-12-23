'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, Clock, MapPin, CheckCircle, XCircle, 
  Loader2, RefreshCw, QrCode, ChevronRight 
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

interface AttendanceRecord {
  id: string;
  lectureSessionId: string;
  checkInTime: string;
  checkOutTime: string | null;
  method: string;
  lectureSession: LectureSession;
}

export default function StudentAttendancePage() {
  const [activeSessions, setActiveSessions] = useState<LectureSession[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lecture Attendance</h1>
          <p className="text-gray-500 mt-1">Check in to your lectures</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={20} />
        </button>
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

      {/* Active Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Available Sessions</h2>
          <p className="text-sm text-gray-500">Sessions you can check into now</p>
        </div>

        {activeSessions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {activeSessions.map((session) => {
              const checkedIn = isCheckedIn(session.id);
              const active = isSessionActive(session);

              return (
                <div key={session.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {session.courseCode} - {session.courseName}
                      </h3>
                      {session.lecturer && (
                        <p className="text-sm text-gray-500">{session.lecturer}</p>
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
                    <div>
                      {checkedIn ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                          <CheckCircle size={16} />
                          Checked In
                        </span>
                      ) : active ? (
                        <button
                          onClick={() => checkIn(session.id)}
                          disabled={checkingIn === session.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          <div className="p-8 text-center">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="font-medium text-gray-900 mb-1">No Active Sessions</h3>
            <p className="text-sm text-gray-500">
              There are no lectures available for check-in right now
            </p>
          </div>
        )}
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Attendance</h2>
        </div>

        {myAttendance.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {myAttendance.slice(0, 10).map((record) => (
              <div key={record.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {record.lectureSession.courseCode} - {record.lectureSession.courseName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(record.checkInTime), 'MMM d, yyyy')} at {format(new Date(record.checkInTime), 'HH:mm')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  record.method === 'QR_CODE' ? 'bg-blue-100 text-blue-700' :
                  record.method === 'FACIAL' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {record.method}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Clock size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No attendance records yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
