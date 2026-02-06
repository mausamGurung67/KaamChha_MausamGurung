import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { LayoutDashboard, ClipboardList, User } from 'lucide-react';
import type { NavItem } from '../layouts/DashboardLayout';

// Import the pages
import Login from '../pages/auth/LoginForm';
import Register from '../pages/auth/RegisterForm';
import TechnicianRegister from '../pages/auth/TechnicianRegisterForm';
import TechnicianKycUpload from '../pages/auth/TechnicianKycUpload';
import OtpVerification from '../pages/auth/OtpVerificationForm';
import RoleSelection from '../pages/auth/RoleSelectionForm';
import NotFound from '../pages/public/NotFound';
import Home from '../pages/public/Home';
import Profile from '../pages/profile/Profile';
import Unauthorized from '../pages/public/Unauthorized';
import AdminDashboard from '../pages/admin/AdminDashboard';
import TechnicianDashboard from '../pages/technician/TechnicianDashboard';

// Technician sidebar nav items
const technicianNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/technician/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'Service Requests',
    path: '/technician/requests',
    icon: <ClipboardList size={20} />,
  },
  {
    label: 'Profile',
    path: '/technician/profile',
    icon: <User size={20} />,
  },
];

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Home page as the landing page */}
      <Route path="/" element={<Home />} />

      {/* Profile page - accessible to all logged-in users */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      {/* Admin Routes - only accessible to ADMIN role */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Technician Routes - wrapped in DashboardLayout */}
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={['TECHNICIAN']}>
            <DashboardLayout navItems={technicianNavItems} title="Technician Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<TechnicianDashboard />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Unauthorized page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Auth Routes wrapped in the Layout */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="register-technician" element={<TechnicianRegister />} />
        <Route path="otp-verify" element={<OtpVerification />} />
        <Route
          path="technician-kyc"
          element={
            <ProtectedRoute allowedRoles={['TECHNICIAN']} redirectTo="/auth/login">
              <TechnicianKycUpload />
            </ProtectedRoute>
          }
        />
        <Route path="role-selection" element={<RoleSelection />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;