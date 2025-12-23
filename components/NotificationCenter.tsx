'use client';

import { useState } from 'react';
import { Bell, X, CheckCircle, ClipboardList, Building2, AlertCircle } from 'lucide-react';
import { useRealtime, useBrowserNotifications, useNotificationSound } from '@/lib/hooks/useRealtime';
import { formatDistanceToNow } from 'date-fns';

interface NotificationCenterProps {
  enabled?: boolean;
}

export default function NotificationCenter({ enabled = true }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { playSound } = useNotificationSound();
  const { permission, requestPermission, showNotification } = useBrowserNotifications();

  const { events, isConnected, refresh } = useRealtime({
    enabled,
    pollInterval: 15000,
    onEvent: (event) => {
      setUnreadCount(prev => prev + 1);
      playSound('notification');
      
      if (permission === 'granted') {
        const titles: Record<string, string> = {
          verification: 'New Verification',
          attendance: 'Attendance Check-in',
          service_access: 'Service Access',
          alert: 'System Alert',
        };
        showNotification(titles[event.type] || 'New Event', {
          body: getEventDescription(event),
          tag: event.type,
        });
      }
    },
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'verification': return CheckCircle;
      case 'attendance': return ClipboardList;
      case 'service_access': return Building2;
      case 'alert': return AlertCircle;
      default: return Bell;
    }
  };

  const getEventDescription = (event: any) => {
    switch (event.type) {
      case 'verification':
        return `${event.data.student} verified at ${event.data.service}`;
      case 'attendance':
        return `${event.data.student} checked in to ${event.data.course}`;
      case 'service_access':
        return `${event.data.student} ${event.data.action} at ${event.data.service}`;
      default:
        return 'New activity';
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="p-2 rounded-lg hover:bg-gray-100 relative"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500">
                  {isConnected ? 'Live updates active' : 'Connecting...'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {permission !== 'granted' && (
                  <button
                    onClick={requestPermission}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Enable alerts
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Events List */}
            <div className="max-h-96 overflow-y-auto">
              {events.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {events.map((event, idx) => {
                    const Icon = getEventIcon(event.type);
                    return (
                      <div key={idx} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            event.type === 'verification' ? 'bg-green-100' :
                            event.type === 'attendance' ? 'bg-blue-100' :
                            event.type === 'service_access' ? 'bg-purple-100' :
                            'bg-orange-100'
                          }`}>
                            <Icon size={16} className={
                              event.type === 'verification' ? 'text-green-600' :
                              event.type === 'attendance' ? 'text-blue-600' :
                              event.type === 'service_access' ? 'text-purple-600' :
                              'text-orange-600'
                            } />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{getEventDescription(event)}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No recent notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <button
                onClick={refresh}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
              >
                Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
