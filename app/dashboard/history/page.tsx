'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MapPin, Filter } from 'lucide-react';

export default function HistoryPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/dashboard/activity?limit=50');
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'success') return a.status === 'SUCCESS';
    if (filter === 'failed') return a.status === 'FAILED';
    return true;
  });

  const groupByDate = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
      const date = new Date(item.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const grouped = groupByDate(filteredActivities);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Access History</h1>
          <p className="text-gray-500 mt-1">Your verification activity log</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'success', label: 'Successful' },
          { key: 'failed', label: 'Failed' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {items.map((activity, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.status === 'SUCCESS' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {activity.status === 'SUCCESS' ? (
                        <CheckCircle size={20} className="text-green-600" />
                      ) : (
                        <XCircle size={20} className="text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action || 'Verification'}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {activity.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} />
                            {activity.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {new Date(activity.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      activity.status === 'SUCCESS' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {activity.status === 'SUCCESS' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No activity yet</h3>
          <p className="text-sm text-gray-500">
            Your verification history will appear here
          </p>
        </div>
      )}
    </div>
  );
}