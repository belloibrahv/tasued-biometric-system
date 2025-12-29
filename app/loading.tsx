'use client';

import { Fingerprint } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Fingerprint size={32} className="text-white" />
          </div>
          <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-brand-200 border-t-brand-500 rounded-2xl animate-spin"></div>
        </div>
        <p className="text-surface-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
