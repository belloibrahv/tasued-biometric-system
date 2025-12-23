'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { 
  QrCode, Users, CheckCircle, XCircle, Clock, RefreshCw, 
  Loader2, ChevronDown, Search, UserCheck, Calendar, MapPin 
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
  userId: string;
  checkInTime: string;
  checkOutTime: string | null;
  method: string;
  matchScore: number | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    matricNumber?: string;
  };
}

export default function OperatorAttendancePage() {
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<LectureSession | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualMatric, setManualMatric] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load active sessions
  useEffect(() => {
    loadSessions();
  }, []);

  // Load attendance when session changes
  useEffect(() => {
    if (selectedSession) {
      loadAttendance();
      // Auto-refresh every 15 seconds
      const interval = setInterval(loadAttendance, 15000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      const to = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours from now
      
      const res = await fetch(`/api/lectures?from=${from}&to=${to}`);
      const data = await res.json();
      setSessions(data.items || []);
      
      // Auto-select first active session
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

  const handleQRScan = useCallback(async (code: string) => {
    if (!selectedSession || checkingIn) return;
    
    setCheckingIn(true);
    setScanResult(null);

    try {
      // First verify the QR code to get user info
      const verifyRes = await fetch('/api/operator/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyData.success || !verifyData.student) {
        setScanResult({ success: false, message: verifyData.message || 'Invalid QR code' });
        playSound(false);
        return;
      }

      // Check in the student
      const checkInRes = await fetch(`/api/lectures/${selectedSession.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: verifyData.student.id,
          method: 'QR_CODE',
        }),
      });
      const checkInData = await checkInRes.json();

      if (checkInRes.ok) {
        setScanResult({
          success: true,
          message: 'Check-in successful',
          student: verifyData.student,
          attendance: checkInData.attendance,
        });
        playSound(true);
        loadAttendance();
      } else {
        setScanResult({ success: false, message: checkInData.error || 'Check-in failed' });
        playSound(false);
      }
    } catch (error) {
      setScanResult({ success: false, message: 'Network error' });
      playSound(false);
    } finally {
      setCheckingIn(false);
    }
  }, [selectedSession, checkingIn]);

  const handleManualCheckIn = async () => {
    if (!selectedSession || !manualMatric.trim() || checkingIn) return;

    setCheckingIn(true);
    setScanResult(null);

    try {
      // Search for user by matric number
      const searchRes = await fetch(`/api/operator/search?q=${encodeURIComponent(manualMatric)}`);
      const searchData = await searchRes.json();

      if (!searchData.students?.length) {
        setScanResult({ success: false, message: 'Student not found' });
        playSound(false);
        return;
      }

      const student = searchData.students[0];

      // Check in the student
      const checkInRes = await fetch(`/api/lectures/${selectedSession.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: student.id,
          method: 'MANUAL',
        }),
      });
      const checkInData = await checkInRes.json();

      if (checkInRes.ok) {
        setScanResult({
          success: true,
          message: 'Check-in successful',
          student,
          attendance: checkInData.attendance,
        });
        playSound(true);
        loadAttendance();
        setManualMatric('');
      } else {
        setScanResult({ success: false, message: checkInData.error || 'Check-in failed' });
        playSound(false);
      }
    } catch (error) {
      setScanResult({ success: false, message: 'Network error' });
      playSound(false);
    } finally {
      setCheckingIn(false);
    }
  };

  const playSound = (success: boolean) => {
    try {
      const audio = new Audio(success ? '/sounds/success.mp3' : '/sounds/error.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };

  const filteredAttendance = attendance.filter((a) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.user.firstName?.toLowerCase().includes(query) ||
      a.user.lastName?.toLowerCase().includes(query) ||
      a.user.email?.toLowerCase().includes(query) ||
      a.user.matricNumber?.toLowerCase().includes(query)
    );
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lecture Attendance</h1>
          <p className="text-gray-500 mt-1">Scan QR codes to record student attendance</p>
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
          <div className="relative">
            <select
              value={selectedSession?.id || ''}
              onChange={(e) => {
                const session = sessions.find((s) => s.id === e.target.value);
                setSelectedSession(session || null);
                setScanResult(null);
              }}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a session...</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.courseCode} - {session.courseName} ({format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')})
                  {isSessionActive(session) ? ' [ACTIVE]' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No active lecture sessions found</p>
            <p className="text-sm">Sessions within 2 hours will appear here</p>
          </div>
        )}

        {selectedSession && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${isSessionActive(selectedSession) ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{selectedSession.courseCode} - {selectedSession.courseName}</h3>
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {format(new Date(selectedSession.startTime), 'HH:mm')} - {format(new Date(selectedSession.endTime), 'HH:mm')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {selectedSession.venue}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {attendance.length} checked in
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <QrCode size={20} className="text-blue-600" />
                QR Code Scanner
              </h2>
              
              <div className="flex justify-center">
                <QRScanner
                  onScan={handleQRScan}
                  width={280}
                  height={280}
                />
              </div>

              {/* Manual Entry */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">Manual Entry</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualMatric}
                    onChange={(e) => setManualMatric(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualCheckIn()}
                    placeholder="Enter matric number..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleManualCheckIn}
                    disabled={checkingIn || !manualMatric.trim()}
                    className="px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingIn ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div className={`rounded-xl border-2 p-4 ${
                scanResult.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-3">
                  {scanResult.success ? (
                    <CheckCircle size={32} className="text-green-600" />
                  ) : (
                    <XCircle size={32} className="text-red-600" />
                  )}
                  <div>
                    <p className={`font-semibold ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {scanResult.message}
                    </p>
                    {scanResult.student && (
                      <p className="text-sm text-gray-600">
                        {scanResult.student.firstName} {scanResult.student.lastName}
                        {scanResult.student.matricNumber && ` (${scanResult.student.matricNumber})`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Attendance List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Attendance ({attendance.length})</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <div key={record.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {record.user.firstName?.[0]}{record.user.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {record.user.firstName} {record.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{record.user.matricNumber || record.user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {format(new Date(record.checkInTime), 'HH:mm')}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        record.method === 'QR_CODE' ? 'bg-blue-100 text-blue-700' :
                        record.method === 'FACIAL' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {record.method}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-12 text-center">
                  <Users size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'No matching students' : 'No students checked in yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
