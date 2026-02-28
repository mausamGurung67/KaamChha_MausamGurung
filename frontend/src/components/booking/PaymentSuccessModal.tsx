import React from 'react';
import { CheckCircle, Star, X } from 'lucide-react';
import Button from '../common/Button';

interface PaymentSuccessModalProps {
  serviceName: string;
  amount: number;
  paymentMethod: string;
  onLeaveReview: () => void;
  onClose: () => void;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  serviceName,
  amount,
  paymentMethod,
  onLeaveReview,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition text-white/80 hover:text-white"
          >
            <X size={18} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Payment Successful! ✅</h3>
          <p className="text-green-100 text-sm mt-2">
            Thank you for your payment.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Service</span>
              <span className="font-medium text-gray-900">{serviceName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-semibold text-green-600">NPR {Number(amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">{paymentMethod}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Would you like to leave a review for the technician? Your feedback helps others find great service.
          </p>

          <div className="space-y-2">
            <Button variant="primary" size="lg" fullWidth onClick={onLeaveReview}>
              <Star size={18} />
              Leave Review
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={onClose}>
              Maybe later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
