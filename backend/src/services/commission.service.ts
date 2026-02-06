import env from '../config/env';

export interface CommissionCalculation {
  totalAmount: number;
  technicianAmount: number;
  platformAmount: number;
  commissionRate: number;
}

export const calculateCommission = (totalAmount: number): CommissionCalculation => {
  const technicianRate = parseFloat(env.COMMISSION_RATE_TECHNICIAN);
  const platformRate = parseFloat(env.COMMISSION_RATE_PLATFORM);

  const technicianAmount = totalAmount * technicianRate;
  const platformAmount = totalAmount * platformRate;

  return {
    totalAmount,
    technicianAmount: Math.round(technicianAmount * 100) / 100,
    platformAmount: Math.round(platformAmount * 100) / 100,
    commissionRate: technicianRate,
  };
};

