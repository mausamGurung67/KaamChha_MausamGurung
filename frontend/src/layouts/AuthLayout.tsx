import React from 'react';
import { Outlet } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import illustration from '../assets/images/auth-illustration.png';
import '../styles/auth.css'; // We will create this next

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-container">
      {/* Left Side: Logo & Illustration */}
      <div className="auth-left">
        <div className="logo-container">
          <img src={logo} alt="Kaam Chha Logo" className="logo" />
        </div>
        <div className="illustration-container">
          <img src={illustration} alt="Kaam Chha Illustration" className="illustration" />
        </div>
      </div>

      {/* Right Side: Dynamic Form Content */}
      <div className="auth-right">
        <div className="auth-content">
          <Outlet /> {/* This is where Login/Register/OTP pages will render */}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;