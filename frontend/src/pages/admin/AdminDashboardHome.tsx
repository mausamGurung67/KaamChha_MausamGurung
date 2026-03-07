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
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  CreditCard,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  getPlatformStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getUserGrowthAnalytics,
  type PlatformStats,
} from '../../services/admin.service';
import { DashboardStatsSkeleton, Skeleton } from '../../components/common/Skeleton';
import { useReviewSocket } from '../../hooks/useReviewSocket';
import toast from 'react-hot-toast';

// ── Colors ────────────────────────────────────────────
const CHART_COLORS = ['#f97316', '#3b82f6', '#10b981', '#eab308', '#8b5cf6', '#ef4444'];

// ── Skeleton for the dashboard ────────────────────────
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
    </div>
    <DashboardStatsSkeleton count={4} cols="grid-cols-2 lg:grid-cols-4" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-64 w-full" rounded="xl" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-56 w-full" rounded="xl" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <Skeleton className="h-5 w-36 mb-4" />
        <Skeleton className="h-56 w-full" rounded="xl" />
      </div>
    </div>
  </div>
);

// ── Stat card ─────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; positive: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={`inline-flex items-center text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
              {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend.value}%
            </span>
          )}
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    </div>
  </div>
);

const AdminDashboardHome: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any>(null);
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
    const fetchAll = async () => {
      try {
        const [statsRes, revenueRes, orderRes, userRes] = await Promise.all([
          getPlatformStats(),
          getRevenueAnalytics(),
          getOrderAnalytics(),
          getUserGrowthAnalytics(),
        ]);

        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (revenueRes.success && revenueRes.data) setRevenueData(revenueRes.data);
        if (orderRes.success && orderRes.data) setOrderData(orderRes.data);
        if (userRes.success && userRes.data) setUserGrowth(userRes.data);
      } catch {
        setError('Failed to load platform statistics');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error || 'No data available'}</p>
      </div>
    );
  }

  // Prepare chart data
  const dailyRevenue = revenueData?.dailyRevenue
    ?.slice()
    .reverse()
    .map((d: any) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: d.revenue,
      orders: d.orders,
    })) || [];

  const orderStatusData = orderData?.statusDistribution?.map((d: any) => ({
    name: d.status.charAt(0) + d.status.slice(1).toLowerCase(),
    value: d.count,
  })) || [];

  const dailyUsers = userGrowth?.dailyGrowth
    ?.slice()
    .reverse()
    .map((d: any) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: d.count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 mt-1">Real-time statistics of your platform</p>
      </div>

      {/* ── Top 4 Key Stats ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.users.total.toLocaleString()}
          subtitle={`${stats.users.active} active`}
          icon={<Users size={22} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Total Orders"
          value={stats.orders.total.toLocaleString()}
          subtitle={`${stats.orders.pending} pending`}
          icon={<ShoppingCart size={22} className="text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Total Revenue"
          value={`Rs. ${stats.revenue.total.toLocaleString()}`}
          subtitle="Lifetime earnings"
          icon={<DollarSign size={22} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Platform Earnings"
          value={`Rs. ${stats.revenue.platform.toLocaleString()}`}
          subtitle={`${stats.payments.successRate.toFixed(0)}% payment success`}
          icon={<TrendingUp size={22} className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* ── Revenue Chart (left) + Quick Stats (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue line chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign size={18} className="text-green-500" />
            Revenue Trend
          </h2>
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number | undefined) => [`Rs. ${value?.toLocaleString() || '0'}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Quick stats sidebar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Stats</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-green-500" />
                <span className="text-sm text-gray-600">Customers</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.users.customers}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Wrench size={15} className="text-purple-500" />
                <span className="text-sm text-gray-600">Technicians</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.users.technicians}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-indigo-500" />
                <span className="text-sm text-gray-600">Active Services</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.services.active} / {stats.services.total}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-teal-500" />
                <span className="text-sm text-gray-600">Categories</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.categories.total}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <CheckCircle size={15} className="text-green-500" />
                <span className="text-sm text-gray-600">Completed Orders</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.orders.completed}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-yellow-500" />
                <span className="text-sm text-gray-600">Pending KYC</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.kyc.pending}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-green-500" />
                <span className="text-sm text-gray-600">Approved KYC</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.kyc.approved}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CreditCard size={15} className="text-blue-500" />
                <span className="text-sm text-gray-600">Technician Payouts</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">Rs. {stats.revenue.technician.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── User Growth (left) + Order Distribution (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User growth bar chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            User Registrations
          </h2>
          {dailyUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyUsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No user growth data yet
            </div>
          )}
        </div>

        {/* Order status pie chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart size={18} className="text-orange-500" />
            Order Distribution
          </h2>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {orderStatusData.map((_: any, index: number) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No order data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
