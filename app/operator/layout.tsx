'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Fingerprint, LayoutDashboard, QrCode, Users, ScanLine,
  Settings, LogOut, Menu, X, Bell, Shield
} from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', href: '/operator', icon: LayoutDashboard },
  { name: 'Verify Student', href: '/operator/verify', icon: ScanLine },
  { name: 'Bulk Verification', href: '/operator/bulk', icon: Users },
  { name: 'QR Scanner', href: '/operator/scanner', icon: QrCode },
  { name: 'Settings', href: '/operator/settings', icon: Settings },
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
        const data = await res.json();
        
        if (!res.ok || data.user?.type !== 'admin') {
          router.push('/login?redirect=/operator');
          return;
        }
        
        setUser(data.user);
      } catch (error) {
        router.push('/login?redirect=/operator');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface-900 text-white transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-surface-700">
            <Link href="/operator" className="flex items-center gap-3">
              <div className="bg-success-500 p-2 rounded-xl">
                <Fingerprint size={24} />
              </div>
              <div>
                <span className="text-lg font-bold">BioVault</span>
                <span className="ml-1 text-xs text-success-400">Operator</span>
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success-500/20 flex items-center justify-center">
                <Shield size={20} className="text-success-400" />
              </div>
              <div>
                <p className="font-medium text-sm">{user.fullName}</p>
                <p className="text-xs text-surface-400">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-success-500 text-white'
                      : 'text-surface-300 hover:bg-surface-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-surface-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-surface-300 hover:bg-error-500/20 hover:text-error-400 w-full transition-all"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-surface-200">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-surface-600 hover:bg-surface-100"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl text-surface-600 hover:bg-surface-100">
                <Bell size={20} />
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-surface-900">{user.fullName}</p>
                <p className="text-xs text-surface-500">Operator Portal</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
