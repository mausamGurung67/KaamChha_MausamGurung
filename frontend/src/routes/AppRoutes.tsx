import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';

// Import the pages
import Login from '../pages/auth/LoginForm';
import Register from '../pages/auth/RegisterForm';
import TechnicianRegister from '../pages/auth/TechnicianRegisterForm';
import OtpVerification from '../pages/auth/OtpVerificationForm';
import RoleSelection from '../pages/auth/RoleSelectionForm';
import NotFound from '../pages/public/NotFound';
import Home from '../pages/public/Home';
import Profile from '../pages/profile/Profile';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Home page as the landing page */}
      <Route path="/" element={<Home />} />

      {/* Profile page */}
      <Route path="/profile" element={<Profile />} />

      {/* Auth Routes wrapped in the Layout */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="register-technician" element={<TechnicianRegister />} />
        <Route path="otp-verify" element={<OtpVerification />} />
        <Route path="role-selection" element={<RoleSelection />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;