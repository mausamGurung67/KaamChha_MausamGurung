import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth.types';
import toast from 'react-hot-toast';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  type FieldErrors,
} from '../../utils/validator';
import '../../styles/auth.css';

interface LocationState {
  role?: 'customer' | 'technician';
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isLoading, error, clearError } = useAuth();
  
  // Get role from navigation state
  const state = location.state as LocationState;
  const selectedRole: UserRole = state?.role === 'technician' ? 'TECHNICIAN' : 'CUSTOMER';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Validate all fields
    const errors: FieldErrors = {};

    const firstName = validateName(formData.firstName, 'First name');
    if (firstName) errors.firstName = firstName;

    const lastName = validateName(formData.lastName, 'Last name');
    if (lastName) errors.lastName = lastName;

    const email = validateEmail(formData.email);
    if (email) errors.email = email;

    const password = validatePassword(formData.password);
    if (password) errors.password = password;

    const confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmPassword) errors.confirmPassword = confirmPassword;

    if (!agreed) {
      errors.terms = 'Please accept terms and conditions';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setValidationError(firstError);
      toast.error(firstError);
      return;
    }

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        role: selectedRole,
      });
      // Navigate to OTP verification after successful registration
      toast.success('Registration successful! Please verify your email.');
      navigate('/auth/otp-verify');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || error || 'Registration failed. Please try again.');
    }
  };

  const displayError = validationError || error;

  return (
    <div className="auth-form-container">
      <h2 className="auth-title">Create Your Account</h2>
      <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
        Registering as a <strong>{selectedRole === 'TECHNICIAN' ? 'Technician' : 'Customer'}</strong>
      </p>

      {displayError && (
        <div className="error-message" style={{ 
          color: '#dc2626', 
          backgroundColor: '#fef2f2', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          fontSize: '14px'
        }}>
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

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: fieldErrors.terms ? '8px' : '24px' }}>
          <input 
            type="checkbox" 
            id="terms" 
            checked={agreed} 
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.terms;
                  return next;
                });
              }
            }}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', marginRight: '8px' }}
          />
          <label htmlFor="terms" style={{ fontSize: '14px', color: '#333' }}>
            I accept the <span style={{ color: 'var(--primary-color)' }}>Terms and Conditions</span> & <span style={{ color: 'var(--primary-color)' }}>Privacy Policy</span>.
          </label>
        </div>
        {fieldErrors.terms && (
          <p style={{ color: '#dc2626', fontSize: '12px', marginBottom: '16px', marginTop: '-4px' }}>{fieldErrors.terms}</p>
        )}

        <Button type="submit" isLoading={isLoading} style={{ width: '120px' }}>
          Continue
        </Button>

        <p style={{ marginTop: '24px', fontSize: '14px' }}>
          Already have an account? <Link to="/auth/login" style={{ color: 'var(--primary-color)' }}>Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;