'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Calendar, Clock, MapPin, QrCode, Download, RefreshCw,
  Loader2, Users, CheckCircle, Copy, Check
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
  userId: string;
  checkInTime: string;
  method: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function LecturerAttendancePage() {
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LectureSession | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQR, setLoadingQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadAttendance();
      generateQRCode();
      const interval = setInterval(loadAttendance, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
      const to = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`/api/lectures?from=${from}&to=${to}`);
      const data = await res.json();
      setSessions(data.items || []);

      if (data.items?.length > 0 && !selectedSession) {
        const activeSession = data.items.find((s: LectureSession) => {
          const start = new Date(s.startTime);
          const end = new Date(s.endTime);
          return now >= start && now <= end;
        });
        setSelectedSession(activeSession || data.items[0]);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    if (!selectedSession) return;
    try {
      const res = await fetch(`/api/lectures/${selectedSession.id}/attendance`);
      const data = await res.json();
      setAttendance(data.items || []);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    }
  };

  const generateQRCode = async () => {
    if (!selectedSession) return;
    setLoadingQR(true);
    try {
      const res = await fetch(`/api/lectures/${selectedSession.id}/qr-code`);
      const data = await res.json();
      setQrCode(data.qrCode);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setLoadingQR(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode) return;

    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${selectedSession?.courseCode}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copySessionId = () => {
    if (selectedSession) {
      navigator.clipboard.writeText(selectedSession.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSessionActive = (session: LectureSession) => {
    const now = new Date();
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lecture Attendance</h1>
          <p className="text-gray-500 mt-1">Display QR code for students to check in</p>
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
        {sessions.length > 0 ? (
          <select
            value={selectedSession?.id || ''}
            onChange={(e) => {
              const session = sessions.find((s) => s.id === e.target.value);
              setSelectedSession(session || null);
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a session...</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.courseCode} - {session.courseName} ({format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')})
                {isSessionActive(session) ? ' [ACTIVE]' : ''}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No lecture sessions found</p>
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Display */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <QrCode size={20} className="text-blue-600" />
                QR Code for Check-in
              </h2>

              {qrCode ? (
                <div className="space-y-4">
                  <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
                    <img src={qrCode} alt="Lecture QR Code" className="w-64 h-64" />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={downloadQRCode}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download QR Code
                    </button>
                    <button
                      onClick={generateQRCode}
                      disabled={loadingQR}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      {loadingQR ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    </button>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Session ID:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm font-mono text-gray-900 break-all">
                        {selectedSession.id}
                      </code>
                      <button
                        onClick={copySessionId}
                        className="px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
                      >
                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={32} className="animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Session Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Session Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  {format(new Date(selectedSession.startTime), 'HH:mm')} - {format(new Date(selectedSession.endTime), 'HH:mm')}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={16} />
                  {selectedSession.venue}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={16} />
                  {selectedSession.department} - Level {selectedSession.level}
                </div>
              </div>
            </div>
          </div>

          {/* Attendance List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Attendance ({attendance.length})</h2>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
              {attendance.length > 0 ? (
                attendance.map((record) => (
                  <div key={record.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.user.firstName} {record.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(record.checkInTime), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-12 text-center">
                  <Users size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No students checked in yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
