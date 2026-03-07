import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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

const CHART_COLORS = ['#f97316', '#3b82f6', '#10b981', '#eab308', '#8b5cf6', '#ef4444'];

// Skeleton loader
const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-72 mt-2" />
    </div>
    <DashboardStatsSkeleton count={4} cols="grid-cols-2 lg:grid-cols-4" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-72 w-full" rounded="xl" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-72 w-full" rounded="xl" />
      </div>
    </div>
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <Skeleton className="h-5 w-48 mb-4" />
      <Skeleton className="h-72 w-full" rounded="xl" />
    </div>
  </div>
);

// Stat card
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
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={`inline-flex items-center text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
              {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend.value}%
            </span>
          )}
          {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className={`p-3 rounded-xl flex-shrink-0 ${color}`}>{icon}</div>
    </div>
  </div>
);

const PlatformAnalytics: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <AnalyticsSkeleton />;

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
      platformEarnings: Math.round(d.revenue * 0.2), // platform commission estimate
      orders: d.orders,
    })) || [];

  const orderStatusData = orderData?.statusDistribution?.map((d: any) => ({
    name: d.status.charAt(0) + d.status.slice(1).toLowerCase().replace(/_/g, ' '),
    value: d.count,
  })) || [];

  const categoryData = orderData?.categoryDistribution?.map((d: any) => ({
    name: d.category,
    orders: d.count,
    revenue: d.revenue || 0,
  })) || [];

  const dailyUsers = userGrowth?.dailyGrowth
    ?.slice()
    .reverse()
    .map((d: any) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: d.count,
    })) || [];

  const completionRate = stats.orders.total > 0
    ? ((stats.orders.completed / stats.orders.total) * 100).toFixed(1)
    : '0';

  const avgOrderValue = revenueData?.summary?.averageOrderValue
    ? Math.round(revenueData.summary.averageOrderValue)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-500 mt-1">Revenue, bookings, and growth insights</p>
      </div>

      {/* ── Top Stats Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Platform Earnings"
          value={`Rs. ${stats.revenue.platform.toLocaleString()}`}
          subtitle="Total commission earned"
          icon={<DollarSign size={22} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Total Revenue"
          value={`Rs. ${stats.revenue.total.toLocaleString()}`}
          subtitle={`Avg order: Rs. ${avgOrderValue.toLocaleString()}`}
          icon={<TrendingUp size={22} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Total Bookings"
          value={stats.orders.total.toLocaleString()}
          subtitle={`${completionRate}% completion rate`}
          icon={<ShoppingCart size={22} className="text-orange-600" />}
          color="bg-orange-50"
        />
        <StatCard
          title="Payment Success"
          value={`${stats.payments.successRate.toFixed(1)}%`}
          subtitle={`${stats.payments.successful} of ${stats.payments.total} payments`}
          icon={<CreditCard size={22} className="text-blue-600" />}
          color="bg-blue-50"
        />
      </div>

      {/* ── Secondary Stats ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Technician Payouts"
          value={`Rs. ${stats.revenue.technician.toLocaleString()}`}
          subtitle="Total disbursed"
          icon={<Users size={22} className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          title="Monthly Bookings"
          value={dailyRevenue.reduce((sum: number, d: any) => sum + d.orders, 0).toLocaleString()}
          subtitle="Last 30 days"
          icon={<Calendar size={22} className="text-teal-600" />}
          color="bg-teal-50"
        />
        <StatCard
          title="Pending Orders"
          value={stats.orders.pending.toLocaleString()}
          subtitle="Awaiting action"
          icon={<ShoppingCart size={22} className="text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          title="Completed Orders"
          value={stats.orders.completed.toLocaleString()}
          subtitle="Successfully fulfilled"
          icon={<ShoppingCart size={22} className="text-green-600" />}
          color="bg-green-50"
        />
      </div>

      {/* ── Revenue Trend + Booking Orders Chart ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Revenue Growth (30 Days)
          </h2>
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="revenueGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  formatter={(value: number, name: string) => [
                    `Rs. ${value.toLocaleString()}`,
                    name === 'revenue' ? 'Total Revenue' : 'Platform Earnings',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#revenueGradAnalytics)"
                  name="revenue"
                />
                <Line
                  type="monotone"
                  dataKey="platformEarnings"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  name="platformEarnings"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Daily Bookings Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-orange-500" />
            Daily Bookings (30 Days)
          </h2>
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyRevenue}>
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
                <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No booking data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Order Distribution + User Growth ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-blue-500" />
            Order Status Distribution
          </h2>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No order data yet
            </div>
          )}
        </div>

        {/* User Growth Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-purple-500" />
            User Growth (30 Days)
          </h2>
          {dailyUsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyUsers}>
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
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#8b5cf6' }}
                  activeDot={{ r: 5 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-400 text-sm">
              No user growth data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Category Performance Chart ─────────────────── */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-500" />
            Bookings by Category
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="orders" fill="#6366f1" radius={[0, 4, 4, 0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default PlatformAnalytics;
