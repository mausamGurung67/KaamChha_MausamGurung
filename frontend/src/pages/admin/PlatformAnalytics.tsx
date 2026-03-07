import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
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
  Line,
} from 'recharts';
import {
  getPlatformStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  type PlatformStats,
} from '../../services/admin.service';
import { DashboardStatsSkeleton, Skeleton } from '../../components/common/Skeleton';

const CHART_COLORS = ['#f97316', '#3b82f6', '#10b981', '#eab308', '#8b5cf6', '#ef4444'];

// Shimmer skeleton loader
const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div>
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-72 mt-2" />
    </div>

    {/* 4 Stat Cards */}
    <DashboardStatsSkeleton count={4} cols="grid-cols-2 lg:grid-cols-4" />

    {/* Two chart skeletons side by side */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[0, 1].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-5 w-5" rounded="full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="flex items-end gap-2">
                <Skeleton className={`h-${4 + (j % 3) * 4} w-full`} />
              </div>
            ))}
          </div>
          <Skeleton className="h-64 w-full mt-2" rounded="xl" />
        </div>
      ))}
    </div>

    {/* Third chart skeleton */}
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-5 w-5" rounded="full" />
        <Skeleton className="h-5 w-48" />
      </div>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, revenueRes, orderRes] = await Promise.all([
          getPlatformStats(),
          getRevenueAnalytics(),
          getOrderAnalytics(),
        ]);

        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (revenueRes.success && revenueRes.data) setRevenueData(revenueRes.data);
        if (orderRes.success && orderRes.data) setOrderData(orderRes.data);
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

      {/* ── Stats Cards ────────────────────────────── */}
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
                  formatter={(value: number | undefined, name: string | undefined) => [
                    `Rs. ${(value ?? 0).toLocaleString()}`,
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

      {/* ── Order Status Distribution ──────────────── */}
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
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
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
    </div>
  );
};

export default PlatformAnalytics;
