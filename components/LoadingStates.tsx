'use client';

import { motion } from 'framer-motion';
import { Loader2, Fingerprint } from 'lucide-react';

/**
 * Professional Loading Components for TASUED BioVault
 */

// Full Page Loading
export function FullPageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-surface-50 z-50 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-brand-200 border-t-brand-500 rounded-full mx-auto mb-4"
        />
        <p className="text-surface-700 font-medium">{message}</p>
      </div>
    </div>
  );
}

// Biometric Loading (for biometric operations)
export function BiometricLoading({ message = 'Processing biometric data...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card-dark p-8 text-center max-w-md mx-4"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-20 h-20 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-brand-500/50"
        >
          <Fingerprint className="text-brand-400" size={40} />
        </motion.div>
        <p className="text-white font-semibold mb-2">{message}</p>
        <p className="text-surface-400 text-sm">Please wait while we securely process your data</p>
      </motion.div>
    </div>
  );
}

// Card Skeleton Loader
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-6 animate-pulse">
          <div className="h-4 bg-surface-200 rounded w-1/2 mb-3" />
          <div className="h-6 bg-surface-200 rounded w-3/4 mb-4" />
          <div className="h-3 bg-surface-200 rounded w-full mb-2" />
          <div className="h-3 bg-surface-200 rounded w-5/6" />
        </div>
      ))}
    </>
  );
}

// Table Skeleton Loader
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead className="bg-surface-100">
          <tr>
            {[1, 2, 3, 4].map((i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 bg-surface-200 rounded w-full animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-surface-200">
              {[1, 2, 3, 4].map((j) => (
                <td key={j} className="px-6 py-4">
                  <div className="h-4 bg-surface-100 rounded w-full animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Inline Loading Spinner
export function InlineLoading({ size = 20, className = '' }: { size?: number; className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} size={size} />;
}

// Button Loading State
export function ButtonLoading({ children, loading, ...props }: any) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={18} />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Progress Bar
export function ProgressBar({ progress, label }: { progress: number; label?: string }) {
  return (
    <div className="w-full">
      {label && <p className="text-sm text-surface-600 mb-2">{label}</p>}
      <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-brand-500 to-brand-600"
        />
      </div>
      <p className="text-xs text-surface-500 mt-1 text-right">{Math.round(progress)}%</p>
    </div>
  );
}

// Shimmer Effect
export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-surface-100 ${className}`}>
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
      />
    </div>
  );
}
