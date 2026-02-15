import { Server as HttpServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import env from '../config/env';
import { socketAuthMiddleware } from './auth.socket';
import { registerSocketHandlers } from './handlers.socket';
import { AuthenticatedSocket } from '../types/socket';

let io: Server;

/**
 * Initialise Socket.IO on the existing HTTP server.
 * Call once from server.ts after creating the HTTP server.
 */
export const initSocketIO = (httpServer: HttpServer): Server => {
  const opts: Partial<ServerOptions> = {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Allow both transports — client starts with polling (sends cookies),
    // then upgrades to WebSocket for speed.
    transports: ['polling', 'websocket'],
    allowEIO3: true,
  };

  io = new Server(httpServer, opts);

  // ── Auth middleware ──
  io.use(socketAuthMiddleware);

  // ── Connection handler ──
  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket as AuthenticatedSocket);
  });

  console.log('⚡ Socket.IO initialised');

  return io;
};

/**
 * Returns the active Socket.IO server instance.
 * Use this from any service/controller to emit events.
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialised. Call initSocketIO() first.');
  }
  return io;
};
