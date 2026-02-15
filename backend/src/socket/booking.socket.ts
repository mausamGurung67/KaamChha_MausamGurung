import { Server } from 'socket.io';
import prisma from '../config/database';
import { AuthenticatedSocket } from '../types/socket';
import { OrderStatus, UserRole } from '@prisma/client';

/**
 * Register booking-room (chat) events on the given socket.
 *
 * Room naming convention: `booking_<orderId>`
 *
 * A user may join a booking room only when:
 *   1. The order exists
 *   2. The order status is ACCEPTED
 *   3. The user is the customer, the assigned technician, or an admin
 */
export const registerBookingHandlers = (io: Server, socket: AuthenticatedSocket): void => {
  const { userId, role } = socket.user;

  // ── join:booking ──────────────────────────────────────────────────
  socket.on('join:booking', async (bookingId: string, callback?: (res: { success: boolean; message: string }) => void) => {
    const respond = (success: boolean, message: string) => {
      if (typeof callback === 'function') {
        callback({ success, message });
      } else {
        socket.emit('booking:error', { bookingId, message });
      }
    };

    try {
      // ── Validate input ──
      if (!bookingId || typeof bookingId !== 'string') {
        return respond(false, 'bookingId is required');
      }

      // ── Fetch the order ──
      const order = await prisma.order.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          status: true,
          customerId: true,
          technicianId: true,
        },
      });

      if (!order) {
        return respond(false, 'Booking not found');
      }

      // ── Status check ──
      if (order.status !== OrderStatus.ACCEPTED) {
        return respond(false, `Cannot join room — booking status is ${order.status}, expected ACCEPTED`);
      }

      // ── Authorization check ──
      const isCustomer = order.customerId === userId;
      const isTechnician = order.technicianId === userId;
      const isAdmin = role === UserRole.ADMIN;

      if (!isCustomer && !isTechnician && !isAdmin) {
        return respond(false, 'You are not authorized to join this booking room');
      }

      // ── Join the room ──
      const room = `booking_${bookingId}`;
      socket.join(room);

      console.log(`💬 [Socket] User ${userId} joined room ${room}  (socketId=${socket.id})`);

      respond(true, `Joined room ${room}`);

      // Notify other participants that someone joined
      socket.to(room).emit('booking:user-joined', {
        bookingId,
        userId,
        role,
      });
    } catch (error) {
      console.error('[Socket] join:booking error', error);
      respond(false, 'Internal server error while joining booking room');
    }
  });

  // ── leave:booking ─────────────────────────────────────────────────
  socket.on('leave:booking', (bookingId: string, callback?: (res: { success: boolean; message: string }) => void) => {
    const room = `booking_${bookingId}`;
    socket.leave(room);

    console.log(`👋 [Socket] User ${userId} left room ${room}  (socketId=${socket.id})`);

    if (typeof callback === 'function') {
      callback({ success: true, message: `Left room ${room}` });
    }

    // Notify remaining participants
    socket.to(room).emit('booking:user-left', {
      bookingId,
      userId,
      role,
    });
  });
};
