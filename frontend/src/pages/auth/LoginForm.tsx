import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await login({ email: formData.email, password: formData.password });
      // If login successful, check if email is verified
      navigate('/'); // or dashboard
    } catch {
      // Error is handled by AuthContext
    }
  };

  return (
    <div className="auth-form-container">
      <div style={{ textAlign: 'right', marginBottom: '40px', fontSize: '14px' }}>
        <span style={{ color: '#666' }}>Don't have an account? </span>
        <Link to="/auth/role-selection" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
          Register
        </Link>
        <span style={{ color: 'var(--primary-color)' }}> to start your journey with us!</span>
      </div>

      <h2 className="auth-title">Sign in to your account</h2>

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

      <form onSubmit={handleSubmit}>
        <Input 
          label="Email" 
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        
        <Input 
          label="Password" 
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
           <Link to="/auth/forgot-password" style={{ color: 'var(--primary-color)', fontSize: '14px' }}>
             Forgot your password?
           </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button type="submit" isLoading={isLoading} style={{ minWidth: '120px' }}>
            Log in
          </Button>
          
          <Link to="/" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>
            Back
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;