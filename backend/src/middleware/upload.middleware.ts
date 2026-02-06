import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Use memory storage instead of cloudinary storage
// Files will be uploaded to cloudinary via the cloudinary.service.ts
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

export const uploadSingle = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message,
        });
        return;
      }
      next();
    });
  };
};

export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.array(fieldName, maxCount)(req, res, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message,
        });
        return;
      }
      next();
    });
  };
};

export const uploadFields = (fields: Array<{ name: string; maxCount?: number }>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.fields(fields)(req, res, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message,
        });
        return;
      }
      next();
    });
  };
};

