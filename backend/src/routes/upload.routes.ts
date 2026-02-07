import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadSingle } from '../middleware/upload.middleware';
import { uploadFromBuffer } from '../services/cloudinary.service';
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

    try {
      // Support a folder query param, default to 'general'
      const folder = (req.query.folder as string) || 'general';
      const result = await uploadFromBuffer(req.file.buffer, folder);

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.url,
          publicId: result.publicId,
        },
      });
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image to cloud storage',
      });
    }
  }
);

export default router;

