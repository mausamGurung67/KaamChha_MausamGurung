import { OrderStatus, UserRole } from '@prisma/client';
import prisma from '../../config/database';
import { registerBookingHandlers } from '../booking.socket';

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    order: {
      findUnique: jest.fn(),
    },
    chat: {
      create: jest.fn(),
    },
  },
}));

type MockDb = {
  order: {
    findUnique: jest.Mock;
  };
  chat: {
    create: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

const createSocketHarness = (role: UserRole = UserRole.CUSTOMER, userId = 'customer-1') => {
  const handlers: Record<string, (...args: any[]) => any> = {};
  const roomEmitter = { emit: jest.fn() };

  const socket: any = {
    id: 'socket-1',
    user: {
      userId,
      email: 'user@example.com',
      role,
    },
    on: jest.fn((event: string, handler: (...args: any[]) => any) => {
      handlers[event] = handler;
    }),
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn(() => roomEmitter),
  };

  return { socket, handlers };
};

const createIoHarness = () => {
  const roomEmitter = { emit: jest.fn() };
  const io: any = {
    to: jest.fn(() => roomEmitter),
  };
  return { io, roomEmitter };
};

describe('booking.socket send_message logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate empty message content', async () => {
    const { io } = createIoHarness();
    const { socket, handlers } = createSocketHarness();

    registerBookingHandlers(io, socket);

    const callback = jest.fn();
    await handlers.send_message({ bookingId: 'order-1', message: '   ' }, callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'message content is required',
      })
    );
    expect(mockedPrisma.order.findUnique).not.toHaveBeenCalled();
    expect(mockedPrisma.chat.create).not.toHaveBeenCalled();
    expect(io.to).not.toHaveBeenCalled();
  });

  it('should send valid message and persist chat', async () => {
    const { io } = createIoHarness();
    const { socket, handlers } = createSocketHarness(UserRole.CUSTOMER, 'customer-1');

    registerBookingHandlers(io, socket);

    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.IN_PROGRESS,
      customerId: 'customer-1',
      technicianId: 'tech-1',
    });
    mockedPrisma.chat.create.mockResolvedValue({
      id: 'chat-1',
      message: 'Hello technician',
      createdAt: new Date('2026-04-04T09:30:00.000Z'),
    });

    const callback = jest.fn();
    await handlers.send_message({ bookingId: 'order-1', message: '  Hello technician  ' }, callback);

    expect(mockedPrisma.chat.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        senderId: 'customer-1',
        receiverId: 'tech-1',
        message: 'Hello technician',
      },
    });

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Message sent',
        data: expect.objectContaining({
          id: 'chat-1',
          bookingId: 'order-1',
          senderId: 'customer-1',
          senderRole: UserRole.CUSTOMER,
          content: 'Hello technician',
        }),
      })
    );
  });

  it('should trigger new_message event for real-time booking room subscribers', async () => {
    const { io, roomEmitter } = createIoHarness();
    const { socket, handlers } = createSocketHarness(UserRole.TECHNICIAN, 'tech-9');

    registerBookingHandlers(io, socket);

    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-9',
      status: OrderStatus.ACCEPTED,
      customerId: 'customer-9',
      technicianId: 'tech-9',
    });
    mockedPrisma.chat.create.mockResolvedValue({
      id: 'chat-9',
      message: 'On my way',
      createdAt: new Date('2026-04-04T09:45:00.000Z'),
    });

    await handlers.send_message({ bookingId: 'order-9', message: 'On my way' }, jest.fn());

    expect(io.to).toHaveBeenCalledWith('booking_order-9');
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      'new_message',
      expect.objectContaining({
        id: 'chat-9',
        bookingId: 'order-9',
        senderId: 'tech-9',
        senderRole: UserRole.TECHNICIAN,
        content: 'On my way',
      })
    );
  });

  it('should reject message when booking is not found', async () => {
    const { io } = createIoHarness();
    const { socket, handlers } = createSocketHarness(UserRole.CUSTOMER, 'customer-404');

    registerBookingHandlers(io, socket);
    mockedPrisma.order.findUnique.mockResolvedValue(null);

    const callback = jest.fn();
    await handlers.send_message({ bookingId: 'missing-order', message: 'Hello?' }, callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Booking not found',
      })
    );
    expect(mockedPrisma.chat.create).not.toHaveBeenCalled();
  });

  it('should reject message when sender is not part of booking', async () => {
    const { io } = createIoHarness();
    const { socket, handlers } = createSocketHarness(UserRole.CUSTOMER, 'intruder-user');

    registerBookingHandlers(io, socket);
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-sec-1',
      status: OrderStatus.IN_PROGRESS,
      customerId: 'real-customer',
      technicianId: 'real-tech',
    });

    const callback = jest.fn();
    await handlers.send_message({ bookingId: 'order-sec-1', message: 'I should not send this' }, callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'You are not authorized to send messages in this booking',
      })
    );
    expect(mockedPrisma.chat.create).not.toHaveBeenCalled();
  });
});