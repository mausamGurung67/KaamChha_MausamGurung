import { Response } from 'express';
import env from '../config/env';

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  maxAge: number
): void => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
  });
};

export const clearCookie = (res: Response, name: string): void => {
  res.clearCookie(name, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};