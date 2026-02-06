import resend from '../config/resend';
import env from '../config/env';

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });
};

export const sendOTPEmail = async (email: string, code: string, type: string): Promise<void> => {
  const subject = type === 'EMAIL_VERIFICATION' 
    ? 'Verify Your Email Address' 
    : type === 'PASSWORD_RESET'
    ? 'Reset Your Password'
    : 'Your Login OTP';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${subject}</h2>
      <p>Your OTP code is:</p>
      <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 4px; text-align: center;">
        ${code}
      </h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject,
    html,
  });
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Home Service!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for joining Home Service. We're excited to have you on board!</p>
      <p>Get started by exploring our services and booking your first appointment.</p>
    </div>
  `;

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Welcome to Home Service',
    html,
  });
};

