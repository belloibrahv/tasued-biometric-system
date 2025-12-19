"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function AttendanceAdminPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    course: '',
    department: '',
    level: '',
    from: '',
    to: '',
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (filters.course) qs.set('course', filters.course);
      if (filters.department) qs.set('department', filters.department);
      if (filters.level) qs.set('level', filters.level);
      if (filters.from) qs.set('from', filters.from);
      if (filters.to) qs.set('to', filters.to);
      const res = await fetch(`/api/lectures?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load sessions');
      setSessions(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Lecture Attendance Sessions</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <input className="border rounded p-2" placeholder="Course Code" value={filters.course} onChange={e => setFilters({ ...filters, course: e.target.value })} />
        <input className="border rounded p-2" placeholder="Department" value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })} />
        <input className="border rounded p-2" placeholder="Level" value={filters.level} onChange={e => setFilters({ ...filters, level: e.target.value })} />
        <input className="border rounded p-2" type="datetime-local" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
        <input className="border rounded p-2" type="datetime-local" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
      </div>

      <div className="flex gap-2">
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={load}>Apply Filters</button>
        <CreateSession onCreated={load} />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2 border">Course</th>
              <th className="p-2 border">Lecturer</th>
              <th className="p-2 border">Venue</th>
              <th className="p-2 border">Start</th>
              <th className="p-2 border">End</th>
              <th className="p-2 border">Department</th>
              <th className="p-2 border">Level</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="p-2 border">{s.courseCode} - {s.courseName}</td>
                <td className="p-2 border">{s.lecturer || '-'}</td>
                <td className="p-2 border">{s.venue}</td>
                <td className="p-2 border">{format(new Date(s.startTime), 'PPpp')}</td>
                <td className="p-2 border">{format(new Date(s.endTime), 'PPpp')}</td>
                <td className="p-2 border">{s.department}</td>
                <td className="p-2 border">{s.level}</td>
                <td className="p-2 border">
                  <AttendanceDrawer sessionId={s.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-600">Total: {total}</p>
    </div>
  );
}

function CreateSession({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    courseCode: '',
    courseName: '',
    lecturer: '',
    venue: '',
    startTime: '',
    endTime: '',
    department: '',
    level: '',
  });

  async function submit() {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/lectures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create session');
      setOpen(false);
      setForm({ courseCode: '', courseName: '', lecturer: '', venue: '', startTime: '', endTime: '', department: '', level: '' });
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally { setSaving(false); }
  }

  return (
    <div>
      <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>New Session</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow p-4 w-full max-w-2xl space-y-2">
            <h2 className="text-lg font-semibold">Create Lecture Session</h2>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded p-2" placeholder="Course Code" value={form.courseCode} onChange={e => setForm({ ...form, courseCode: e.target.value })} />
              <input className="border rounded p-2" placeholder="Course Name" value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} />
              <input className="border rounded p-2" placeholder="Lecturer" value={form.lecturer} onChange={e => setForm({ ...form, lecturer: e.target.value })} />
              <input className="border rounded p-2" placeholder="Venue" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} />
              <input className="border rounded p-2" type="datetime-local" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
              <input className="border rounded p-2" type="datetime-local" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
              <input className="border rounded p-2" placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
              <input className="border rounded p-2" placeholder="Level" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2" onClick={() => setOpen(false)}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={submit} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceDrawer({ sessionId }: { sessionId: string }) {
  const [operatorUserId, setOperatorUserId] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/lectures/${sessionId}/attendance`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch attendance');
      setItems(data.items || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  // Auto-refresh every 10s when open
  useEffect(() => {
    let t: any;
    if (open) {
      load();
      t = setInterval(load, 10000);
    }
    return () => { if (t) clearInterval(t); };
  }, [open, sessionId]);

  async function checkInSelf(method: 'QR_CODE'|'FINGERPRINT'|'FACIAL'|'IRIS'|'MANUAL') {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/lectures/${sessionId}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ method }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in failed');
      await load();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function checkInUser() {
    if (!operatorUserId.trim()) return setError('Enter a userId');
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/lectures/${sessionId}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: operatorUserId, method: 'QR_CODE' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operator check-in failed');
      setOperatorUserId('');
      await load();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function checkOutUser() {
    if (!operatorUserId.trim()) return setError('Enter a userId');
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/lectures/${sessionId}/check-out`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: operatorUserId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operator check-out failed');
      setOperatorUserId('');
      await load();
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  return (
    <div>
      <button className="text-blue-600 underline" onClick={() => setOpen(true)}>View Attendance</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow p-4 w-full max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Attendance</h3>
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {loading && <p>Loading...</p>}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Self check-in shortcuts for testing */}
              <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => checkInSelf('QR_CODE')}>Self Check-in (QR)</button>
              <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={() => checkInSelf('FACIAL')}>Self Check-in (Face)</button>
            </div>
            {/* Operator quick actions */}
            <div className="flex flex-wrap gap-2 items-center">
              <input className="border rounded p-2 flex-1 min-w-[220px]" placeholder="Enter student userId" value={operatorUserId} onChange={e => setOperatorUserId(e.target.value)} />
              <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={checkInUser} disabled={loading}>Operator Check-in</button>
              <button className="bg-gray-700 text-white px-3 py-1 rounded" onClick={checkOutUser} disabled={loading}>Operator Check-out</button>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 border">Student</th>
                    <th className="p-2 border">Email</th>
                    <th className="p-2 border">Method</th>
                    <th className="p-2 border">Check-in</th>
                    <th className="p-2 border">Check-out</th>
                    <th className="p-2 border">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.id}>
                      <td className="p-2 border">{a.user?.lastName} {a.user?.firstName}</td>
                      <td className="p-2 border">{a.user?.email}</td>
                      <td className="p-2 border">{a.method}</td>
                      <td className="p-2 border">{a.checkInTime ? format(new Date(a.checkInTime), 'PPpp') : '-'}</td>
                      <td className="p-2 border">{a.checkOutTime ? format(new Date(a.checkOutTime), 'PPpp') : '-'}</td>
                      <td className="p-2 border">{typeof a.matchScore === 'number' ? a.matchScore.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
