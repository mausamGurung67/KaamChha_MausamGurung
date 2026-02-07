import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RoleRedirectProps {
  children: React.ReactNode;
}

/**
 * Wraps public routes (Home, Services, About, etc.)
 * - Non-authenticated users: allowed through
 * - CUSTOMER: allowed through
 * - ADMIN: redirected to /admin/dashboard
 * - TECHNICIAN: redirected to /technician/dashboard
 */
const RoleRedirect: React.FC<RoleRedirectProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // While loading auth state, render children to avoid flash
  if (isLoading) return <>{children}</>;

  // Not logged in or customer — allow access
  if (!user || user.role === 'CUSTOMER') {
    return <>{children}</>;
  }

  // Admin — redirect to admin dashboard
  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Technician — redirect to technician dashboard
  if (user.role === 'TECHNICIAN') {
    return <Navigate to="/technician/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleRedirect;
