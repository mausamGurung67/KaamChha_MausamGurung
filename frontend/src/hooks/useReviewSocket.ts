import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export interface ReviewSocketPayload {
  review: {
    id: string;
    orderId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customer: {
      id: string;
      email: string;
      profile: { name: string; avatar?: string | null } | null;
    };
    service: {
      id: string;
      name: string;
    };
  };
  technicianId: string;
  averageRating: number;
  totalReviews: number;
}

interface UseReviewSocketOptions {
  /** Called when a new review is received (for technician / admin dashboards) */
  onNewReview?: (payload: ReviewSocketPayload) => void;
  /** Called when the current user's review submission is confirmed */
  onReviewSubmitted?: (payload: ReviewSocketPayload) => void;
}

/**
 * Hook to listen for real-time review events via socket.io.
 *
 * Usage in Technician Dashboard:
 *   useReviewSocket({ onNewReview: (data) => updateRating(data.averageRating) });
 *
 * Usage in Customer view:
 *   useReviewSocket({ onReviewSubmitted: (data) => showConfirmation(data) });
 */
export const useReviewSocket = (options: UseReviewSocketOptions = {}) => {
  const { socket, isConnected } = useSocket();
  const [latestReview, setLatestReview] = useState<ReviewSocketPayload | null>(null);

  const handleNewReview = useCallback(
    (payload: ReviewSocketPayload) => {
      setLatestReview(payload);
      options.onNewReview?.(payload);
    },
    [options.onNewReview]
  );

  const handleReviewSubmitted = useCallback(
    (payload: ReviewSocketPayload) => {
      setLatestReview(payload);
      options.onReviewSubmitted?.(payload);
    },
    [options.onReviewSubmitted]
  );

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('newReview', handleNewReview);
    socket.on('reviewSubmitted', handleReviewSubmitted);

    return () => {
      socket.off('newReview', handleNewReview);
      socket.off('reviewSubmitted', handleReviewSubmitted);
    };
  }, [socket, isConnected, handleNewReview, handleReviewSubmitted]);

  return { latestReview, isConnected };
};

export default useReviewSocket;
