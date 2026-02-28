import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../services/notification.service';

// ── Helpers ───────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  BOOKING_CREATED: '📋',
  BOOKING_ACCEPTED: '✅',
  BOOKING_REJECTED: '❌',
  BOOKING_CANCELLED: '🚫',
  BOOKING_STATUS_UPDATED: '🔄',
  BOOKING_COMPLETED: '🎉',
  PAYMENT_SUCCESS: '💰',
  REVIEW_SUBMITTED: '⭐',
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

// ── Memoized notification item ────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const NotificationItem = React.memo<NotificationItemProps>(
  ({ notification: n, onRead }) => (
    <button
      onClick={() => {
        if (!n.isRead) onRead(n.id);
      }}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 ${
        !n.isRead ? 'bg-orange-50/50' : ''
      }`}
    >
      {/* Icon */}
      <span className="text-lg mt-0.5 shrink-0">
        {TYPE_ICONS[n.type] || '🔔'}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              !n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
            }`}
          >
            {n.title}
          </p>
          {!n.isRead && (
            <span className="mt-1.5 shrink-0 w-2 h-2 bg-orange-500 rounded-full" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Read indicator */}
      {n.isRead && <Check size={14} className="text-gray-300 mt-1 shrink-0" />}
    </button>
  ),
);

NotificationItem.displayName = 'NotificationItem';

// ── Bell component ────────────────────────────────────

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Stable callback ref for marking as read
  const handleRead = useCallback(
    (id: string) => {
      markAsRead(id);
    },
    [markAsRead],
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-medium text-orange-600">({unreadCount} new)</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* List — capped at 50vh to prevent covering the page */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[50vh]">
            {notifications.length === 0 && !loading ? (
              <div className="py-10 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={handleRead} />
              ))
            )}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={fetchMore}
                disabled={loading}
                className="w-full py-3 text-xs text-orange-600 hover:text-orange-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2">
              <p className="text-[11px] text-gray-400 text-center">
                Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(NotificationBell);
