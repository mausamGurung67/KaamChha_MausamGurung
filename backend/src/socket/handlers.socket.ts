import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../types/socket';
import { registerBookingHandlers } from './booking.socket';

/**
 * Register event handlers on each authenticated socket connection.
 * Extend this file (or split into domain-specific handlers) as features grow.
 */
export const registerSocketHandlers = (io: Server, socket: AuthenticatedSocket): void => {
  const { userId, email, role } = socket.user;

  // ── Join a user-specific room so we can target messages later ──
  socket.join(`user:${userId}`);

  console.log(`🔌 [Socket] Connected  — userId=${userId}  email=${email}  role=${role}  socketId=${socket.id}`);

  // ── Disconnect ──
  socket.on('disconnect', (reason: string) => {
    console.log(`❌ [Socket] Disconnected — userId=${userId}  socketId=${socket.id}  reason=${reason}`);
  });

  // ── Example: ping / pong for health-check ──
  socket.on('ping', (callback?: (msg: string) => void) => {
    if (typeof callback === 'function') {
      callback('pong');
    } else {
      socket.emit('pong');
    }
  });

  // ── Domain-specific handlers ──
  registerBookingHandlers(io, socket);
};
