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

  // ── send_message ──────────────────────────────────────────────────
  socket.on(
    'send_message',
    async (
      data: { bookingId: string; message: string },
      callback?: (res: { success: boolean; message?: string; data?: Record<string, unknown> }) => void,
    ) => {
      const respond = (success: boolean, message: string, payload?: Record<string, unknown>) => {
        if (typeof callback === 'function') {
          callback({ success, message, data: payload });
        } else if (!success) {
          socket.emit('booking:error', { bookingId: data?.bookingId, message });
        }
      };

      try {
        // ── Validate payload ──
        const { bookingId, message: content } = data || {};

        if (!bookingId || typeof bookingId !== 'string') {
          return respond(false, 'bookingId is required');
        }
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          return respond(false, 'message content is required');
        }

        // ── Fetch order & verify membership ──
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

        const isCustomer = order.customerId === userId;
        const isTechnician = order.technicianId === userId;
        const isAdmin = role === UserRole.ADMIN;

        if (!isCustomer && !isTechnician && !isAdmin) {
          return respond(false, 'You are not authorized to send messages in this booking');
        }

        // ── Determine the receiver ──
        // Customer ↔ Technician. Admins send to the customer by default.
        let receiverId: string;
        if (isCustomer) {
          receiverId = order.technicianId ?? order.customerId;
        } else if (isTechnician) {
          receiverId = order.customerId;
        } else {
          // Admin → customer (fallback)
          receiverId = order.customerId;
        }

        // ── Persist to database ──
        const chat = await prisma.chat.create({
          data: {
            orderId: bookingId,
            senderId: userId,
            receiverId,
            message: content.trim(),
          },
        });

        // ── Build broadcast payload ──
        const messagePayload = {
          id: chat.id,
          bookingId,
          senderId: userId,
          senderRole: role,
          content: chat.message,
          timestamp: chat.createdAt.toISOString(),
        };

        // ── Broadcast to the booking room (including sender) ──
        const room = `booking_${bookingId}`;
        io.to(room).emit('new_message', messagePayload);

        console.log(`📨 [Socket] Message in ${room} from ${userId} — chatId=${chat.id}`);

        respond(true, 'Message sent', messagePayload);
      } catch (error) {
        console.error('[Socket] send_message error', error);
        respond(false, 'Internal server error while sending message');
      }
    },
  );
};
