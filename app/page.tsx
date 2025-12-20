'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Fingerprint, Shield, QrCode, Activity, Download, ShieldCheck,
  ArrowRight, Eye, Lock, BookOpen, GraduationCap, Building2,
  Utensils, Bus, Heart, CreditCard, Users, CheckCircle, Menu, X,
  Play, ChevronRight, Smartphone, Globe, Zap, Award, LogOut
} from 'lucide-react';
import { Toaster } from 'sonner';
import TeamSlider from '@/components/TeamSlider';
import { supabase } from '@/lib/supabase';

// Team members data
const teamMembers = [
  { name: 'Adeyemi Oluwaseun', matricNumber: 'CSC/2020/001', role: 'Team Lead' },
  { name: 'Bakare Temitope', matricNumber: 'CSC/2020/015', role: 'Backend Developer' },
  { name: 'Chukwu Emmanuel', matricNumber: 'CSC/2020/023', role: 'Frontend Developer' },
  { name: 'Damilola Akinwale', matricNumber: 'CSC/2020/031', role: 'Database Admin' },
  { name: 'Eze Chidinma', matricNumber: 'CSC/2020/042', role: 'UI/UX Designer' },
  { name: 'Fashola Kehinde', matricNumber: 'CSC/2020/055', role: 'Security Analyst' },
];

// Biometric SVG Component
const BiometricSVG = () => (
  <svg viewBox="0 0 400 400" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fingerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066CC" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
        <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {/* Outer rings */}
    <circle cx="200" cy="200" r="180" stroke="url(#fingerGrad)" strokeWidth="2" opacity="0.2" className="animate-pulse" />
    <circle cx="200" cy="200" r="150" stroke="url(#fingerGrad)" strokeWidth="2" opacity="0.3" />
    <circle cx="200" cy="200" r="120" stroke="url(#fingerGrad)" strokeWidth="3" opacity="0.4" />
    {/* Fingerprint pattern */}
    <g filter="url(#glow)" className="animate-pulse">
      <path d="M200 80 Q280 120 280 200 Q280 280 200 320" stroke="url(#fingerGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M200 100 Q260 130 260 200 Q260 270 200 300" stroke="url(#fingerGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M200 120 Q240 145 240 200 Q240 255 200 280" stroke="url(#fingerGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M200 140 Q220 155 220 200 Q220 245 200 260" stroke="url(#fingerGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M200 80 Q120 120 120 200 Q120 280 200 320" stroke="url(#fingerGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M200 100 Q140 130 140 200 Q140 270 200 300" stroke="url(#fingerGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M200 120 Q160 145 160 200 Q160 255 200 280" stroke="url(#fingerGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M200 140 Q180 155 180 200 Q180 245 200 260" stroke="url(#fingerGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
    {/* Center dot */}
    <circle cx="200" cy="200" r="8" fill="url(#fingerGrad)" className="animate-ping" />
    <circle cx="200" cy="200" r="5" fill="#0066CC" />
    {/* Scan line */}
    <rect x="120" y="195" width="160" height="10" fill="url(#fingerGrad)" opacity="0.5" rx="5">
      <animate attributeName="y" values="100;300;100" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite" />
    </rect>
  </svg>
);

// QR Code SVG Component
const QRCodeSVG = () => (
  <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" rx="20" fill="white" />
    <g fill="#0066CC">
      {/* QR Pattern */}
      <rect x="20" y="20" width="50" height="50" rx="5" />
      <rect x="130" y="20" width="50" height="50" rx="5" />
      <rect x="20" y="130" width="50" height="50" rx="5" />
      <rect x="30" y="30" width="30" height="30" rx="3" fill="white" />
      <rect x="140" y="30" width="30" height="30" rx="3" fill="white" />
      <rect x="30" y="140" width="30" height="30" rx="3" fill="white" />
      <rect x="40" y="40" width="10" height="10" rx="2" />
      <rect x="150" y="40" width="10" height="10" rx="2" />
      <rect x="40" y="150" width="10" height="10" rx="2" />
      {/* Data pattern */}
      <rect x="80" y="20" width="10" height="10" rx="2" />
      <rect x="100" y="20" width="10" height="10" rx="2" />
      <rect x="80" y="40" width="10" height="10" rx="2" />
      <rect x="100" y="50" width="10" height="10" rx="2" />
      <rect x="80" y="80" width="40" height="40" rx="5" fill="#059669" />
      <rect x="90" y="90" width="20" height="20" rx="3" fill="white" />
      <rect x="95" y="95" width="10" height="10" rx="2" fill="#059669" />
    </g>
  </svg>
);

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    checkAuth();
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    const type = user.user_metadata?.type || 'student';
    if (type === 'admin') return '/admin';
    if (type === 'operator') return '/operator';
    return '/dashboard';
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.reload(); // Refresh to update UI state
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { title: 'Multi-Service Access', description: 'One identity for all university services', icon: Shield, color: 'bg-brand-500' },
    { title: 'Biometric Security', description: 'Military-grade encryption protection', icon: Fingerprint, color: 'bg-success-500' },
    { title: 'QR Code System', description: 'Instant verification anywhere', icon: QrCode, color: 'bg-accent-500' },
    { title: 'Real-time Tracking', description: 'Monitor your access history live', icon: Activity, color: 'bg-purple-500' },
    { title: 'Data Portability', description: 'Export in FIDO2, ISO, or JSON', icon: Download, color: 'bg-pink-500' },
    { title: 'Audit Trail', description: 'Complete transparency & history', icon: ShieldCheck, color: 'bg-cyan-500' },
  ];

  const services = [
    { name: 'Library', icon: BookOpen, color: 'bg-blue-500', desc: 'Book access & borrowing' },
    { name: 'Exams', icon: GraduationCap, color: 'bg-green-500', desc: 'Exam hall verification' },
    { name: 'Hostel', icon: Building2, color: 'bg-purple-500', desc: 'Room & gate access' },
    { name: 'Cafeteria', icon: Utensils, color: 'bg-orange-500', desc: 'Meal payments' },
    { name: 'Transport', icon: Bus, color: 'bg-cyan-500', desc: 'Campus shuttle' },
    { name: 'Health', icon: Heart, color: 'bg-red-500', desc: 'Medical services' },
  ];

  const stats = [
    { label: 'Enrolled Students', value: '10,234', suffix: '+' },
    { label: 'Verifications Today', value: '2,847', suffix: '' },
    { label: 'Active Services', value: '8', suffix: '' },
    { label: 'Avg. Verification', value: '0.8', suffix: 's' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-center" richColors />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img
                src="https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3.png"
                alt="TASUED Logo"
                className="h-12 w-auto"
              />
              <div className="hidden sm:block">
                <span className={`text-xl font-bold ${scrolled ? 'text-surface-900' : 'text-white'}`}>BioVault</span>
                <p className={`text-xs ${scrolled ? 'text-surface-500' : 'text-white/70'}`}>TASUED Identity System</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-sm font-medium hover:text-brand-500 transition ${scrolled ? 'text-surface-600' : 'text-white/90'}`}>Features</a>
              <a href="#services" className={`text-sm font-medium hover:text-brand-500 transition ${scrolled ? 'text-surface-600' : 'text-white/90'}`}>Services</a>
              <a href="#team" className={`text-sm font-medium hover:text-brand-500 transition ${scrolled ? 'text-surface-600' : 'text-white/90'}`}>Team</a>
              <a href="#course" className={`text-sm font-medium hover:text-brand-500 transition ${scrolled ? 'text-surface-600' : 'text-white/90'}`}>Course Info</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {loading ? (
                <div className="w-24 h-10 bg-surface-100 rounded-xl animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <Link href={getDashboardPath()} className="px-6 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold hover:bg-brand-600 shadow-brand transition flex items-center gap-2">
                    <Activity size={18} />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={`p-2.5 rounded-xl border transition-all hover:bg-error-50 hover:text-error-600 hover:border-error-200 ${scrolled ? 'border-surface-200 text-surface-600' : 'border-white/20 text-white hover:bg-white/10'
                      }`}
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${scrolled ? 'text-surface-700 hover:bg-surface-100' : 'text-white hover:bg-white/10'}`}>
                    Sign In
                  </Link>
                  <Link href="/register" className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 shadow-brand transition">
                    Enroll Now
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-xl">
              {isMenuOpen ? <X size={24} className={scrolled ? 'text-surface-900' : 'text-white'} /> : <Menu size={24} className={scrolled ? 'text-surface-900' : 'text-white'} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-white border-t shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-surface-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#services" className="block text-surface-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>Services</a>
              <a href="#team" className="block text-surface-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>Team</a>
              <a href="#course" className="block text-surface-700 font-medium py-2" onClick={() => setIsMenuOpen(false)}>Course Info</a>
              <div className="pt-4 border-t space-y-3">
                {user ? (
                  <div className="space-y-3">
                    <Link href={getDashboardPath()} className="block w-full text-center py-3 bg-brand-500 text-white rounded-xl font-bold">
                      View Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-error-100 text-error-600 rounded-xl font-bold hover:bg-error-50 transition-colors"
                    >
                      <LogOut size={20} /> Logout Account
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/login" className="block w-full text-center py-3 border-2 border-brand-500 text-brand-500 rounded-xl font-semibold">Sign In</Link>
                    <Link href="/register" className="block w-full text-center py-3 bg-brand-500 text-white rounded-xl font-semibold">Enroll Now</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-mesh">
        {/* Cinematic Background Layer */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-950/40 via-surface-950/20 to-surface-50 z-10" />
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full h-full"
          >
            <img
              src="/images/biometric-hero.png"
              alt="TASUED Campus"
              className="w-full h-full object-cover blur-[2px] opacity-90"
            />
          </motion.div>
          {/* Animated Mesh Gradients */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-success-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-success-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
                <span className="text-white/90 text-sm font-medium">CSC 415 Net-Centric Computing Project</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Your Digital
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-success-400">
                  Campus Identity
                </span>
              </h1>

              <p className="text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
                TASUED BioVault is a universal biometric identity platform that serves as your digital passport
                across all university services. One enrollment, unlimited access.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href={user ? getDashboardPath() : "/register"} className="btn-primary flex items-center justify-center gap-2 group">
                  {user ? 'View Dashboard' : 'Start Enrollment'} <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
                </Link>
                <button onClick={() => setShowVideo(true)} className="btn-outline bg-white/5 backdrop-blur-md border-white/20 text-white hover:bg-white/10 flex items-center justify-center gap-2">
                  <Play size={20} /> Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center sm:text-left">
                    <div className="text-3xl font-bold text-white">{stat.value}<span className="text-brand-400">{stat.suffix}</span></div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - Biometric Illustration */}
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:block">
              <div className="relative">
                <div className="w-full max-w-md mx-auto">
                  <BiometricSVG />
                </div>
                {/* Floating Cards */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-10 -left-10 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="text-success-500" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900 text-sm">Verified</p>
                      <p className="text-xs text-surface-500">Identity confirmed</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute bottom-20 -right-10 bg-white rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                      <Shield className="text-brand-500" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900 text-sm">Encrypted</p>
                      <p className="text-xs text-surface-500">AES-256 secured</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setShowVideo(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-4xl aspect-video">
            <button onClick={() => setShowVideo(false)} className="absolute -top-12 right-0 text-white hover:text-brand-400">
              <X size={32} />
            </button>
            <iframe
              src="https://www.youtube.com/embed/MWrSj5ghlPg?autoplay=1"
              className="w-full h-full rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </div>
      )}

      {/* About Section with Campus Image */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
              <div className="relative rounded-[32px] overflow-hidden shadow-2xl border-8 border-white group">
                <img
                  src="https://tasued.edu.ng/web/wp-content/uploads/2020/07/DSC_0395.jpg"
                  alt="TASUED Students"
                  className="w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-white font-bold text-xl mb-1">Empowering the Future</p>
                  <p className="text-white/70 text-sm">Tai Solarin Federal University of Education</p>
                </div>
              </div>
              {/* Floating Badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                className="absolute -bottom-6 -right-6 glass-card p-6 shadow-2xl bg-white/90"
              >
                <Award size={32} className="text-brand-600 mb-2" />
                <p className="font-bold text-2xl text-surface-900 leading-tight">CSC 415</p>
                <p className="text-xs font-bold text-brand-500 uppercase tracking-widest">Capstone Project</p>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-brand-500 font-semibold text-sm uppercase tracking-wider">About BioVault</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mt-2 mb-6">
                Revolutionizing Campus Identity Management
              </h2>
              <p className="text-surface-600 mb-6 leading-relaxed">
                BioVault is a comprehensive biometric identity management system designed specifically for TASUED.
                It provides a secure, efficient, and user-friendly way for students to access all university services
                with a single digital identity.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Smartphone, text: 'Works on all devices - phones, tablets, and computers' },
                  { icon: Globe, text: 'Access from anywhere with internet connection' },
                  { icon: Zap, text: 'Lightning-fast verification in under 1 second' },
                  { icon: Lock, text: 'Bank-grade security for your biometric data' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="text-brand-500" size={20} />
                    </div>
                    <p className="text-surface-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-500 font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mt-2 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              BioVault combines cutting-edge biometric technology with user-friendly design to deliver
              a seamless identity management experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-8 group hover:scale-[1.02] transition-all duration-300"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:rotate-6 transition-transform shadow-lg shadow-${feature.color.split('-')[1]}-500/20`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-surface-900 mb-3 group-hover:text-brand-600 transition-colors uppercase tracking-tight">{feature.title}</h3>
                <p className="text-surface-600 leading-relaxed text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-surface-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-400 font-semibold text-sm uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-4">Simple 3-Step Process</h2>
            <p className="text-surface-400 max-w-2xl mx-auto">Get started with BioVault in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-brand-500 via-success-500 to-accent-500" />

            {[
              { step: '01', title: 'Register', desc: 'Create your account with basic information and matric number', icon: Users, color: 'bg-brand-500' },
              { step: '02', title: 'Enroll Biometrics', desc: 'Capture your fingerprint and facial data securely', icon: Fingerprint, color: 'bg-success-500' },
              { step: '03', title: 'Access Services', desc: 'Use your QR code or biometrics anywhere on campus', icon: QrCode, color: 'bg-accent-500' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="relative text-center"
              >
                <div className={`w-20 h-20 ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 relative z-10`}>
                  <item.icon size={36} />
                </div>
                <span className="text-5xl font-bold text-surface-700/30 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">{item.step}</span>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-surface-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-500 font-semibold text-sm uppercase tracking-wider">Campus Services</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mt-2 mb-4">
              One Identity, Unlimited Access
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              Connect to all university services with your BioVault identity
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-surface-50 rounded-2xl p-6 text-center hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white group-hover:scale-110 transition-transform`}>
                  <service.icon size={28} />
                </div>
                <h3 className="font-bold text-surface-900 mb-1">{service.name}</h3>
                <p className="text-xs text-surface-500">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QR Code Demo Section */}
      <section className="py-20 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-brand-200 font-bold text-xs uppercase tracking-widest mb-4">Secure Identity</span>
              <h2 className="text-3xl sm:text-5xl font-bold mt-2 mb-8 leading-tight">
                Your Identity, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-white">Always in Your Pocket</span>
              </h2>
              <p className="text-white/70 mb-10 text-lg leading-relaxed">
                Generate dynamic QR codes that refresh automatically for maximum security.
                Simply show your QR code at any verification terminal for instant access to university resources.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                {[
                  'Auto-refreshing technology',
                  'Offline-first availability',
                  'Timestamp verification',
                  'Unified access point',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-success-500/20 flex items-center justify-center">
                      <CheckCircle className="text-success-400" size={14} />
                    </div>
                    <span className="text-sm font-medium text-white/90">{item}</span>
                  </div>
                ))}
              </div>
              <Link href={user ? getDashboardPath() : "/register"} className="btn-primary !bg-white !text-brand-700 hover:!bg-brand-50 flex items-center gap-3 w-fit">
                {user ? 'View Your QR Code' : 'Get Started Now'} <ChevronRight size={20} />
              </Link>
            </div>
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-brand-400/20 blur-[100px] rounded-full animate-pulse" />
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative z-10"
              >
                <div className="w-72 h-72 bg-white rounded-[40px] shadow-2xl p-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <QRCodeSVG />
                </div>
                <div className="absolute -bottom-6 -right-6 glass-card px-6 py-3 bg-white/90 backdrop-blur-md shadow-xl border-2 border-brand-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-success-500 rounded-full animate-ping" />
                    <span className="text-brand-900 font-bold uppercase tracking-widest text-[10px]">Active Session</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-500 font-semibold text-sm uppercase tracking-wider">Our Team</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mt-2 mb-4">
              Meet the Developers
            </h2>
            <p className="text-surface-600 max-w-2xl mx-auto">
              CSC 415 Net-Centric Computing students who built this platform
            </p>
          </div>

          <TeamSlider members={teamMembers} />
        </div>
      </section>

      {/* Course Info Section */}
      <section id="course" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-surface-900 to-surface-800 rounded-3xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src="https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3-1.png"
                    alt="TASUED Logo"
                    className="h-16 w-auto bg-white rounded-xl p-2"
                  />
                  <div>
                    <h3 className="text-white font-bold text-xl">TASUED</h3>
                    <p className="text-surface-400 text-sm">Department of Computer Science</p>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6">CSC 415: Net-Centric Computing</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center">
                      <GraduationCap className="text-brand-400" size={24} />
                    </div>
                    <div>
                      <p className="text-surface-400 text-sm">Course Lecturer</p>
                      <p className="text-white font-semibold">Dr. Ogunsanwo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success-500/20 rounded-xl flex items-center justify-center">
                      <BookOpen className="text-success-400" size={24} />
                    </div>
                    <div>
                      <p className="text-surface-400 text-sm">Course Code</p>
                      <p className="text-white font-semibold">CSC 415</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center">
                      <Users className="text-accent-400" size={24} />
                    </div>
                    <div>
                      <p className="text-surface-400 text-sm">Academic Session</p>
                      <p className="text-white font-semibold">2024/2025</p>
                    </div>
                  </div>
                </div>

                <p className="text-surface-400 leading-relaxed">
                  This project demonstrates the practical application of net-centric computing concepts
                  including web development, database management, API design, authentication systems,
                  and responsive user interface design.
                </p>
              </div>

              <div className="relative hidden lg:block">
                <img
                  src="/images/drogansanwo.png"
                  alt="Dr. Ogunsanwo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-surface-900 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-surface-600 mb-8 text-lg">
              Join thousands of TASUED students already using BioVault for seamless campus access.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={user ? getDashboardPath() : "/register"} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 shadow-brand transition">
                {user ? 'Return to Dashboard' : 'Enroll Now'} <ArrowRight size={20} />
              </Link>
              {!user && (
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-surface-300 text-surface-700 rounded-xl font-semibold hover:bg-surface-100 transition">
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3.png"
                  alt="TASUED Logo"
                  className="h-12 w-auto"
                />
                <div>
                  <span className="text-xl font-bold">BioVault</span>
                  <p className="text-sm text-surface-400">TASUED Identity System</p>
                </div>
              </div>
              <p className="text-surface-400 mb-6 max-w-md">
                A universal biometric identity platform for Tai SOLARIN Federal University of Education,
                providing secure and seamless access to all campus services.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-surface-800 rounded-xl flex items-center justify-center hover:bg-brand-500 transition">
                  <Globe size={20} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-3 text-surface-400">
                {user ? (
                  <li><Link href={getDashboardPath()} className="hover:text-white transition font-bold text-brand-400">View Dashboard</Link></li>
                ) : (
                  <>
                    <li><Link href="/login" className="hover:text-white transition">Sign In</Link></li>
                    <li><Link href="/register" className="hover:text-white transition">Enroll</Link></li>
                  </>
                )}
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#services" className="hover:text-white transition">Services</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-3 text-surface-400">
                <li>Tai SOLARIN Federal University of Education</li>
                <li>Ijagun, Ijebu-Ode</li>
                <li>Ogun State, Nigeria</li>
                <li className="text-brand-400">biovault@tasued.edu.ng</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-surface-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-surface-500 text-sm">
              © {new Date().getFullYear()} TASUED BioVault. CSC 415 Net-Centric Computing Project.
            </p>
            <p className="text-surface-500 text-sm">
              Supervised by <span className="text-brand-400">Dr. Ogunsanwo</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
