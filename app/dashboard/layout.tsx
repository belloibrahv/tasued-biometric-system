'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fingerprint, LayoutDashboard, QrCode, History, Link2, Download,
  Settings, Shield, HelpCircle, LogOut, Menu, X, Bell, User, Search, RefreshCw
} from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My QR Code', href: '/dashboard/qr-code', icon: QrCode },
  { name: 'Access History', href: '/dashboard/history', icon: History },
  { name: 'Connected Services', href: '/dashboard/services', icon: Link2 },
  { name: 'Export Data', href: '/dashboard/export', icon: Download },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Privacy Center', href: '/dashboard/privacy', icon: Shield },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          console.error('Auth check failed:', data);
          setLoading(false);
          return;
        }

        // Ensure user is a student
        if (data.user && data.user.type !== 'student') {
          router.push('/admin');
          return;
        }

        setUser(data.user);
        setNotifications(data.user.unreadNotificationsCount || 0);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-surface-600 text-sm">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 p-4">
        <div className="max-w-md w-full glass-card p-8 text-center bg-white shadow-xl rounded-[32px] border border-surface-200">
          <div className="w-20 h-20 bg-error-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="text-error-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 mb-2">Sync Error</h2>
          <p className="text-surface-600 mb-6">
            We couldn't synchronize your secure profile. This might be due to a connection issue or a temporary system update.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 shadow-brand-lg"
            >
              <RefreshCw size={18} /> Retry Connection
            </button>
            <button
              onClick={handleLogout}
              className="btn-outline w-full py-3"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-surface-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-surface-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-brand-500 p-2 rounded-xl text-white">
                <Fingerprint size={24} />
              </div>
              <div>
                <span className="text-lg font-bold text-surface-950">TASUED</span>
                <span className="ml-1 text-sm text-brand-500">BioVault</span>
              </div>
            </Link>
          </div>

          {/* User Profile Card */}
          <div className="p-4">
            <div className="bg-brand-gradient rounded-xl p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div>
                  <p className="font-bold">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-white/70 font-mono">{user.matricNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {user.biometricEnrolled && (
                  <span className="bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <Shield size={12} /> Verified
                  </span>
                )}
                <span className="bg-white/20 px-2 py-1 rounded-full">{user.level} Level</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 overflow-y-auto scrollbar-thin">
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}
                  >
                    <item.icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-surface-100 space-y-2">
            <Link href="/support" className="sidebar-item-inactive">
              <HelpCircle size={20} />
              <span>Help & Support</span>
            </Link>
            <button onClick={handleLogout} className="sidebar-item-inactive w-full text-error-600 hover:bg-error-50 hover:text-error-700">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-surface-200">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-surface-600 hover:bg-surface-100"
            >
              <Menu size={24} />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-surface-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Link href="/dashboard/notifications" className="relative p-2 rounded-xl text-surface-600 hover:bg-surface-100 transition-colors">
                <Bell size={20} />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error-500 rounded-full text-white text-xs flex items-center justify-center">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              <div className="hidden md:flex items-center gap-3 pl-3 border-l border-surface-200">
                <div className="text-right">
                  <p className="text-sm font-semibold text-surface-900">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-surface-500">{user.department}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                  <User size={20} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-200 lg:hidden safe-area-inset z-40">
          <div className="flex justify-around items-center py-2">
            {[
              { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
              { name: 'QR Code', href: '/dashboard/qr-code', icon: QrCode },
              { name: 'History', href: '/dashboard/history', icon: History },
              { name: 'Services', href: '/dashboard/services', icon: Link2 },
              { name: 'Settings', href: '/dashboard/settings', icon: Settings },
            ].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${isActive ? 'text-brand-500 bg-brand-50' : 'text-surface-500'
                    }`}
                >
                  <item.icon size={20} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
