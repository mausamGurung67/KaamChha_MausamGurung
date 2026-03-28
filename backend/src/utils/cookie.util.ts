import { Response } from 'express';
import env from '../config/env';

const isProduction = env.NODE_ENV === 'production';

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  maxAge: number
): void => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax', // 'none' allows cross-domain cookies
    maxAge,
    path: '/',
  });
};

export const clearCookie = (res: Response, name: string): void => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};