import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import TechnicianLayout from '../layouts/TechnicianLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleRedirect from '../components/common/RoleRedirect';
import { LayoutDashboard, Users, ShieldCheck, UserCog, User, Layers, UserCheck, ClipboardList, FileText, Star, BarChart3 } from 'lucide-react';
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
import Services from '../pages/public/Services';
import ServiceDetails from '../pages/public/ServiceDetails';
import Profile from '../pages/profile/Profile';
import Unauthorized from '../pages/public/Unauthorized';
import AboutUs from '../pages/public/AboutUs';
import TechnicianDashboard from '../pages/technician/TechnicianDashboard';
import TechnicianReviews from '../pages/technician/TechnicianReviews';

// Admin pages
import AdminDashboardHome from '../pages/admin/AdminDashboardHome';
import VerifyKYC from '../pages/admin/VerifyKYC';
import ManageTechnicians from '../pages/admin/ManageTechnicians';
import ManageServices from '../pages/admin/ManageServices';
import ManageCustomers from '../pages/admin/ManageCustomers';
import AdminBookings from '../pages/admin/AdminBookings';
import MyBookings from '../pages/customer/MyBookings';
import PostServiceRequest from '../pages/customer/PostServiceRequest';
import MyServiceRequests from '../pages/customer/MyServiceRequests';
import TechnicianBookings from '../pages/technician/TechnicianBookings';
import TechnicianServiceRequests from '../pages/technician/TechnicianServiceRequests';
import TechnicianEarnings from '../pages/technician/TechnicianEarnings';
import AdminServiceRequests from '../pages/admin/AdminServiceRequests';
import AdminReviews from '../pages/admin/AdminReviews';
import PlatformAnalytics from '../pages/admin/PlatformAnalytics';
import ChatPage from '../pages/chat/ChatPage';
import KhaltiCallback from '../pages/payment/KhaltiCallback';
import EsewaCallback from '../pages/payment/EsewaCallback';

// Admin sidebar nav items
const adminNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'Manage Technicians',
    icon: <Users size={20} />,
    children: [
      {
        label: 'Verify KYC',
        path: '/admin/technicians/verify-kyc',
        icon: <ShieldCheck size={18} />,
      },
      {
        label: 'All Technicians',
        path: '/admin/technicians/manage',
        icon: <UserCog size={18} />,
      },
    ],
  },
  {
    label: 'Manage Services',
    path: '/admin/services',
    icon: <Layers size={20} />,
  },
  {
    label: 'Manage Bookings',
    path: '/admin/bookings',
    icon: <ClipboardList size={20} />,
  },
  {
    label: 'Manage Customers',
    path: '/admin/customers',
    icon: <UserCheck size={20} />,
  },
  {
    label: 'Service Requests',
    path: '/admin/service-requests',
    icon: <FileText size={20} />,
  },
  {
    label: 'Reviews & Ratings',
    path: '/admin/reviews',
    icon: <Star size={20} />,
  },
  {
    label: 'Platform Analytics',
    path: '/admin/analytics',
    icon: <BarChart3 size={20} />,
  },
  {
    label: 'Profile',
    path: '/admin/profile',
    icon: <User size={20} />,
  },
];

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Home page as the landing page */}
      <Route path="/" element={<RoleRedirect><Home /></RoleRedirect>} />

      {/* Public service pages */}
      <Route path="/services" element={<RoleRedirect><Services /></RoleRedirect>} />
      <Route path="/services/:id" element={<RoleRedirect><ServiceDetails /></RoleRedirect>} />

      {/* About Us page */}
      <Route path="/about" element={<RoleRedirect><AboutUs /></RoleRedirect>} />

      {/* Profile page - accessible to all logged-in users */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />

      {/* Customer My Bookings page */}
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <MyBookings />
          </ProtectedRoute>
        }
      />

      {/* Customer Service Request pages */}
      <Route
        path="/post-service-request"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <PostServiceRequest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-service-requests"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <MyServiceRequests />
          </ProtectedRoute>
        }
      />

      {/* Khalti payment callback */}
      <Route
        path="/payment/khalti/callback"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <KhaltiCallback />
          </ProtectedRoute>
        }
      />

      {/* eSewa payment callback */}
      <Route
        path="/payment/esewa/callback"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <EsewaCallback />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - wrapped in DashboardLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout navItems={adminNavItems} title="Admin Dashboard" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardHome />} />
        <Route path="technicians/verify-kyc" element={<VerifyKYC />} />
        <Route path="technicians/manage" element={<ManageTechnicians />} />
        <Route path="services" element={<ManageServices />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="customers" element={<ManageCustomers />} />
        <Route path="service-requests" element={<AdminServiceRequests />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Technician Routes - wrapped in TechnicianLayout (KYC-gated sidebar) */}
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={['TECHNICIAN']}>
            <TechnicianLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<TechnicianDashboard />} />
        <Route path="requests" element={<TechnicianBookings />} />
        <Route path="customer-requests" element={<TechnicianServiceRequests />} />
        <Route path="earnings" element={<TechnicianEarnings />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="reviews" element={<TechnicianReviews />} />
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