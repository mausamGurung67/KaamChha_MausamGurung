import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth.types';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');

    // Validation
    if (!agreed) {
      setValidationError('Please accept terms and conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
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
      navigate('/auth/otp-verify');
    } catch {
      // Error is handled by AuthContext
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
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            required
          />
          <Input 
            label="Last Name" 
            placeholder="Enter your last name" 
            wrapperStyle={{ flex: 1 }}
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            required
          />
        </div>

        <Input 
          label="Email" 
          type="email" 
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <Input 
          label="Password" 
          type="password" 
          placeholder="Enter your password (min 8 characters)"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        <Input 
          label="Confirm Password" 
          type="password" 
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          required
        />

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <input 
            type="checkbox" 
            id="terms" 
            checked={agreed} 
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', marginRight: '8px' }}
          />
          <label htmlFor="terms" style={{ fontSize: '14px', color: '#333' }}>
            I accept the <span style={{ color: 'var(--primary-color)' }}>Terms and Conditions</span> & <span style={{ color: 'var(--primary-color)' }}>Privacy Policy</span>.
          </label>
        </div>

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