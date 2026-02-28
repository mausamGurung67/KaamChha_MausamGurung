import React, { useEffect, useState } from 'react';
import {
  Users,
  Wrench,
  ShoppingCart,
  DollarSign,
  ShieldCheck,
  Clock,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { getPlatformStats, type PlatformStats } from '../../services/admin.service';
import { DashboardStatsSkeleton } from '../../components/common/Skeleton';
import { useReviewSocket } from '../../hooks/useReviewSocket';
import toast from 'react-hot-toast';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    </div>
  </div>
);

const AdminDashboardHome: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real-time review updates
  useReviewSocket({
    onNewReview: (payload) => {
      toast(
        `New ${payload.review.rating}-star review for ${payload.review.service.name} by ${payload.review.customer.profile?.name || 'Customer'}`,
        { icon: '⭐', duration: 6000 }
      );
    },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getPlatformStats();
        if (res.success && res.data) setStats(res.data);
        else setError('Failed to load stats');
      } catch {
        setError('Failed to load platform statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse mt-2" />
        </div>
        <DashboardStatsSkeleton count={4} />
        <DashboardStatsSkeleton count={3} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
        <DashboardStatsSkeleton count={3} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
        <DashboardStatsSkeleton count={4} />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error || 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 mt-1">Real-time statistics of your platform</p>
      </div>

      {/* Users */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            subtitle={`${stats.users.active} active`}
            icon={<Users size={22} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="Customers"
            value={stats.users.customers}
            icon={<Users size={22} className="text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            title="Technicians"
            value={stats.users.technicians}
            icon={<Wrench size={22} className="text-purple-600" />}
            color="bg-purple-50"
          />
          <StatCard
            title="Admins"
            value={stats.users.admins}
            icon={<ShieldCheck size={22} className="text-orange-600" />}
            color="bg-orange-50"
          />
        </div>
      </section>

      {/* Orders */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Orders</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            title="Total Orders"
            value={stats.orders.total}
            icon={<ShoppingCart size={22} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="Pending"
            value={stats.orders.pending}
            icon={<Clock size={22} className="text-yellow-600" />}
            color="bg-yellow-50"
          />
          <StatCard
            title="Completed"
            value={stats.orders.completed}
            icon={<CheckCircle size={22} className="text-green-600" />}
            color="bg-green-50"
          />
        </div>
      </section>

      {/* Revenue */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            title="Total Revenue"
            value={`Rs. ${stats.revenue.total.toLocaleString()}`}
            icon={<DollarSign size={22} className="text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            title="Platform Earnings"
            value={`Rs. ${stats.revenue.platform.toLocaleString()}`}
            icon={<DollarSign size={22} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="Technician Payouts"
            value={`Rs. ${stats.revenue.technician.toLocaleString()}`}
            icon={<DollarSign size={22} className="text-purple-600" />}
            color="bg-purple-50"
          />
        </div>
      </section>

      {/* Services & KYC */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Services & KYC</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Services"
            value={stats.services.total}
            subtitle={`${stats.services.active} active`}
            icon={<Layers size={22} className="text-indigo-600" />}
            color="bg-indigo-50"
          />
          <StatCard
            title="Categories"
            value={stats.categories.total}
            icon={<Layers size={22} className="text-teal-600" />}
            color="bg-teal-50"
          />
          <StatCard
            title="Pending KYC"
            value={stats.kyc.pending}
            icon={<Clock size={22} className="text-yellow-600" />}
            color="bg-yellow-50"
          />
          <StatCard
            title="Approved KYC"
            value={stats.kyc.approved}
            icon={<ShieldCheck size={22} className="text-green-600" />}
            color="bg-green-50"
          />
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardHome;
