'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface RealtimeEvent {
  type: 'verification' | 'attendance' | 'service_access' | 'alert';
  data: any;
  timestamp: string;
}

interface UseRealtimeOptions {
  onEvent?: (event: RealtimeEvent) => void;
  pollInterval?: number;
  enabled?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { onEvent, pollInterval = 10000, enabled = true } = options;
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (lastEventIdRef.current) {
        params.set('after', lastEventIdRef.current);
      }
      
      const res = await fetch(`/api/realtime/events?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.events?.length > 0) {
          setEvents(prev => [...data.events, ...prev].slice(0, 50));
          lastEventIdRef.current = data.events[0].id;
          data.events.forEach((event: RealtimeEvent) => {
            onEvent?.(event);
          });
        }
        setLastUpdate(new Date());
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Realtime fetch error:', error);
      setIsConnected(false);
    }
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    fetchEvents();
    const interval = setInterval(fetchEvents, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, pollInterval, fetchEvents]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    isConnected,
    lastUpdate,
    clearEvents,
    refresh: fetchEvents,
  };
}

// Hook for notification sounds
export function useNotificationSound() {
  const playSound = useCallback((type: 'success' | 'error' | 'notification') => {
    try {
      const soundMap = {
        success: '/sounds/success.mp3',
        error: '/sounds/error.mp3',
        notification: '/sounds/notification.mp3',
      };
      const audio = new Audio(soundMap[type]);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  return { playSound };
}

// Hook for browser notifications
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    }
  }, [permission]);

  return { permission, requestPermission, showNotification };
}
