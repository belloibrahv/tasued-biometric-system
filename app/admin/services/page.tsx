'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Server, Plus, Edit2, Trash2, CheckCircle, XCircle,
  Loader2, Settings, Activity
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
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

  const toggleService = async (serviceId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        toast.success(isActive ? 'Service disabled' : 'Service enabled');
        fetchServices();
      }
    } catch (error) {
      toast.error('Failed to update service');
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-surface-400 mt-1">Manage campus services</p>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-brand-500" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface-800 rounded-2xl p-6 border border-surface-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-brand-500/20 rounded-xl text-brand-400">
                  <Server size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  service.isActive 
                    ? 'bg-success-500/20 text-success-400' 
                    : 'bg-error-500/20 text-error-400'
                }`}>
                  {service.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
              <p className="text-sm text-surface-400 mb-4">{service.description}</p>

              <div className="flex items-center gap-4 text-sm text-surface-400 mb-4">
                <span className="flex items-center gap-1">
                  <Activity size={14} />
                  {service.connectionCount || 0} connections
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleService(service.id, service.isActive)}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                    service.isActive
                      ? 'bg-error-500/20 text-error-400 hover:bg-error-500/30'
                      : 'bg-success-500/20 text-success-400 hover:bg-success-500/30'
                  }`}
                >
                  {service.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className="p-2 rounded-xl bg-surface-700 text-surface-300 hover:bg-surface-600">
                  <Settings size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
