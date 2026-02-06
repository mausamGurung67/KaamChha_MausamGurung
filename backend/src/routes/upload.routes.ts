import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { Request, Response } from 'express';
import { uploadFromBuffer } from '../services/cloudinary.service';

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
    const { secureUrl, publicId } = await uploadFromBuffer(req.file.buffer, 'uploads');

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: secureUrl,
        publicId,
      },
    });
  }
);

export default router;

