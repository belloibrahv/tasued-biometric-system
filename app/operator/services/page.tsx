'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  BookOpen, GraduationCap, Building2, Utensils, Heart, Bus,
  CheckCircle, XCircle, LogIn, LogOut, Users, Clock, RefreshCw,
  Loader2, AlertCircle, Search
} from 'lucide-react';

const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  requiresBiometric: boolean;
  maxCapacity: number | null;
  currentOccupancy: number;
  location: string | null;
}

interface ActiveAccess {
  id: string;
  entryTime: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    matricNumber: string;
  };
}

const iconMap: Record<string, any> = {
  BookOpen, GraduationCap, Building2, Utensils, Heart, Bus,
};

export default function ServiceAccessPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeAccess, setActiveAccess] = useState<ActiveAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'entry' | 'exit'>('entry');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadActiveAccess();
      const interval = setInterval(loadActiveAccess, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedService]);

  const loadServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      if (res.ok) {
        const data = await res.json();
        const activeServices = (data.services || []).filter((s: Service) => s.isActive);
        setServices(activeServices);
        if (activeServices.length > 0 && !selectedService) {
          setSelectedService(activeServices[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveAccess = async () => {
    if (!selectedService) return;
    try {
      const res = await fetch(`/api/services/${selectedService.id}/active`);
      if (res.ok) {
        const data = await res.json();
        setActiveAccess(data.activeAccess || []);
      }
    } catch (error) {
      console.error('Failed to load active access:', error);
    }
  };

  const handleQRScan = useCallback(async (code: string) => {
    if (!selectedService || processing) return;
    
    setProcessing(true);
    setResult(null);

    try {
      const endpoint = mode === 'entry' 
        ? `/api/services/${selectedService.id}/entry`
        : `/api/services/${selectedService.id}/exit`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: code }),
      });

      const data = await res.json();
      setResult(data);
      
      if (data.success) {
        playSound(true);
        loadActiveAccess();
        loadServices(); // Refresh occupancy
      } else {
        playSound(false);
      }
    } catch (error) {
      setResult({ success: false, message: 'Network error' });
      playSound(false);
    } finally {
      setProcessing(false);
    }
  }, [selectedService, mode, processing]);

  const handleManualExit = async (accessId: string) => {
    if (!selectedService) return;
    
    try {
      const res = await fetch(`/api/services/${selectedService.id}/exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessId }),
      });

      if (res.ok) {
        loadActiveAccess();
        loadServices();
      }
    } catch (error) {
      console.error('Failed to process exit:', error);
    }
  };

  const playSound = (success: boolean) => {
    try {
      const audio = new Audio(success ? '/sounds/success.mp3' : '/sounds/error.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  };

  const getIcon = (iconName: string | null) => {
    const Icon = iconName ? iconMap[iconName] : Building2;
    return Icon || Building2;
  };

  const filteredAccess = activeAccess.filter((a) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      a.user.firstName?.toLowerCase().includes(query) ||
      a.user.lastName?.toLowerCase().includes(query) ||
      a.user.matricNumber?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Service Access</h1>
          <p className="text-gray-500 mt-1">Manage entry and exit for campus services</p>
        </div>
        <button
          onClick={() => { loadServices(); loadActiveAccess(); }}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Service Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {services.map((service) => {
          const Icon = getIcon(service.icon);
          const isSelected = selectedService?.id === service.id;
          const occupancyPercent = service.maxCapacity 
            ? Math.round((service.currentOccupancy / service.maxCapacity) * 100)
            : null;

          return (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon size={24} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
              <p className={`font-medium mt-2 text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                {service.name}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Users size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  {service.currentOccupancy}
                  {service.maxCapacity && `/${service.maxCapacity}`}
                </span>
              </div>
              {occupancyPercent !== null && occupancyPercent >= 90 && (
                <span className="text-xs text-red-600 font-medium">Near capacity</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedService && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex">
              <button
                onClick={() => setMode('entry')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                  mode === 'entry'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LogIn size={20} />
                Entry
              </button>
              <button
                onClick={() => setMode('exit')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors ${
                  mode === 'exit'
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LogOut size={20} />
                Exit
              </button>
            </div>

            {/* Scanner */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                {mode === 'entry' ? 'Scan for Entry' : 'Scan for Exit'}
              </h2>
              
              <div className="flex justify-center">
                <QRScanner
                  onScan={handleQRScan}
                  width={280}
                  height={280}
                />
              </div>

              {/* Service Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Occupancy</span>
                  <span className="font-medium text-gray-900">
                    {selectedService.currentOccupancy}
                    {selectedService.maxCapacity && ` / ${selectedService.maxCapacity}`}
                  </span>
                </div>
                {selectedService.maxCapacity && (
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        (selectedService.currentOccupancy / selectedService.maxCapacity) >= 0.9
                          ? 'bg-red-500'
                          : (selectedService.currentOccupancy / selectedService.maxCapacity) >= 0.7
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((selectedService.currentOccupancy / selectedService.maxCapacity) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-xl border-2 p-4 ${
                result.success ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle size={32} className="text-green-600" />
                  ) : (
                    <XCircle size={32} className="text-red-600" />
                  )}
                  <div>
                    <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.success 
                        ? (mode === 'entry' ? 'Entry Recorded' : 'Exit Recorded')
                        : 'Access Denied'}
                    </p>
                    {result.student && (
                      <p className="text-sm text-gray-600">
                        {result.student.firstName} {result.student.lastName}
                      </p>
                    )}
                    {result.message && !result.success && (
                      <p className="text-sm text-red-600">{result.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Access List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Currently Inside ({activeAccess.length})
              </h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
              {filteredAccess.length > 0 ? (
                filteredAccess.map((access) => (
                  <div key={access.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {access.user.firstName?.[0]}{access.user.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {access.user.firstName} {access.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{access.user.matricNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(access.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <button
                        onClick={() => handleManualExit(access.id)}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1"
                      >
                        Mark Exit
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-12 text-center">
                  <Users size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'No matching users' : 'No one currently inside'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {services.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-medium text-gray-900 mb-1">No Active Services</h3>
          <p className="text-sm text-gray-500">
            Contact an administrator to enable services
          </p>
        </div>
      )}
    </div>
  );
}
