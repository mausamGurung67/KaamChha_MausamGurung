import { UserRole } from '@prisma/client';
import { Socket } from 'socket.io';

export interface SocketUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedSocket extends Socket {
  user: SocketUser;
}
