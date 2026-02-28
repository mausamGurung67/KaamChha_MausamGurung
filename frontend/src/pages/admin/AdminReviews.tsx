import React, { useEffect, useState, useCallback } from 'react';
import {
  Star,
  Search,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  TrendingUp,
  Filter,
} from 'lucide-react';
import {
  getAdminReviews,
  toggleReviewApproval,
  deleteReview,
  type Review,
} from '../../services/review.service';
import { Skeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

// ── Rating stars ──────────────────────────────────────
const Stars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        size={size}
        className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

// ── Skeleton loader ───────────────────────────────────
const ReviewTableSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    {/* Header */}
    <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`col-span-${[3, 2, 2, 2, 1, 2][i]}`}>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 border-b border-gray-50">
        <div className="col-span-3 flex items-center gap-3">
          <Skeleton className="w-9 h-9 flex-shrink-0" rounded="full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="col-span-2 flex items-center"><Skeleton className="h-4 w-24" /></div>
        <div className="col-span-2 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} className="h-3.5 w-3.5" rounded="sm" />
          ))}
        </div>
        <div className="col-span-2 flex items-center"><Skeleton className="h-3 w-32" /></div>
        <div className="col-span-1 flex items-center"><Skeleton className="h-5 w-14" rounded="full" /></div>
        <div className="col-span-2 flex items-center gap-2">
          <Skeleton className="h-8 w-8" rounded="lg" />
          <Skeleton className="h-8 w-8" rounded="lg" />
        </div>
      </div>
    ))}
  </div>
);

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [approvalFilter, setApprovalFilter] = useState<string>('');
  const [overallStats, setOverallStats] = useState<{
    averageRating: number;
    totalReviews: number;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (ratingFilter) params.rating = ratingFilter;
      if (approvalFilter !== '') params.isApproved = approvalFilter;

      const res = await getAdminReviews(params);
      if (res.success && res.data) {
        setReviews(res.data.reviews);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
        setOverallStats(res.data.overallStats);
      }
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [page, search, ratingFilter, approvalFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleApproval = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await toggleReviewApproval(id);
      if (res.success) {
        toast.success(res.message || 'Review updated');
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: !r.isApproved } : r))
        );
      }
    } catch {
      toast.error('Failed to update review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    setActionLoading(id);
    try {
      const res = await deleteReview(id);
      if (res.success) {
        toast.success('Review deleted');
        setReviews((prev) => prev.filter((r) => r.id !== id));
        setTotal((t) => t - 1);
      }
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
        <p className="text-gray-500 mt-1">Moderate and manage platform reviews</p>
      </div>

      {/* Stats overview */}
      {overallStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Star size={22} className="text-yellow-500 fill-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.averageRating}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <MessageSquare size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalReviews}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <TrendingUp size={22} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Filtered Results</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by customer, service, or comment..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            />
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={ratingFilter}
              onChange={(e) => { setRatingFilter(e.target.value ? Number(e.target.value) : ''); setPage(1); }}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Approval filter */}
          <select
            value={approvalFilter}
            onChange={(e) => { setApprovalFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="">All Status</option>
            <option value="true">Approved</option>
            <option value="false">Hidden</option>
          </select>
        </div>
      </div>

      {/* Reviews table */}
      {loading ? (
        <ReviewTableSkeleton />
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <MessageSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reviews found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Service</div>
            <div className="col-span-2">Rating</div>
            <div className="col-span-2">Comment</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
          </div>

          {/* Review rows */}
          {reviews.map((review) => (
            <div
              key={review.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition"
            >
              {/* Customer */}
              <div className="col-span-3 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {review.customer?.profile?.name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {review.customer?.profile?.name || 'Customer'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{formatDate(review.createdAt)}</p>
                </div>
              </div>

              {/* Service */}
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-gray-700 truncate">{review.service?.name || '—'}</p>
              </div>

              {/* Rating */}
              <div className="col-span-2 flex items-center">
                <Stars rating={review.rating} />
              </div>

              {/* Comment */}
              <div className="col-span-2 flex items-center">
                <p className="text-xs text-gray-500 line-clamp-2">
                  {review.comment || <span className="italic text-gray-300">No comment</span>}
                </p>
              </div>

              {/* Status */}
              <div className="col-span-1 flex items-center">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    review.isApproved
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {review.isApproved ? 'Visible' : 'Hidden'}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center gap-2">
                <button
                  onClick={() => handleToggleApproval(review.id)}
                  disabled={actionLoading === review.id}
                  className={`p-2 rounded-lg transition text-sm ${
                    review.isApproved
                      ? 'text-yellow-600 hover:bg-yellow-50'
                      : 'text-green-600 hover:bg-green-50'
                  } disabled:opacity-50`}
                  title={review.isApproved ? 'Hide review' : 'Approve review'}
                >
                  {review.isApproved ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={actionLoading === review.id}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                  title="Delete review"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} reviews)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
