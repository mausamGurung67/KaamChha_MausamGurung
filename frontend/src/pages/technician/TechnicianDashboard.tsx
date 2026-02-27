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
} from 'lucide-react';
import * as technicianService from '../../services/technician.service';
import type { TechnicianStats, RecentOrder } from '../../services/technician.service';
import { TechDashboardSkeleton } from '../../components/common/Skeleton';
import { useAuth } from '../../hooks/useAuth';
import { getTechnicianRating } from '../../services/review.service';
import { useReviewSocket } from '../../hooks/useReviewSocket';

const TechnicianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<TechnicianStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 0, totalReviews: 0 });
  const [newReviewToast, setNewReviewToast] = useState<string | null>(null);

  // Real-time review updates
  useReviewSocket({
    onNewReview: (payload) => {
      setRating({ averageRating: payload.averageRating, totalReviews: payload.totalReviews });
      setNewReviewToast(`${payload.review.customer.profile?.name || 'A customer'} rated you ${payload.review.rating}/5!`);
      setTimeout(() => setNewReviewToast(null), 5000);
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
      }
      // Fetch rating
      if (user?.id) {
        try {
          const ratingRes = await getTechnicianRating(user.id);
          if (ratingRes.success && ratingRes.data) {
            setRating(ratingRes.data);
          }
        } catch { /* no reviews yet */ }
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
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
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
          <button
            onClick={() => navigate('/auth/technician-kyc')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition shadow-md"
          >
            Submit KYC Documents
            <ArrowRight size={18} />
          </button>
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
          <button
            onClick={() => navigate('/auth/technician-kyc')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition shadow-md"
          >
            <RefreshCw size={18} />
            Resubmit KYC Documents
          </button>
        </div>
      </div>
    );
  }

  // KYC approved — show full dashboard
  const statCards = [
    {
      label: 'Total Requests',
      value: stats.totalOrders,
      icon: <ClipboardList size={24} className="text-white" />,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
    },
    {
      label: 'Pending',
      value: stats.pendingOrders,
      icon: <Clock size={24} className="text-white" />,
      color: 'bg-yellow-500',
      bgLight: 'bg-yellow-50',
    },
    {
      label: 'Active',
      value: stats.activeOrders,
      icon: <Zap size={24} className="text-white" />,
      color: 'bg-orange-500',
      bgLight: 'bg-orange-50',
    },
    {
      label: 'Completed',
      value: stats.completedOrders,
      icon: <CheckCircle size={24} className="text-white" />,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* New review toast */}
      {newReviewToast && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
          <Star size={18} className="text-amber-500 fill-amber-500" />
          <p className="text-sm text-amber-700 font-medium">{newReviewToast}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${card.color} rounded-lg flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Earnings + Rating Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Earnings card */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-500 text-sm font-medium">Total Earnings</p>
              <h2 className="text-3xl font-bold mt-1 text-orange-700">NPR {stats.totalEarnings.toLocaleString()}</h2>
              <p className="text-orange-400 text-sm mt-2">
                From {stats.completedOrders} completed {stats.completedOrders === 1 ? 'job' : 'jobs'}
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <IndianRupee size={28} className="text-orange-500" />
            </div>
          </div>
        </div>

        {/* Rating card */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-500 text-sm font-medium">Your Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-3xl font-bold text-amber-700">
                  {rating.totalReviews > 0 ? rating.averageRating : '-'}
                </h2>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < Math.round(rating.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-amber-200'}
                    />
                  ))}
                </div>
              </div>
              <p className="text-amber-400 text-sm mt-2">
                {rating.totalReviews} review{rating.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star size={28} className="text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Service Requests</h2>
        </div>
        <div className="p-5">
          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No service requests yet</p>
              <p className="text-gray-400 text-sm mt-1">
                New requests will appear here once customers book services in your area.
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
