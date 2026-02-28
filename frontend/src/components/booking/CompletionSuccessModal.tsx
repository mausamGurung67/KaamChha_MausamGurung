import React from 'react';
import { CheckCircle, CreditCard, X } from 'lucide-react';
import Button from '../common/Button';

interface CompletionSuccessModalProps {
  serviceName: string;
  amount: number;
  onPayNow: () => void;
  onClose: () => void;
}

const CompletionSuccessModal: React.FC<CompletionSuccessModalProps> = ({
  serviceName,
  amount,
  onPayNow,
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
          <h3 className="text-lg font-bold text-gray-900">Job Completed!</h3>
          <p className="text-gray-500 text-sm mt-1">
            The work has been marked as completed successfully.
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Service</p>
            <p className="text-sm font-semibold text-gray-900">{serviceName}</p>
            <p className="text-xs text-gray-500 mt-3 mb-1">Amount Due</p>
            <p className="text-2xl font-bold text-gray-900">
              NPR {Number(amount).toLocaleString()}
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can proceed to make the payment now, or do it later from your bookings.
          </p>

          <div className="space-y-2">
            <Button variant="primary" size="lg" fullWidth onClick={onPayNow}>
              <CreditCard size={18} />
              Pay Now
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={onClose}>
              I'll pay later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionSuccessModal;
