import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { STORAGE_KEYS, OTP_RESEND_COOLDOWN } from '../../utils/constants';

const OtpVerification: React.FC = () => {
  const navigate = useNavigate();
  const { verifyEmail, resendOTP, isLoading, error, clearError, user } = useAuth();
  
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get the email being verified
  const pendingEmail = localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL) || user?.email || '';
  const maskedEmail = pendingEmail 
    ? pendingEmail.replace(/(.{2})(.*)(@.*)/, '$1*****$3')
    : '***@***.com';

  // Redirect if already verified
  useEffect(() => {
    if (user?.isEmailVerified) {
      const target = user.role === 'TECHNICIAN' ? '/auth/technician-kyc' : '/';
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    clearError();

    // Focus next input
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(new Array(6 - pastedData.length).fill(''));
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      return;
    }

    clearError();
    try {
      await verifyEmail(otpCode);
      setSuccessMessage('Email verified successfully! Redirecting...');
      setTimeout(() => {
        const target = user?.role === 'TECHNICIAN' ? '/auth/technician-kyc' : '/';
        navigate(target, { replace: true });
      }, 1200);
    } catch {
      // Error is handled by AuthContext
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    clearError();
    try {
      await resendOTP('EMAIL_VERIFICATION');
      setResendCooldown(OTP_RESEND_COOLDOWN);
      setSuccessMessage('OTP sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-title" style={{ color: 'var(--primary-color)' }}>Verify Your Account</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Enter the 6-digit code we've sent you at {maskedEmail}.
      </p>

      {error && (
        <div className="error-message" style={{ 
          color: '#dc2626', 
          backgroundColor: '#fef2f2', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{ 
          color: '#059669', 
          backgroundColor: '#ecfdf5', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {successMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }} onPaste={handlePaste}>
        {otp.map((data, index) => (
          <input
            className="otp-input"
            key={index}
            type="text"
            maxLength={1}
            value={data}
            ref={(el) => { inputRefs.current[index] = el }}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={(e) => e.target.select()}
            disabled={isLoading}
          />
        ))}
      </div>

      <div style={{ marginBottom: '24px', fontSize: '14px' }}>
        <span style={{ color: '#333' }}>Didn't receive code? </span>
        <button 
          className="btn-text" 
          style={{ fontWeight: 600 }}
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend again'}
        </button>
      </div>

      <Button 
        onClick={handleVerify} 
        isLoading={isLoading}
        disabled={otp.join('').length !== 6}
        style={{ width: '120px' }}
      >
        Verify
      </Button>

      <p style={{ marginTop: '24px', fontSize: '14px' }}>
        Already have an account? <Link to="/auth/login" style={{ color: 'var(--primary-color)' }}>Log in</Link>
      </p>
    </div>
  );
};

export default OtpVerification;