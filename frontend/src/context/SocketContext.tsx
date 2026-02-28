import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Stable dependency — only reconnect when user identity changes, not object ref
  const userId = user?.id ?? null;

  useEffect(() => {
    // Only connect when user is logged in
    if (!userId) {
      setSocket((prev) => {
        if (prev) {
          prev.off('connect');
          prev.off('disconnect');
          prev.off('connect_error');
          prev.disconnect();
        }
        return null;
      });
      setIsConnected(false);
      return;
    }

    const s = io(SOCKET_URL, {
      withCredentials: true,
      // Start with polling so the browser sends cookies on the HTTP request,
      // then upgrade to WebSocket once authenticated.
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    const onConnect = () => {
      console.log('[Socket] Connected:', s.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      console.error('[Socket] Connection error:', err.message);
      setIsConnected(false);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    setSocket(s);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
