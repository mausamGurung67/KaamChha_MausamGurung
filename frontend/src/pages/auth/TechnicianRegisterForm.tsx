import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/auth.css';

const TechnicianRegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { registerTechnician, isLoading, error, clearError } = useAuth();

  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const validate = (): boolean => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setValidationError('Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      setValidationError('Please enter your email');
      return false;
    }
    if (!formData.phone.trim()) {
      setValidationError('Please enter your phone number');
      return false;
    }
    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!validate()) return;

    try {
      await registerTechnician({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'TECHNICIAN',
      });
      navigate('/auth/otp-verify');
    } catch {
      // handled in context
    }
  };

  const displayError = validationError || error;

  return (
    <div className="auth-form-container">
      <div className="step-indicator">
        <div className="step active">
          <span className="step-number">1</span>
          <span className="step-label">Account</span>
        </div>
        <div className="step-line"></div>
        <div className="step">
          <span className="step-number">2</span>
          <span className="step-label">Verify OTP</span>
        </div>
        <div className="step-line"></div>
        <div className="step">
          <span className="step-number">3</span>
          <span className="step-label">Upload KYC</span>
        </div>
      </div>

      <h2 className="auth-title">Create Your Technician Account</h2>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Start with your basic details. After verifying your email, you'll upload your KYC documents.
      </p>

      {displayError && (
        <div
          className="error-message"
          style={{
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {displayError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Input
            label="First Name"
            placeholder="Enter your first name"
            wrapperStyle={{ flex: 1 }}
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            placeholder="Enter your last name"
            wrapperStyle={{ flex: 1 }}
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password (min 8 characters)"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />

        <Button type="submit" isLoading={isLoading} style={{ width: '140px' }}>
          Continue to OTP
        </Button>
      </form>

      <p style={{ marginTop: '24px', fontSize: '14px' }}>
        Already have an account?{' '}
        <Link to="/auth/login" style={{ color: 'var(--primary-color)' }}>
          Log in
        </Link>
      </p>
    </div>
  );
};

export default TechnicianRegisterForm;
