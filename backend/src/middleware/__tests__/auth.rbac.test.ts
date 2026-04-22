import { UserRole } from '@prisma/client';
import { authorize } from '../auth.middleware';

const createRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json };
};

describe('role-based access control (authorize middleware)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow admin to access admin features', () => {
    const req: any = { userRole: UserRole.ADMIN };
    const res = createRes();
    const next = jest.fn();

    const middleware = authorize(UserRole.ADMIN);
    middleware(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block customer from accessing admin features', () => {
    const req: any = { userRole: UserRole.CUSTOMER };
    const res = createRes();
    const next = jest.fn();

    const middleware = authorize(UserRole.ADMIN);
    middleware(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Insufficient permissions',
    });
  });

  it('should block technician from performing admin actions', () => {
    const req: any = { userRole: UserRole.TECHNICIAN };
    const res = createRes();
    const next = jest.fn();

    const middleware = authorize(UserRole.ADMIN);
    middleware(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Insufficient permissions',
    });
  });

  it('should require authentication when userRole is missing', () => {
    const req: any = {};
    const res = createRes();
    const next = jest.fn();

    const middleware = authorize(UserRole.ADMIN);
    middleware(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Authentication required',
    });
  });

  it('should allow user when role is in allowed role list', () => {
    const req: any = { userRole: UserRole.TECHNICIAN };
    const res = createRes();
    const next = jest.fn();

    const middleware = authorize(UserRole.ADMIN, UserRole.TECHNICIAN);
    middleware(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});