import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email().default('noreply@example.com'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  MAX_OTP_ATTEMPTS: z.string().default('5'),
  MAX_LOGIN_ATTEMPTS: z.string().default('5'),
  ACCOUNT_LOCKOUT_DURATION: z.string().default('1800000'),
  COMMISSION_RATE_TECHNICIAN: z.string().default('0.8'),
  COMMISSION_RATE_PLATFORM: z.string().default('0.2'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  KHALTI_SECRET_KEY: z.string().min(1),
  KHALTI_GATEWAY_URL: z.string().url().default('https://a.khalti.com/api/v2'),
  KHALTI_WEBSITE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  } else {
    throw error;
  }
}

export default env;