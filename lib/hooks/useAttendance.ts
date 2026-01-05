'use client';

import { useState, useCallback, useEffect } from 'react';

interface AttendanceRecord {
  id: string;
  lectureSessionId: string;
  checkInTime: string;
  checkOutTime: string | null;
  method: string;
  lectureSession: {
    id: string;
    courseCode: string;
    courseName: string;
    lecturer: string | null;
    venue: string;
    startTime: string;
    endTime: string;
    department: string;
    level: string;
  };
}

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

interface UseAttendanceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAttendance(options: UseAttendanceOptions = {}) {
  const { autoRefresh = false, refreshInterval = 10000 } = options;

  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active sessions
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
      const to = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`/api/lectures?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.items || []);
      } else {
        setError('Failed to load sessions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load user attendance
  const loadAttendance = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/attendance');
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.attendance || []);
      }
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
    }
  }, []);

  // Check in to session
  const checkIn = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/lectures/${sessionId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'QR_CODE' }),
      });

      if (res.ok) {
        const data = await res.json();
        await loadAttendance();
        return { success: true, data };
      } else {
        const data = await res.json();
        return { success: false, error: data.error || 'Check-in failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [loadAttendance]);

  // Get session attendance
  const getSessionAttendance = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch(`/api/lectures/${sessionId}/attendance`);
      if (res.ok) {
        const data = await res.json();
        return { success: true, data: data.items || [] };
      } else {
        return { success: false, error: 'Failed to load attendance' };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Get attendance report
  const getReport = useCallback(async (sessionId: string, format: 'json' | 'csv' = 'json') => {
    try {
      const res = await fetch(`/api/lectures/${sessionId}/attendance-report?format=${format}`);
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      } else {
        return { success: false, error: 'Failed to generate report' };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Get user statistics
  const getStats = useCallback(async () => {
    try {
      const res = await fetch('/api/lectures/stats');
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      } else {
        return { success: false, error: 'Failed to load statistics' };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Check if already checked in
  const isCheckedIn = useCallback((sessionId: string): boolean => {
    return attendance.some(a => a.lectureSessionId === sessionId);
  }, [attendance]);

  // Check if session is active
  const isSessionActive = useCallback((session: LectureSession): boolean => {
    const now = new Date();
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    return now >= start && now <= end;
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAttendance();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadAttendance]);

  return {
    sessions,
    attendance,
    loading,
    error,
    loadSessions,
    loadAttendance,
    checkIn,
    getSessionAttendance,
    getReport,
    getStats,
    isCheckedIn,
    isSessionActive,
  };
}

/**
 * Hook for lecturer attendance monitoring
 */
export function useLecturerAttendance(sessionId?: string) {
  const [sessionAttendance, setSessionAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lectures/${sessionId}/attendance`);
      if (res.ok) {
        const data = await res.json();
        setSessionAttendance(data.items || []);
      } else {
        setError('Failed to load attendance');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!sessionId) return;

    loadAttendance();
    const interval = setInterval(loadAttendance, 10000);
    return () => clearInterval(interval);
  }, [sessionId, loadAttendance]);

  return {
    attendance: sessionAttendance,
    loading,
    error,
    refresh: loadAttendance,
  };
}

/**
 * Hook for admin attendance management
 */
export function useAdminAttendance() {
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const to = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch(`/api/lectures?from=${from}&to=${to}&take=100`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.items || []);
      } else {
        setError('Failed to load sessions');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReport = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lectures/${sessionId}/attendance-report`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        setError('Failed to load report');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadReport = useCallback(async (sessionId: string, format: 'json' | 'csv' = 'csv') => {
    try {
      const res = await fetch(`/api/lectures/${sessionId}/attendance-report?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${sessionId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to download report' };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  return {
    sessions,
    report,
    loading,
    error,
    loadSessions,
    loadReport,
    downloadReport,
  };
}
