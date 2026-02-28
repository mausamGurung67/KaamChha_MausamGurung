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
        <div className="relative p-6 pb-4 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Payment Successful!</h3>
          <p className="text-gray-500 text-sm mt-1">
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
