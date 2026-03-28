import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Zap,
  IndianRupee,
  AlertTriangle,
  FileSearch,
  RefreshCw,
  ArrowRight,
  Star,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import * as technicianService from '../../services/technician.service';
import type { TechnicianStats, RecentOrder, MonthlyData } from '../../services/technician.service';
import { TechDashboardSkeleton } from '../../components/common/Skeleton';
import { useReviewSocket } from '../../hooks/useReviewSocket';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const TechnicianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real-time review updates
  useReviewSocket({
    onNewReview: (payload) => {
      setStats(prev => prev ? {
        ...prev,
        averageRating: payload.averageRating,
        totalReviews: payload.totalReviews,
      } : prev);
      toast(
        `${payload.review.customer.profile?.name || 'A customer'} rated you ${payload.review.rating}/5!`,
        { icon: '⭐', duration: 5000 }
      );
    },
  });

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await technicianService.getDashboard();
      if (response.success && response.data) {
        setStats(response.data.stats);
        setRecentOrders(response.data.recentOrders);
        setMonthlyData(response.data.monthlyData || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <TechDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchDashboard}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // KYC not submitted
  if (!stats || stats.kycStatus === 'NOT_SUBMITTED') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <FileSearch size={56} className="text-orange-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">KYC Not Submitted</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            You need to submit your KYC documents before you can access your dashboard and start accepting service requests.
          </p>
          <Button variant="primary" size="lg" onClick={() => navigate('/auth/technician-kyc')}>
            Submit KYC Documents
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    );
  }

  // KYC pending
  if (stats.kycStatus === 'PENDING') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">KYC Under Review</h2>
          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full mb-4">
            PENDING VERIFICATION
          </span>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Your KYC documents have been submitted and are currently being reviewed by our admin team. 
            You'll get full access to your dashboard once your documents are verified.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">What happens next?</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Our team typically reviews documents within 24-48 hours. Once approved, 
                  you'll be able to view service requests and start accepting jobs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // KYC rejected
  if (stats.kycStatus === 'REJECTED') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">KYC Rejected</h2>
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full mb-4">
            VERIFICATION FAILED
          </span>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Unfortunately, your KYC documents were not approved. Please review the reason below 
            and resubmit your documents.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mb-6">
            <p className="text-sm font-medium text-red-800">Reason for rejection:</p>
            <p className="text-sm text-red-700 mt-1">
              Please ensure your documents are clear and legible, then try again.
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => navigate('/auth/technician-kyc')}>
            <RefreshCw size={18} />
            Resubmit KYC Documents
          </Button>
        </div>
      </div>
    );
  }

  // KYC approved — show full dashboard
  const statCards = [
    {
      label: 'Total Earnings',
      value: `NPR ${stats.totalEarnings.toLocaleString()}`,
      icon: <IndianRupee size={24} className="text-white" />,
      color: 'bg-emerald-500',
      change: `NPR ${stats.thisMonthEarnings.toLocaleString()} this month`,
    },
    {
      label: 'Completed Jobs',
      value: stats.completedOrders,
      icon: <CheckCircle size={24} className="text-white" />,
      color: 'bg-blue-500',
      change: `of ${stats.totalOrders} total jobs`,
    },
    {
      label: 'Average Rating',
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-',
      icon: <Star size={24} className="text-white" />,
      color: 'bg-amber-500',
      change: `${stats.totalReviews} review${stats.totalReviews !== 1 ? 's' : ''}`,
    },
    {
      label: 'Active Requests',
      value: stats.activeOrders + stats.pendingOrders,
      icon: <Zap size={24} className="text-white" />,
      color: 'bg-orange-500',
      change: `${stats.pendingOrders} pending, ${stats.activeOrders} in progress`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${card.color} rounded-lg flex items-center justify-center`}>
                {card.icon}
              </div>
              <TrendingUp size={16} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            <p className="text-xs text-gray-400 mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Earnings Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value) => [`NPR ${Number(value ?? 0).toLocaleString()}`, 'Earnings']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area
                  type="monotone"
                  dataKey="earnings"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#earningsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
              No earnings data yet
            </div>
          )}
        </div>

        {/* Jobs Completed Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs Completed</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), 'Jobs']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
              No job data yet
            </div>
          )}
        </div>
      </div>

      {/* Rating Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-500 text-sm font-medium">Your Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-3xl font-bold text-amber-700">
                {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '-'}
              </h2>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.round(stats.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-amber-200'}
                  />
                ))}
              </div>
            </div>
            <p className="text-amber-400 text-sm mt-2">
              {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
            <Star size={28} className="text-amber-500" />
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
        </div>
        <div className="p-5">
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No jobs yet</p>
              <p className="text-gray-400 text-sm mt-1">
                New jobs will appear here once customers book services in your area.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ClipboardList size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.service.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.customer.profile.name} &middot; {order.service.category.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                        order.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'IN_PROGRESS'
                          ? 'bg-purple-100 text-purple-700'
                          : order.status === 'ASSIGNED'
                          ? 'bg-blue-100 text-blue-700'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      NPR {order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
