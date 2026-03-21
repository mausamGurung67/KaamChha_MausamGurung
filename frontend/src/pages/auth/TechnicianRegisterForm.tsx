import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
  sanitizePhone,
  type FieldErrors,
} from '../../utils/validator';
import '../../styles/auth.css';

const TechnicianRegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { registerTechnician, isLoading, error, clearError } = useAuth();

  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const validateField = (field: string, value: string) => {
    let err: string | null = null;
    switch (field) {
      case 'firstName':
        err = validateName(value, 'First name');
        break;
      case 'lastName':
        err = validateName(value, 'Last name');
        break;
      case 'email':
        err = validateEmail(value);
        break;
      case 'phone':
        err = validatePhone(value);
        break;
      case 'password':
        err = validatePassword(value);
        break;
      case 'confirmPassword':
        err = validateConfirmPassword(formData.password, value);
        break;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleChange = (field: string, value: string) => {
    const newValue = field === 'phone' ? sanitizePhone(value) : value;
    setFormData((prev) => ({ ...prev, [field]: newValue }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errors: FieldErrors = {};

    const firstName = validateName(formData.firstName, 'First name');
    if (firstName) errors.firstName = firstName;

    const lastName = validateName(formData.lastName, 'Last name');
    if (lastName) errors.lastName = lastName;

    const email = validateEmail(formData.email);
    if (email) errors.email = email;

    const phone = validatePhone(formData.phone);
    if (phone) errors.phone = phone;

    const password = validatePassword(formData.password);
    if (password) errors.password = password;

    const confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPassword) errors.confirmPassword = confirmPassword;

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setValidationError(firstError);
      toast.error(firstError);
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
      toast.success('Registration successful! Please verify your email.');
      navigate('/auth/otp-verify');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || error || 'Registration failed. Please try again.');
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
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => validateField('firstName', formData.firstName)}
            error={fieldErrors.firstName}
            required
          />
          <Input
            label="Last Name"
            placeholder="Enter your last name"
            wrapperStyle={{ flex: 1 }}
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => validateField('lastName', formData.lastName)}
            error={fieldErrors.lastName}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => validateField('email', formData.email)}
          error={fieldErrors.email}
          required
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="98XXXXXXXX"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          onBlur={() => validateField('phone', formData.phone)}
          error={fieldErrors.phone}
          maxLength={10}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password (min 8 characters)"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => validateField('password', formData.password)}
          error={fieldErrors.password}
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          onBlur={() => validateField('confirmPassword', formData.confirmPassword)}
          error={fieldErrors.confirmPassword}
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
