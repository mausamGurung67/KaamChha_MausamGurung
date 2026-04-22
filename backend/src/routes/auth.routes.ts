import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOTPSchema,
  refreshTokenSchema,
  // googleLoginSchema, // TODO: Enable when google service is implemented
  resetPasswordSchema,
  forgotPasswordSchema,
} from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
// router.post('/google', validate(googleLoginSchema), authController.googleLogin);
router.post('/verify-email', authenticate, validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-otp', authenticate, validate(resendOTPSchema), authController.resendOTP);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authenticate, validate(resetPasswordSchema), authController.resetPassword);

export default router;

