import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { getChatHistory, type ChatMessage } from '../services/chat.service';

interface UseChatOptions {
  bookingId: string | null;
}

export const useChat = ({ bookingId }: UseChatOptions) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentRoom = useRef<string | null>(null);

  // Join a booking room
  useEffect(() => {
    if (!socket || !isConnected || !bookingId) {
      setJoined(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMessages([]);

    // Fetch existing history
    getChatHistory(bookingId).then((history) => {
      setMessages(history);
    });

    // Join the room via socket
    socket.emit(
      'join:booking',
      bookingId,
      (res: { success: boolean; message: string }) => {
        if (res.success) {
          setJoined(true);
          currentRoom.current = bookingId;
        } else {
          setError(res.message);
        }
        setLoading(false);
      },
    );

    // Listen for new messages
    const onNewMessage = (msg: ChatMessage) => {
      if (msg.bookingId === bookingId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('new_message', onNewMessage);

    return () => {
      socket.off('new_message', onNewMessage);
      if (currentRoom.current) {
        socket.emit('leave:booking', currentRoom.current);
        currentRoom.current = null;
      }
      setJoined(false);
    };
  }, [socket, isConnected, bookingId]);

  // Send a message
  const sendMessage = useCallback(
    (content: string) => {
      if (!socket || !bookingId || !joined) return;
      socket.emit(
        'send_message',
        { bookingId, message: content },
        (res: { success: boolean; message?: string }) => {
          if (!res.success) {
            setError(res.message || 'Failed to send message');
          }
        },
      );
    },
    [socket, bookingId, joined],
  );

  return { messages, sendMessage, joined, loading, error, isConnected };
};
