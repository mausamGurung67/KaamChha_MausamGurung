import React, { useState } from 'react';
import { X, Star, Loader2, Send, CheckCircle } from 'lucide-react';
import { submitReview } from '../../services/review.service';

interface ReviewModalProps {
  orderId: string;
  serviceName: string;
  technicianName: string;
  onClose: () => void;
  onReviewSubmitted?: (review: any) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  orderId,
  serviceName,
  technicianName,
  onClose,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await submitReview(orderId, rating, comment.trim() || undefined);

      if (res.success) {
        setSuccess(true);
        onReviewSubmitted?.(res.data);
        setTimeout(() => onClose(), 2000);
      } else {
        setError(res.message || 'Failed to submit review');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-500 text-sm">Your review has been submitted successfully.</p>
          <div className="flex items-center justify-center gap-1 mt-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Rate & Review</h3>
            <p className="text-sm text-gray-500 mt-0.5">{serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Technician info */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50">
          <p className="text-xs text-gray-500 mb-1">How was the service by</p>
          <p className="text-base font-semibold text-gray-900">{technicianName}</p>
        </div>

        {/* Star Rating */}
        <div className="px-6 py-5">
          <p className="text-sm font-medium text-gray-700 mb-3 text-center">Tap a star to rate</p>
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const starValue = i + 1;
              const isActive = starValue <= (hoveredRating || rating);
              return (
                <button
                  key={i}
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoveredRating(starValue)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  disabled={loading}
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      isActive
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-200 hover:text-yellow-200'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {(hoveredRating || rating) > 0 && (
            <p className="text-center text-sm font-medium text-orange-600 mt-2">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div className="px-6 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Write a review <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this service..."
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            disabled={loading}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/1000</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
