'use client';

import { useState, useEffect } from 'react';
import { Server, Plus, ToggleLeft, ToggleRight, Edit2, Trash2 } from 'lucide-react';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchServices();
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
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
          <p className="text-gray-500 mt-1">Manage campus services</p>
        </div>
      </div>

      {/* Services list */}
      {services.length > 0 ? (
        <div className="grid gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  service.isActive ? 'bg-blue-50' : 'bg-gray-100'
                }`}>
                  <Server size={24} className={service.isActive ? 'text-blue-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      service.isActive
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{service.description || 'No description'}</p>
                </div>
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
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server size={32} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No services</h3>
          <p className="text-sm text-gray-500">Services will appear here</p>
        </div>
      )}
    </div>
  );
}
