import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true
}: SkeletonProps) {
  const baseClass = 'bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 bg-[length:200%_100%]';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <motion.div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={style}
      animate={animate ? {
        backgroundPosition: ['200% 0', '-200% 0'],
      } : undefined}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <Skeleton width="100%" height={120} variant="rounded" />
      <div className="flex gap-2">
        <Skeleton width="30%" height={36} variant="rounded" />
        <Skeleton width="30%" height={36} variant="rounded" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b border-surface-200">
      <td className="px-4 py-3"><Skeleton width="80%" height={16} /></td>
      <td className="px-4 py-3"><Skeleton width="60%" height={16} /></td>
      <td className="px-4 py-3"><Skeleton width="70%" height={16} /></td>
      <td className="px-4 py-3"><Skeleton width="50%" height={16} /></td>
      <td className="px-4 py-3"><Skeleton width="40%" height={32} variant="rounded" /></td>
    </tr>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton width={60} height={24} variant="rounded" />
      </div>
      <Skeleton width="40%" height={32} className="mb-2" />
      <Skeleton width="60%" height={16} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Table */}
      <div className="glass-card p-6">
        <Skeleton width="30%" height={24} className="mb-4" />
        <table className="w-full">
          <tbody>
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
          </tbody>
        </table>
      </div>
    </div>
  );
}
