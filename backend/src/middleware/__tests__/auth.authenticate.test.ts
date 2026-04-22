import { UserRole } from '@prisma/client';
import { authenticate } from '../auth.middleware';
import { verifyAccessToken } from '../../utils/jwt.util';
import prisma from '../../config/database';

jest.mock('../../utils/jwt.util', () => ({
  verifyAccessToken: jest.fn(),
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

type MockDb = {
  user: {
    findUnique: jest.Mock;
  };
};

const mockedVerifyAccessToken = verifyAccessToken as jest.MockedFunction<typeof verifyAccessToken>;
const mockedPrisma = prisma as unknown as MockDb;

const createRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when access token is missing', async () => {
    const req: any = { cookies: {}, headers: {} };
    const res = createRes();
    const next = jest.fn();

    await authenticate(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication required',
    });
  });

  it('should reject when token is invalid', async () => {
    const req: any = { cookies: {}, headers: { authorization: 'Bearer bad-token' } };
    const res = createRes();
    const next = jest.fn();

    mockedVerifyAccessToken.mockImplementation(() => {
      throw new Error('jwt invalid');
    });

    await authenticate(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid or expired token',
    });
  });

  it('should reject when user is deactivated', async () => {
    const req: any = { cookies: { accessToken: 'valid-token' }, headers: {} };
    const res = createRes();
    const next = jest.fn();

    mockedVerifyAccessToken.mockReturnValue({ userId: 'user-1' } as any);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'u1@example.com',
      role: UserRole.CUSTOMER,
      isActive: false,
      isLocked: false,
      lockedUntil: null,
    });

    await authenticate(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Account is deactivated',
    });
  });

  it('should reject when user account is locked', async () => {
    const req: any = { cookies: { accessToken: 'valid-token' }, headers: {} };
    const res = createRes();
    const next = jest.fn();

    mockedVerifyAccessToken.mockReturnValue({ userId: 'user-2' } as any);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      email: 'u2@example.com',
      role: UserRole.TECHNICIAN,
      isActive: true,
      isLocked: true,
      lockedUntil: new Date(Date.now() + 60 * 1000),
    });

    await authenticate(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Account is locked',
    });
  });

  it('should attach user context and call next when token is valid', async () => {
    const req: any = { cookies: {}, headers: { authorization: 'Bearer valid-token' } };
    const res = createRes();
    const next = jest.fn();

    mockedVerifyAccessToken.mockReturnValue({ userId: 'user-3' } as any);
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'user-3',
      email: 'u3@example.com',
      role: UserRole.ADMIN,
      isActive: true,
      isLocked: false,
      lockedUntil: null,
    });

    await authenticate(req, res as any, next);

    expect(req.userId).toBe('user-3');
    expect(req.userEmail).toBe('u3@example.com');
    expect(req.userRole).toBe(UserRole.ADMIN);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
