import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File & {
        secure_url?: string;
        public_id?: string;
      };
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[];
    }
  }
}

export {};

