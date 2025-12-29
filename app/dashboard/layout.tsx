'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Fingerprint, LayoutDashboard, QrCode, History,
  LogOut, Menu, X, Bell, User, ClipboardList
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My QR Code', href: '/dashboard/qr-code', icon: QrCode },
  { name: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
  { name: 'Access History', href: '/dashboard/history', icon: History },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
        console.log('Dashboard layout - auth response:', data);
        
        // Handle both success and partial success (sync failed but user data available)
        const userData = data.user;
        if (!userData) {
          console.error('No user data in response');
          return;
        }
        
        // Check if user is admin - redirect to admin dashboard
        if (userData.type === 'admin') {
          router.push('/admin');
          return;
        }

        // Check biometric enrollment status from database (more reliable than session)
        // If not enrolled, redirect to enrollment page
        if (userData.biometricEnrolled === false) {
          console.log('Dashboard: User not enrolled, redirecting to enroll-biometric');
          router.push('/enroll-biometric');
          return;
        }
        
        setUser(userData);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Error</h2>
          <p className="text-gray-500 text-sm mb-6">Unable to load your profile.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-gray-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Fingerprint size={20} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">BioVault</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* User card */}
          <div className="p-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    {(user.lastName?.[0] || '').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {user.firstName && user.firstName !== 'Unknown' 
                      ? `${user.firstName} ${user.lastName || ''}`.trim()
                      : user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.matricNumber || user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
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

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100">
              <Menu size={20} className="text-gray-600" />
            </button>
            
            <div className="flex-1 lg:flex-none" />
            
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell size={20} className="text-gray-600" />
              </button>
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 ml-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-xs">
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    {(user.lastName?.[0] || '').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
          <div className="flex items-center justify-around py-2">
            {navItems.slice(0, 4).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
                </Link>
              );
            })}
            <Link
              href="/dashboard/profile"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                pathname === '/dashboard/profile' 
                  ? 'text-blue-600' 
                  : 'text-gray-500'
              }`}
            >
              <User size={20} />
              <span className="text-xs font-medium">Profile</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}