import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { Request, Response } from 'express';

const router = Router();

router.post(
  '/image',
  authenticate,
  uploadSingle('image'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: (req.file as any).secure_url,
        publicId: (req.file as any).public_id,
      },
    });
  }
);

export default router;

