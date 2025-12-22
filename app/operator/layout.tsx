'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Fingerprint, LayoutDashboard, QrCode, Users, Eye,
  LogOut, Menu, X, Bell
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/operator', icon: LayoutDashboard },
  { name: 'Verify', href: '/operator/verify', icon: Eye },
  { name: 'Scanner', href: '/operator/scanner', icon: QrCode },
  { name: 'Bulk Verify', href: '/operator/bulk', icon: Users },
];

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user?.type === 'student') {
          router.push('/dashboard');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.clear();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-4 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                <Fingerprint size={20} className="text-white" />
              </div>
              <div>
                <span className="font-semibold text-gray-900">BioVault</span>
                <span className="text-xs text-gray-500 block">Operator</span>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-4">
            <div className="bg-green-50 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-green-600 font-medium">Operator</p>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    isActive ? 'bg-green-50 text-green-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-gray-100">
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium text-sm">Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100">
              <Menu size={20} className="text-gray-600" />
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Online</span>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <Bell size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}