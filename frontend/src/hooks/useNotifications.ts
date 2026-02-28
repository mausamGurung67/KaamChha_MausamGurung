import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import * as notificationApi from '../services/notification.service';
import type { Notification } from '../services/notification.service';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  fetchMore: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const initialFetchDone = useRef(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (pageNum: number, replace = false) => {
    try {
      setLoading(true);
      const result = await notificationApi.getNotifications(pageNum, 20);
      setNotifications((prev) =>
        replace ? result.notifications : [...prev, ...result.notifications],
      );
      setUnreadCount(result.unreadCount);
      setHasMore(result.pagination.hasNext);
      setPage(pageNum);
    } catch (err) {
      console.error('[Notifications] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchNotifications(1, true);
    }
  }, [fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: Notification) => {
      setNotifications((prev) => [payload, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  // Fetch more (pagination)
  const fetchMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, false);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  // Mark single as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('[Notifications] markAsRead error:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] markAllAsRead error:', err);
    }
  }, []);

  // Full refresh
  const refresh = useCallback(async () => {
    await fetchNotifications(1, true);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchMore,
    markAsRead,
    markAllAsRead,
    refresh,
  };
};
