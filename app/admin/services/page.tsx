'use client';

import { useState, useEffect } from 'react';
import { 
  Server, Plus, ToggleLeft, ToggleRight, Edit2, Trash2, 
  Users, MapPin, Clock, Shield, X, Loader2, Save
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  requiresBiometric: boolean;
  allowMultipleEntry: boolean;
  maxCapacity: number | null;
  currentOccupancy: number;
  location: string | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleService = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (res.ok) {
        setServices(services.map(s => s.id === id ? { ...s, isActive: !isActive } : s));
      }
    } catch (error) {
      console.error('Failed to toggle service:', error);
    }
  };

  const saveService = async (service: Partial<Service>) => {
    setSaving(true);
    try {
      const isNew = !service.id;
      const url = isNew ? '/api/admin/services' : `/api/admin/services/${service.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service),
      });

      if (res.ok) {
        fetchServices();
        setEditingService(null);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to save service:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetOccupancy = async (id: string) => {
    try {
      await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentOccupancy: 0 }),
      });
      setServices(services.map(s => s.id === id ? { ...s, currentOccupancy: 0 } : s));
    } catch (error) {
      console.error('Failed to reset occupancy:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="text-gray-500 mt-1">Manage campus services and access points</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      {/* Services list */}
      {services.length > 0 ? (
        <div className="grid gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  service.isActive ? 'bg-blue-50' : 'bg-gray-100'
                }`}>
                  <Server size={28} className={service.isActive ? 'text-blue-600' : 'text-gray-400'} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      service.isActive 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {service.requiresBiometric && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium flex items-center gap-1">
                        <Shield size={10} /> Biometric
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">{service.description || 'No description'}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Users size={14} />
                      <span>
                        {service.currentOccupancy}
                        {service.maxCapacity && ` / ${service.maxCapacity}`} inside
                      </span>
                    </div>
                    {service.location && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin size={14} />
                        <span>{service.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Clock size={14} />
                      <span>{service.allowMultipleEntry ? 'Multiple entry allowed' : 'Single entry only'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {service.currentOccupancy > 0 && (
                    <button
                      onClick={() => resetOccupancy(service.id)}
                      className="px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50 rounded-lg font-medium"
                    >
                      Reset Count
                    </button>
                  )}
                  <button
                    onClick={() => setEditingService(service)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => toggleService(service.id, service.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      service.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {service.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server size={32} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No services</h3>
          <p className="text-sm text-gray-500 mb-4">Create your first service to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Add Service
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {(editingService || showCreateModal) && (
        <ServiceModal
          service={editingService}
          onClose={() => { setEditingService(null); setShowCreateModal(false); }}
          onSave={saveService}
          saving={saving}
        />
      )}
    </div>
  );
}

function ServiceModal({ 
  service, 
  onClose, 
  onSave, 
  saving 
}: { 
  service: Service | null; 
  onClose: () => void; 
  onSave: (service: Partial<Service>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: service?.name || '',
    slug: service?.slug || '',
    description: service?.description || '',
    location: service?.location || '',
    maxCapacity: service?.maxCapacity?.toString() || '',
    requiresBiometric: service?.requiresBiometric || false,
    allowMultipleEntry: service?.allowMultipleEntry ?? true,
    isActive: service?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: service?.id,
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      description: form.description || null,
      location: form.location || null,
      maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : null,
      requiresBiometric: form.requiresBiometric,
      allowMultipleEntry: form.allowMultipleEntry,
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {service ? 'Edit Service' : 'Create Service'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-generated from name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g., Main Building"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
              <input
                type="number"
                value={form.maxCapacity}
                onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requiresBiometric}
                onChange={(e) => setForm({ ...form, requiresBiometric: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require biometric verification</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowMultipleEntry}
                onChange={(e) => setForm({ ...form, allowMultipleEntry: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Allow multiple entries (without exit)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Service is active</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {service ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
