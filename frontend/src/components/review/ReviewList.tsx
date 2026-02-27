import React, { useEffect, useState } from 'react';
import { Star, ChevronDown, MessageSquare, Loader2 } from 'lucide-react';
import {
  getTechnicianReviews,
  getServiceReviews,
  type Review,
  type TechnicianReviewsResponse,
} from '../../services/review.service';

interface ReviewListProps {
  /** Provide one of technicianId or serviceId */
  technicianId?: string;
  serviceId?: string;
  /** Max reviews to show initially (default 3) */
  initialLimit?: number;
}

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
      />
    ))}
  </div>
);

const ReviewList: React.FC<ReviewListProps> = ({
  technicianId,
  serviceId,
  initialLimit = 3,
}) => {
  const [data, setData] = useState<TechnicianReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  const fetchReviews = async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      let res;
      if (technicianId) {
        res = await getTechnicianReviews(technicianId, pageNum, initialLimit);
      } else if (serviceId) {
        res = await getServiceReviews(serviceId, pageNum, initialLimit);
      } else {
        return;
      }

      if (res.success && res.data) {
        setData(res.data);
        if (append) {
          setAllReviews((prev) => [...prev, ...res.data!.reviews]);
        } else {
          setAllReviews(res.data.reviews);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setAllReviews([]);
    fetchReviews(1);
  }, [technicianId, serviceId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data || data.totalReviews === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare size={32} className="text-gray-300 mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No reviews yet</p>
      </div>
    );
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">{data.averageRating}</p>
          <StarRating rating={Math.round(data.averageRating)} size={16} />
          <p className="text-xs text-gray-400 mt-1">{data.totalReviews} review{data.totalReviews !== 1 ? 's' : ''}</p>
        </div>

        {/* Rating distribution */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = allReviews.filter((r) => r.rating === star).length;
            const percentage = data.totalReviews > 0 ? (count / data.totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 w-3">{star}</span>
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review items */}
      <div className="space-y-4">
        {allReviews.map((review) => (
          <div key={review.id} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {review.customer?.profile?.name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {review.customer?.profile?.name || 'Customer'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.rating} size={12} />
                    <span className="text-[11px] text-gray-400">{timeAgo(review.createdAt)}</span>
                  </div>
                </div>
              </div>
              {review.service && (
                <span className="text-[11px] text-gray-400 bg-white px-2 py-0.5 rounded-full">
                  {review.service.name}
                </span>
              )}
            </div>
            {review.comment && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
            )}
          </div>
        ))}
      </div>

      {/* Load more */}
      {data.pagination.hasNext && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition disabled:opacity-50"
        >
          {loadingMore ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <ChevronDown size={16} />
              Load more reviews
            </>
          )}
        </button>
      )}
    </div>
  );
};

export { ReviewList, StarRating };
export default ReviewList;
