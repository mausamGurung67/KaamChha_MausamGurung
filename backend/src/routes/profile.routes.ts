import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { z } from 'zod';
import prisma from '../config/database';

const router = Router();

router.use(authenticate);

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

// GET /api/profile - get current user's profile
router.get('/', async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    include: {
      profile: true,
      kyc: true,
      _count: {
        select: {
          orders: true,
          technicianOrders: true,
          createdServices: true,
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const { password, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: { profile: userWithoutPassword },
  });
});

// PATCH /api/profile - update current user's profile
router.patch('/', validate(updateProfileSchema), async (req: Request, res: Response): Promise<void> => {
  const { name, phone, address, avatar } = req.body;

  const profile = await prisma.profile.upsert({
    where: { userId: req.userId! },
    update: { name, phone, address, avatar },
    create: { userId: req.userId!, name, phone, address, avatar },
  });

  // Also update the user record if needed (for consistency)
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { profile },
  });
});

export default router;
