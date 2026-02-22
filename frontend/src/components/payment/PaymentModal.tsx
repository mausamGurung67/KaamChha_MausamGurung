import React, { useState, useRef } from 'react';
import { X, CreditCard, Loader2, Shield, ExternalLink } from 'lucide-react';
import { initiateKhaltiPayment, initiateEsewaPayment } from '../../services/payment.service';

interface PaymentModalProps {
  orderId: string;
  amount: number;
  serviceName: string;
  onClose: () => void;
  onPaymentInitiated?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  orderId,
  amount,
  serviceName,
  onClose,
  onPaymentInitiated,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'KHALTI' | 'ESEWA' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const esewaFormRef = useRef<HTMLFormElement>(null);

  const handlePay = async () => {
    if (!selectedMethod) return;

    setLoading(true);
    setError('');

    try {
      if (selectedMethod === 'KHALTI') {
        const res = await initiateKhaltiPayment(orderId);

        if (res.success && res.data) {
          onPaymentInitiated?.();
          window.location.href = res.data.payment_url;
        } else {
          setError(res.message || 'Failed to initiate payment');
        }
      } else if (selectedMethod === 'ESEWA') {
        const res = await initiateEsewaPayment(orderId);

        if (res.success && res.data) {
          onPaymentInitiated?.();
          // eSewa requires a form POST submission — build and auto-submit a hidden form
          const form = esewaFormRef.current;
          if (form) {
            form.action = res.data.payment_url;
            // Clear any existing hidden inputs
            form.innerHTML = '';
            // Add each formData field as a hidden input
            Object.entries(res.data.formData).forEach(([key, value]) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = value;
              form.appendChild(input);
            });
            form.submit();
          }
        } else {
          setError(res.message || 'Failed to initiate payment');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Hidden form for eSewa POST redirect */}
      <form ref={esewaFormRef} method="POST" style={{ display: 'none' }} />

      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Make Payment</h3>
            <p className="text-sm text-gray-500 mt-0.5">{serviceName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Amount */}
        <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-amber-50">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            NPR {Number(amount).toLocaleString()}
          </p>
        </div>

        {/* Payment Methods */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>

          {/* Khalti */}
          <button
            onClick={() => { setSelectedMethod('KHALTI'); setError(''); }}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
              selectedMethod === 'KHALTI'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900">Khalti</p>
              <p className="text-xs text-gray-500">Pay with Khalti Digital Wallet</p>
            </div>
            {selectedMethod === 'KHALTI' && (
              <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>

          {/* eSewa */}
          <button
            onClick={() => { setSelectedMethod('ESEWA'); setError(''); }}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
              selectedMethod === 'ESEWA'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">e</span>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-gray-900">eSewa</p>
              <p className="text-xs text-gray-500">Pay with eSewa Wallet</p>
            </div>
            {selectedMethod === 'ESEWA' && (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handlePay}
            disabled={!selectedMethod || loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Redirecting to {selectedMethod === 'KHALTI' ? 'Khalti' : 'eSewa'}...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Pay NPR {Number(amount).toLocaleString()}
                {selectedMethod && <ExternalLink size={14} className="ml-1" />}
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Shield size={12} />
            <span>Secure payment powered by {selectedMethod === 'KHALTI' ? 'Khalti' : selectedMethod === 'ESEWA' ? 'eSewa' : 'Digital Wallet'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
