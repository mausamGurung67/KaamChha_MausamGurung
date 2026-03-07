import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import * as technicianService from '../../services/technician.service';
import type { EarningsData } from '../../services/technician.service';
import Button from '../../components/common/Button';
import { DashboardStatsSkeleton, Skeleton } from '../../components/common/Skeleton';

const TechnicianEarnings: React.FC = () => {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await technicianService.getEarnings();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>

        {/* 4 Stat Cards */}
        <DashboardStatsSkeleton count={4} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />

        {/* Chart skeleton */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-80 w-full" rounded="xl" />
        </div>

        {/* Table skeleton */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-5 border-b border-gray-100">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="p-5 space-y-3">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b border-gray-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-16" />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 py-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" rounded="full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="primary" size="sm" onClick={fetchEarnings}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    {
      label: 'Total Earnings',
      value: `NPR ${data.totalEarnings.toLocaleString()}`,
      subtitle: `${data.totalCompletedOrders} completed jobs`,
      icon: <IndianRupee size={24} className="text-white" />,
      color: 'bg-emerald-500',
      bgLight: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
    },
    {
      label: 'This Month',
      value: `NPR ${data.thisMonthEarnings.toLocaleString()}`,
      subtitle: `${data.thisMonthOrders} jobs this month`,
      icon: <TrendingUp size={24} className="text-white" />,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      label: 'Completed Payments',
      value: `NPR ${data.completedPayments.toLocaleString()}`,
      subtitle: `${data.completedPaymentCount} payments received`,
      icon: <CheckCircle size={24} className="text-white" />,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
    },
    {
      label: 'Pending Payments',
      value: `NPR ${data.pendingPayments.toLocaleString()}`,
      subtitle: `${data.pendingPaymentCount} awaiting payment`,
      icon: <Clock size={24} className="text-white" />,
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
        <p className="text-gray-500 mt-1">Track your income and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bgLight} ${card.borderColor} border rounded-xl p-5 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${card.color} rounded-lg flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <h3 className={`text-xl font-bold ${card.textColor}`}>{card.value}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Monthly Earnings Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Earnings Trend</h3>
          <span className="text-xs text-gray-400">Last 12 months</span>
        </div>
        {data.monthlyChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.monthlyChart}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [`NPR ${Number(value).toLocaleString()}`, 'Earnings']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#earningsGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[320px] text-gray-400 text-sm">
            No earnings data yet
          </div>
        )}
      </div>

      {/* Recent Payment History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Payment History</h3>
        </div>
        <div className="p-5">
          {data.recentPayments.length === 0 ? (
            <div className="text-center py-10">
              <Wallet size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No payments yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Your payment history will appear here once you complete jobs.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Service</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Your Share</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-gray-900">{payment.service.name}</td>
                      <td className="py-3 text-gray-600">{payment.customer.profile?.name || '-'}</td>
                      <td className="py-3 text-gray-600">NPR {Number(payment.totalAmount).toLocaleString()}</td>
                      <td className="py-3 font-medium text-emerald-600">NPR {Number(payment.technicianAmount).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${
                          payment.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : payment.paymentStatus === 'FAILED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400">
                        {payment.completedAt ? new Date(payment.completedAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianEarnings;
