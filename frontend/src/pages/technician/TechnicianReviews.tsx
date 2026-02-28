import React, { useEffect, useState } from 'react';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getTechnicianReviews,
  getTechnicianRating,
  type Review,
  type TechnicianRating,
} from '../../services/review.service';
import { useReviewSocket } from '../../hooks/useReviewSocket';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

const TechnicianReviews: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<TechnicianRating>({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Distribution state
  const [distribution, setDistribution] = useState<number[]>([0, 0, 0, 0, 0]);

  // Real-time review updates
  useReviewSocket({
    onNewReview: (payload) => {
      setRating({ averageRating: payload.averageRating, totalReviews: payload.totalReviews });
      toast.success(
        `${payload.review.customer.profile?.name || 'A customer'} rated you ${payload.review.rating}/5!`,
        { icon: '⭐' }
      );
      // Refresh to show the new review
      if (page === 1) fetchReviews();
    },
  });

  const fetchReviews = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const [reviewsRes, ratingRes] = await Promise.all([
        getTechnicianReviews(user.id, page, 10),
        getTechnicianRating(user.id),
      ]);
      if (reviewsRes.success && reviewsRes.data) {
        setReviews(reviewsRes.data.reviews);
        setTotalPages(reviewsRes.data.pagination.totalPages);
        setTotal(reviewsRes.data.pagination.total);

        // Calculate distribution from all reviews we know about
        const dist = [0, 0, 0, 0, 0];
        reviewsRes.data.reviews.forEach((r) => {
          if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++;
        });
        setDistribution(dist);
      }
      if (ratingRes.success && ratingRes.data) {
        setRating(ratingRes.data);
      }
    } catch {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, user?.id]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(dateStr);
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
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
          <Button variant="primary" size="sm" onClick={fetchReviews}>
            <RefreshCw size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
        <p className="text-gray-500 mt-1">See what your customers are saying about your work</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Rating Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-500 text-sm font-medium">Average Rating</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-4xl font-bold text-amber-700">
                  {rating.totalReviews > 0 ? rating.averageRating.toFixed(1) : '—'}
                </h2>
                <div className="flex flex-col">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < Math.round(rating.averageRating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-amber-200'
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs text-amber-400 mt-0.5">out of 5</span>
                </div>
              </div>
            </div>
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star size={28} className="text-amber-500" />
            </div>
          </div>
        </div>

        {/* Total Reviews Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-500 text-sm font-medium">Total Reviews</p>
              <h2 className="text-4xl font-bold text-blue-700 mt-1">{rating.totalReviews}</h2>
              <p className="text-blue-400 text-xs mt-1">from customers</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={28} className="text-blue-500" />
            </div>
          </div>
        </div>

        {/* Rating Distribution Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-gray-400" />
            <p className="text-gray-500 text-sm font-medium">Distribution</p>
          </div>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-3">{star}</span>
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${(distribution[star - 1] / maxDist) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-5 text-right">{distribution[star - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Customer Reviews {total > 0 && <span className="text-gray-400 font-normal text-sm">({total})</span>}
          </h2>
          <button
            onClick={fetchReviews}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="p-5">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquareText size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No reviews yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Reviews will appear here once customers rate your work
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {review.customer?.profile?.avatar ? (
                        <img
                          src={review.customer.profile.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
                          {(review.customer?.profile?.name || 'C')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {review.customer?.profile?.name || 'Customer'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                className={
                                  i < review.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-200'
                                }
                              />
                            ))}
                          </div>
                          {review.service && (
                            <span className="text-xs text-gray-400">
                              &middot; {review.service.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {timeAgo(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed pl-[52px]">
                      "{review.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianReviews;
