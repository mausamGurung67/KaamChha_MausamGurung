import React from 'react';
import { PartyPopper, CreditCard, X } from 'lucide-react';

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
        <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition text-white/80 hover:text-white"
          >
            <X size={18} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Congratulations! 🎉</h3>
          <p className="text-green-100 text-sm mt-2">
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
            <button
              onClick={onPayNow}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition"
            >
              <CreditCard size={18} />
              Pay Now
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium rounded-xl transition text-sm hover:bg-gray-50"
            >
              I'll pay later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionSuccessModal;
