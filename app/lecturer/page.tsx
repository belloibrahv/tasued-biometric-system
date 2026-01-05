'use client';

import Link from 'next/link';
import { BookOpen, QrCode, Users, BarChart3 } from 'lucide-react';

export default function LecturerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to BioVault Lecturer Portal</h1>
        <p className="text-gray-600 mt-2">Manage your lecture attendance and generate QR codes for student check-in</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Management */}
        <Link href="/lecturer/attendance" className="group">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <QrCode size={24} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Attendance Management</h2>
            <p className="text-gray-600 text-sm mb-4">
              Display QR codes for your lectures and monitor real-time student check-ins
            </p>
            <span className="text-blue-600 font-medium text-sm group-hover:underline">
              Go to Attendance →
            </span>
          </div>
        </Link>

        {/* Reports (Coming Soon) */}
        <div className="opacity-50 pointer-events-none">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 size={24} className="text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Attendance Reports</h2>
            <p className="text-gray-600 text-sm mb-4">
              View detailed attendance statistics and generate reports
            </p>
            <span className="text-gray-400 font-medium text-sm">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Quick Tips</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Display the QR code on your screen or projector during lectures</li>
          <li>• Students can scan the code using their mobile devices to check in</li>
          <li>• Attendance is recorded in real-time and visible on the dashboard</li>
          <li>• Download the QR code to print or share with students</li>
        </ul>
      </div>
    </div>
  );
}
