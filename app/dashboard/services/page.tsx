'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, GraduationCap, Building2, Utensils, Bus, Heart,
  CreditCard, Users, CheckCircle, XCircle, Settings, Link2,
  Shield, Clock, AlertTriangle, Plus
} from 'lucide-react';
import { toast } from 'sonner';

const allServices = [
  {
    id: 1,
    name: 'Library',
    description: 'Access library resources, borrow books, and use study spaces',
    icon: BookOpen,
    color: 'bg-blue-500',
    connected: true,
    lastUsed: '10 mins ago',
    accessCount: 45,
    permissions: ['Check-in/out', 'Book borrowing', 'Study room booking'],
  },
  {
    id: 2,
    name: 'Exam Hall',
    description: 'Verification for examinations and assessments',
    icon: GraduationCap,
    color: 'bg-green-500',
    connected: true,
    lastUsed: '1 day ago',
    accessCount: 12,
    permissions: ['Exam verification', 'Seat assignment'],
  },
  {
    id: 3,
    name: 'Hostel',
    description: 'Access to hostel facilities and room entry',
    icon: Building2,
    color: 'bg-purple-500',
    connected: true,
    lastUsed: '2 hours ago',
    accessCount: 89,
    permissions: ['Room access', 'Visitor registration'],
  },
  {
    id: 4,
    name: 'Cafeteria',
    description: 'Meal payments and cafeteria access',
    icon: Utensils,
    color: 'bg-orange-500',
    connected: true,
    lastUsed: '3 hours ago',
    accessCount: 156,
    permissions: ['Meal payment', 'Balance check'],
  },
  {
    id: 5,
    name: 'Transport',
    description: 'Campus shuttle and transport services',
    icon: Bus,
    color: 'bg-cyan-500',
    connected: false,
    lastUsed: null,
    accessCount: 0,
    permissions: ['Shuttle booking', 'Route access'],
  },
  {
    id: 6,
    name: 'Health Center',
    description: 'Medical services and health records',
    icon: Heart,
    color: 'bg-red-500',
    connected: true,
    lastUsed: '1 week ago',
    accessCount: 3,
    permissions: ['Medical records', 'Appointment booking'],
  },
  {
    id: 7,
    name: 'Student ID',
    description: 'Digital student identification services',
    icon: CreditCard,
    color: 'bg-indigo-500',
    connected: true,
    lastUsed: 'Always active',
    accessCount: 0,
    permissions: ['ID verification', 'Document access'],
  },
  {
    id: 8,
    name: 'Attendance',
    description: 'Lecture and class attendance tracking',
    icon: Users,
    color: 'bg-pink-500',
    connected: false,
    lastUsed: null,
    accessCount: 0,
    permissions: ['Class check-in', 'Attendance reports'],
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState(allServices);
  const [selectedService, setSelectedService] = useState<typeof allServices[0] | null>(null);

  const connectedCount = services.filter(s => s.connected).length;

  const handleToggleConnection = (serviceId: number) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        const newConnected = !s.connected;
        toast.success(newConnected ? `Connected to ${s.name}` : `Disconnected from ${s.name}`);
        return { ...s, connected: newConnected };
      }
      return s;
    }));
  };

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
              <p className="text-2xl font-bold text-surface-900">305</p>
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
              <p className="text-2xl font-bold text-surface-900">12</p>
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
              <p className="text-2xl font-bold text-surface-900">10m</p>
              <p className="text-xs text-surface-500">Last Activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`glass-card overflow-hidden ${service.connected ? 'ring-2 ring-success-500/20' : ''}`}
          >
            {/* Service Header */}
            <div className={`${service.color} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <service.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">{service.name}</h3>
                    <p className="text-xs text-white/70">
                      {service.connected ? `${service.accessCount} accesses` : 'Not connected'}
                    </p>
                  </div>
                </div>
                {service.connected && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Service Body */}
            <div className="p-4">
              <p className="text-sm text-surface-600 mb-4">{service.description}</p>

              {service.connected && (
                <div className="mb-4">
                  <p className="text-xs text-surface-500 mb-2">Permissions granted:</p>
                  <div className="flex flex-wrap gap-1">
                    {service.permissions.map((perm, i) => (
                      <span key={i} className="text-xs bg-surface-100 text-surface-600 px-2 py-1 rounded">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {service.connected && service.lastUsed && (
                <p className="text-xs text-surface-400 mb-4 flex items-center gap-1">
                  <Clock size={12} />
                  Last used: {service.lastUsed}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleConnection(service.id)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                    service.connected
                      ? 'bg-error-50 text-error-600 hover:bg-error-100'
                      : 'bg-success-50 text-success-600 hover:bg-success-100'
                  }`}
                >
                  {service.connected ? 'Disconnect' : 'Connect'}
                </button>
                {service.connected && (
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
        ))}
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
              <div className={`${selectedService.color} p-3 rounded-xl text-white`}>
                <selectedService.icon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-surface-900">{selectedService.name}</h3>
                <p className="text-sm text-surface-500">Manage service settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-surface-700 mb-2">Permissions</h4>
                {selectedService.permissions.map((perm, i) => (
                  <label key={i} className="flex items-center gap-3 py-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-brand-500" />
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
                    <p className="text-2xl font-bold text-surface-900">{selectedService.lastUsed || 'N/A'}</p>
                    <p className="text-xs text-surface-500">Last used</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setSelectedService(null)} className="btn-outline flex-1 py-2">
                Close
              </button>
              <button className="btn-primary flex-1 py-2">
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
