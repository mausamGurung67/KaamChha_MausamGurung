import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ClipboardList, User, MessageSquare, Star, FileText } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import type { NavItem } from './DashboardLayout';
import * as technicianService from '../services/technician.service';

const allNavItems: NavItem[] = [
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
    label: 'Customer Requests',
    path: '/technician/customer-requests',
    icon: <FileText size={20} />,
  },
  {
    label: 'Chat',
    path: '/technician/chat',
    icon: <MessageSquare size={20} />,
  },
  {
    label: 'Reviews',
    path: '/technician/reviews',
    icon: <Star size={20} />,
  },
  {
    label: 'Profile',
    path: '/technician/profile',
    icon: <User size={20} />,
  },
];

const restrictedNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/technician/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
];

const TechnicianLayout: React.FC = () => {
  const [kycApproved, setKycApproved] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKyc = async () => {
      try {
        const response = await technicianService.getDashboard();
        if (response.success && response.data) {
          setKycApproved(response.data.stats.kycStatus === 'APPROVED');
        } else {
          setKycApproved(false);
        }
      } catch {
        setKycApproved(false);
      }
    };
    checkKyc();
  }, []);

  // While checking KYC, show restricted nav (only Dashboard)
  const navItems = kycApproved ? allNavItems : restrictedNavItems;

  return <DashboardLayout navItems={navItems} title="Technician Dashboard" />;
};

export default TechnicianLayout;
