import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import cookie from 'cookie';
import { verifyAccessToken } from '../utils/jwt.util';
import prisma from '../config/database';
import { AuthenticatedSocket } from '../types/socket';

/**
 * Socket.IO authentication middleware.
 * Extracts the JWT access token from:
 *   1. socket.handshake.auth.token  (sent explicitly by the client)
 *   2. The "accessToken" cookie forwarded in the handshake headers
 *
 * On success, attaches `socket.user` with { userId, email, role }.
 */
export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void,
): Promise<void> => {
  try {
    // 1. Try auth payload first, then fall back to cookie
    let token: string | undefined =
      socket.handshake.auth?.token as string | undefined;

    if (!token) {
      const cookies = socket.handshake.headers.cookie;
      if (cookies) {
        const parsed = cookie.parse(cookies);
        token = parsed.accessToken;
      }
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // 2. Verify JWT
    const decoded = verifyAccessToken(token);

    // 3. Confirm user still exists & is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isLocked: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    if (!user.isActive) {
      return next(new Error('Account is deactivated'));
    }

    if (user.isLocked) {
      const now = new Date();
      if (!user.lockedUntil || user.lockedUntil > now) {
        return next(new Error('Account is temporarily locked'));
      }
    }

    // 4. Attach user info to socket
    (socket as AuthenticatedSocket).user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
};
