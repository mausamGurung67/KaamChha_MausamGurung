import { useEffect, useState, useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useSocket } from '../context/SocketContext';
import * as notificationApi from '../services/notification.service';
import type { Notification } from '../services/notification.service';

const MAX_CACHED_NOTIFICATIONS = 50;

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

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (pageNum: number, replace = false) => {
    try {
      setLoading(true);
      const result = await notificationApi.getNotifications(pageNum, 20);

      unstable_batchedUpdates(() => {
        setNotifications((prev) => {
          const updated = replace
            ? result.notifications
            : [...prev, ...result.notifications];
          // Cap cached notifications to prevent unbounded growth
          return updated.length > MAX_CACHED_NOTIFICATIONS
            ? updated.slice(0, MAX_CACHED_NOTIFICATIONS)
            : updated;
        });
        setUnreadCount(result.unreadCount);
        setHasMore(result.pagination.hasNext);
        setPage(pageNum);
      });
    } catch (err) {
      console.error('[Notifications] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch when socket changes (login/logout cycle)
  // socket is null when logged out, new Socket instance on login
  useEffect(() => {
    if (socket) {
      fetchNotifications(1, true);
    } else {
      // Logged out — clear everything
      unstable_batchedUpdates(() => {
        setNotifications([]);
        setUnreadCount(0);
        setPage(1);
        setHasMore(true);
      });
    }
  }, [socket, fetchNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: Notification) => {
      unstable_batchedUpdates(() => {
        setNotifications((prev) => {
          // Deduplicate — server might emit + API fetch overlap
          if (prev.some((n) => n.id === payload.id)) return prev;
          const updated = [payload, ...prev];
          return updated.length > MAX_CACHED_NOTIFICATIONS
            ? updated.slice(0, MAX_CACHED_NOTIFICATIONS)
            : updated;
        });
        setUnreadCount((c) => c + 1);
      });
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
      unstable_batchedUpdates(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      });
    } catch (err) {
      console.error('[Notifications] markAsRead error:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      unstable_batchedUpdates(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      });
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
