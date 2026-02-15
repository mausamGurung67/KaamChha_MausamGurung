import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { getChatHistory, type ChatMessage } from '../services/chat.service';

interface UseChatOptions {
  bookingId: string | null;
}

/**
 * Hook to manage a booking chat room.
 *
 * Uses an "aborted" ref so that React 18 Strict-Mode double-fire doesn't
 * cause a leave→join race (the leave from the first cleanup would remove
 * the socket from the room while the second join's async DB query is still
 * in-flight on the server).
 */
export const useChat = ({ bookingId }: UseChatOptions) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable refs so callbacks always see latest values
  const socketRef = useRef(socket);
  const bookingRef = useRef(bookingId);
  const joinedRef = useRef(false);
  socketRef.current = socket;
  bookingRef.current = bookingId;

  // ── Join room & subscribe ──
  useEffect(() => {
    if (!socket || !isConnected || !bookingId) {
      setJoined(false);
      joinedRef.current = false;
      return;
    }

    let aborted = false;

    setLoading(true);
    setError(null);
    setMessages([]);

    // Fetch existing chat history
    getChatHistory(bookingId).then((history) => {
      if (!aborted) setMessages(history);
    });

    // Join the room
    socket.emit(
      'join:booking',
      bookingId,
      (res: { success: boolean; message: string }) => {
        if (aborted) return;
        if (res.success) {
          setJoined(true);
          joinedRef.current = true;
        } else {
          setError(res.message);
        }
        setLoading(false);
      },
    );

    // Listen for incoming messages
    const onNewMessage = (msg: ChatMessage) => {
      if (!aborted && msg.bookingId === bookingId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('new_message', onNewMessage);

    return () => {
      // Mark this effect run as stale — the callback-based join will
      // be ignored if the server responds after unmount / re-run.
      aborted = true;

      socket.off('new_message', onNewMessage);

      // Only leave the room when the bookingId actually changes or
      // the component truly unmounts — NOT on Strict-Mode replays.
      // We achieve this with a micro-task: if React immediately
      // re-runs the effect (strict mode), the new effect sets
      // aborted = false before this timeout fires.
      const roomToLeave = bookingId;
      const sock = socket;
      setTimeout(() => {
        // If the socket is still connected and we haven't re-joined
        // the same room, leave it.
        if (sock.connected && bookingRef.current !== roomToLeave) {
          sock.emit('leave:booking', roomToLeave);
        }
      }, 50);

      setJoined(false);
      joinedRef.current = false;
    };
  }, [socket, isConnected, bookingId]);

  // ── Send a message ──
  const sendMessage = useCallback(
    (content: string) => {
      const s = socketRef.current;
      const bid = bookingRef.current;
      if (!s || !bid || !joinedRef.current) return;
      s.emit(
        'send_message',
        { bookingId: bid, message: content },
        (res: { success: boolean; message?: string }) => {
          if (!res.success) {
            setError(res.message || 'Failed to send message');
          }
        },
      );
    },
    [], // stable — uses refs internally
  );

  return { messages, sendMessage, joined, loading, error, isConnected };
};
