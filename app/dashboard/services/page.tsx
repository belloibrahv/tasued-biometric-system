'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, GraduationCap, Building2, Utensils, Bus, Heart,
  CreditCard, Users, CheckCircle, XCircle, Settings, Link2,
  Shield, Clock, AlertTriangle, Plus, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const serviceIcons: Record<string, any> = {
  'library': BookOpen,
  'exam-hall': GraduationCap,
  'hostel': Building2,
  'cafeteria': Utensils,
  'transport': Bus,
  'health-center': Heart,
  'student-id': CreditCard,
  'attendance': Users,
};

const serviceColors: Record<string, string> = {
  'library': 'bg-blue-500',
  'exam-hall': 'bg-green-500',
  'hostel': 'bg-purple-500',
  'cafeteria': 'bg-orange-500',
  'transport': 'bg-cyan-500',
  'health-center': 'bg-red-500',
  'student-id': 'bg-indigo-500',
  'attendance': 'bg-pink-500',
};

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/dashboard/services');
      const data = await res.json();
      if (res.ok) {
        setServices(data.services);
      }
    } catch (error) {
      toast.error('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const connectedCount = services.filter(s => s.isConnected).length;
  const totalAccesses = services.reduce((acc, s) => acc + s.accessCount, 0);

  const handleToggleConnection = async (service: any) => {
    try {
      const isConnecting = !service.isConnected;
      const method = isConnecting ? 'POST' : 'DELETE';
      const url = isConnecting ? '/api/dashboard/services' : `/api/dashboard/services?serviceId=${service.id}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: isConnecting ? JSON.stringify({ serviceId: service.id }) : undefined,
      });

      if (res.ok) {
        toast.success(isConnecting ? `Connected to ${service.name}` : `Disconnected from ${service.name}`);
        fetchServices();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update connection');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-brand-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-950">Connected Services</h1>
          <p className="text-surface-500 mt-1">Manage your service connections and permissions</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="badge badge-success">{connectedCount} Connected</span>
          <span className="badge bg-surface-100 text-surface-600">{services.length - connectedCount} Available</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-50 rounded-lg text-success-500">
              <Link2 size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{connectedCount}</p>
              <p className="text-xs text-surface-500">Connected</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg text-brand-500">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{totalAccesses}</p>
              <p className="text-xs text-surface-500">Total Access</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{connectedCount * 2}</p>
              <p className="text-xs text-surface-500">Permissions</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-50 rounded-lg text-accent-500">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">Live</p>
              <p className="text-xs text-surface-500">System Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => {
          const Icon = serviceIcons[service.slug] || Building2;
          const colorClass = serviceColors[service.slug] || 'bg-brand-500';

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`glass-card overflow-hidden ${service.isConnected ? 'ring-2 ring-success-500/20' : ''}`}
            >
              <div className={`${colorClass} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold">{service.name}</h3>
                      <p className="text-xs text-white/70">
                        {service.isConnected ? `${service.accessCount} accesses` : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {service.isConnected && (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-surface-600 mb-4">{service.description}</p>

                {service.isConnected && (
                  <div className="mb-4">
                    <p className="text-xs text-surface-500 mb-2">Permissions granted:</p>
                    <div className="flex flex-wrap gap-1">
                      {(service.permissions || ['Verify Identity']).map((perm: string, i: number) => (
                        <span key={i} className="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {service.isConnected && service.lastAccessedAt && (
                  <p className="text-xs text-surface-400 mb-4 flex items-center gap-1">
                    <Clock size={12} />
                    Last used: {new Date(service.lastAccessedAt).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleConnection(service)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${service.isConnected
                      ? 'bg-error-50 text-error-600 hover:bg-error-100'
                      : 'bg-success-50 text-success-600 hover:bg-success-100'
                      }`}
                  >
                    {service.isConnected ? 'Disconnect' : 'Connect'}
                  </button>
                  {service.isConnected && (
                    <button
                      onClick={() => setSelectedService(service)}
                      className="p-2 bg-surface-100 rounded-lg text-surface-600 hover:bg-surface-200 transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedService(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`${serviceColors[selectedService.slug] || 'bg-brand-500'} p-3 rounded-xl text-white`}>
                {(() => {
                  const Icon = serviceIcons[selectedService.slug] || Building2;
                  return <Icon size={28} />;
                })()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-surface-900">{selectedService.name}</h3>
                <p className="text-sm text-surface-500">Manage service settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-surface-700 mb-2">Permissions</h4>
                {(selectedService.permissions || ['Verify Identity']).map((perm: string, i: number) => (
                  <label key={i} className="flex items-center gap-3 py-2">
                    <input type="checkbox" defaultChecked disabled className="w-4 h-4 rounded text-brand-500 opacity-50" />
                    <span className="text-sm text-surface-600">{perm}</span>
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t border-surface-200">
                <h4 className="text-sm font-semibold text-surface-700 mb-2">Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-surface-900">{selectedService.accessCount}</p>
                    <p className="text-xs text-surface-500">Total accesses</p>
                  </div>
                  <div className="bg-surface-50 p-3 rounded-lg">
                    <p className="text-sm font-bold text-surface-900 truncate">
                      {selectedService.lastAccessedAt ? new Date(selectedService.lastAccessedAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-xs text-surface-500">Last used</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelectedService(null)} className="btn-outline flex-1 py-2">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
