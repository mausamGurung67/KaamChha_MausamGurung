import React from 'react';

// ── Base shimmer skeleton ───────────────────────────────
interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const roundedMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = 'lg' }) => (
  <div
    className={`relative overflow-hidden bg-gray-200 ${roundedMap[rounded]} ${className}`}
  >
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

// ── Stat card skeleton ──────────────────────────────────
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-14" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-11 w-11" rounded="xl" />
    </div>
  </div>
);

// ── Table row skeleton ──────────────────────────────────
export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 6 }) => (
  <div className="grid gap-4 px-5 py-4 border-b border-gray-50" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className="flex items-center">
        <Skeleton className={`h-4 ${i === 0 ? 'w-32' : 'w-20'}`} />
      </div>
    ))}
  </div>
);

// ── Booking table skeleton (admin) ──────────────────────
export const BookingTableSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
      {[3, 2, 2, 1, 2, 2].map((span, i) => (
        <div key={i} className={`col-span-${span}`}>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 border-b border-gray-50">
        <div className="col-span-3 flex items-center gap-3">
          <Skeleton className="w-9 h-9 flex-shrink-0" rounded="lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="col-span-2 flex items-center"><Skeleton className="h-4 w-20" /></div>
        <div className="col-span-2 flex items-center"><Skeleton className="h-4 w-20" /></div>
        <div className="col-span-1 flex items-center"><Skeleton className="h-4 w-16" /></div>
        <div className="col-span-2 flex items-center"><Skeleton className="h-5 w-20" rounded="full" /></div>
        <div className="col-span-2 flex items-center"><Skeleton className="h-4 w-16" /></div>
      </div>
    ))}
  </div>
);

// ── Booking card skeleton (technician / customer) ───────
export const BookingCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Skeleton className="w-12 h-12 flex-shrink-0" rounded="lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-3 mt-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right space-y-1.5">
          <Skeleton className="h-5 w-20 ml-auto" rounded="full" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  </div>
);

// ── Service card skeleton (public grid) ─────────────────
export const ServiceCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
    <Skeleton className="h-48 w-full" rounded="sm" />
    <div className="p-4 space-y-2.5">
      <Skeleton className="h-5 w-16" rounded="full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

// ── Dashboard stat cards skeleton ───────────────────────
export const DashboardStatsSkeleton: React.FC<{ count?: number; cols?: string }> = ({
  count = 4,
  cols = 'grid-cols-2 lg:grid-cols-4',
}) => (
  <div className={`grid ${cols} gap-3`}>
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);

// ── User table skeleton (customers/technicians) ─────────
export const UserTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    <div className="hidden md:grid grid-cols-6 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-16" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-4 px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 flex-shrink-0" rounded="full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex items-center"><Skeleton className="h-4 w-24" /></div>
        <div className="flex items-center"><Skeleton className="h-4 w-10" /></div>
        <div className="flex items-center"><Skeleton className="h-4 w-20" /></div>
        <div className="flex items-center"><Skeleton className="h-5 w-16" rounded="full" /></div>
        <div className="flex items-center"><Skeleton className="h-8 w-20" rounded="lg" /></div>
      </div>
    ))}
  </div>
);

// ── Service detail page skeleton ────────────────────────
export const ServiceDetailSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* Breadcrumb */}
    <div className="flex gap-2 mb-6">
      <Skeleton className="h-4 w-12" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-32" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Image */}
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-80 w-full" rounded="2xl" />
        <div className="space-y-3 mt-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      {/* Sidebar */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-full" rounded="lg" />
          <Skeleton className="h-10 w-full" rounded="lg" />
          <Skeleton className="h-12 w-full" rounded="xl" />
        </div>
      </div>
    </div>
  </div>
);

// ── Technician dashboard skeleton ───────────────────────
export const TechDashboardSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
    <div className="space-y-3">
      <Skeleton className="h-6 w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10" rounded="lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-5 w-16 ml-auto" rounded="full" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── KYC table skeleton ──────────────────────────────────
export const KYCTableSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10" rounded="full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <Skeleton className="h-5 w-20" rounded="full" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" rounded="lg" />
      </div>
    ))}
  </div>
);

// ── Tab bar skeleton ────────────────────────────────────
export const TabBarSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex-1 py-2.5 flex items-center justify-center">
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
);

export default Skeleton;
