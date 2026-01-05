import { ReactNode } from 'react';
import Link from 'next/link';
import { BookOpen, LogOut } from 'lucide-react';

export default function LecturerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/lecturer" className="flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" />
            <span className="font-semibold text-gray-900">BioVault Lecturer</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/lecturer/attendance" className="text-gray-600 hover:text-gray-900 font-medium">
              Attendance
            </Link>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
              <LogOut size={20} />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
