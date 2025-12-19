'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Menu, X, LogOut, User, Fingerprint, ChevronDown,
  LayoutDashboard, PlusCircle, FileSearch, DownloadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      setUser({ firstName: 'Admin', lastName: 'User', role: 'ADMIN' });
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Collect Data', href: '/collect', icon: PlusCircle },
    { name: 'Records', href: '/records', icon: FileSearch },
    { name: 'Export', href: '/export', icon: DownloadCloud },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    window.location.href = '/login';
  };

  // Don't show header on dashboard pages (they have their own layout)
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-lg border-b border-surface-200 shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-brand-500 p-2.5 rounded-xl text-white shadow-brand">
              <Fingerprint size={24} />
            </div>
            <div>
              <span className="text-xl font-bold text-surface-950 tracking-tight">TASUED</span>
              <span className="ml-1.5 text-sm font-semibold text-brand-500">BioVault</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {isLoggedIn && navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={isActive ? 'nav-link-active' : 'nav-link-inactive'}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-surface-50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                    <User size={16} />
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-surface-900">{user?.firstName}</span>
                    <ChevronDown size={14} className="inline ml-1 text-surface-400" />
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-outline py-2 px-4 text-sm flex items-center gap-2 border-error-200 text-error-600 hover:bg-error-50"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-semibold text-surface-600 hover:text-brand-500 transition-colors px-4 py-2">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary py-2.5 px-6 text-sm">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-xl text-surface-500 hover:bg-surface-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-surface-200 overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {isLoggedIn ? (
                <>
                  <div className="mb-6 p-4 bg-surface-50 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-surface-950">{user?.firstName} {user?.lastName}</div>
                      <div className="text-xs text-brand-500 font-semibold uppercase tracking-wider">{user?.role}</div>
                    </div>
                  </div>
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                          isActive ? 'text-brand-600 bg-brand-50' : 'text-surface-600 hover:bg-surface-100'
                        }`}
                      >
                        <Icon size={20} />
                        {item.name}
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full mt-4 px-4 py-3 rounded-xl text-base font-semibold text-error-600 hover:bg-error-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-surface-600 hover:bg-surface-50"
                  >
                    <User size={20} />
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-4 rounded-xl text-base font-bold text-white bg-brand-gradient text-center shadow-brand"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
