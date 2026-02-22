import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { verifyEsewaPayment } from '../../services/payment.service';

type VerificationState = 'loading' | 'success' | 'failed';

const EsewaCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const verifiedRef = useRef(false);

  useEffect(() => {
    // eSewa redirects back with a base64-encoded `data` query param on success
    // On failure, it redirects to failure_url with ?status=failed&orderId=...
    const encodedData = searchParams.get('data');
    const failStatus = searchParams.get('status');

    // Handle failure redirect
    if (failStatus === 'failed') {
      setState('failed');
      setMessage('Payment was cancelled or failed. You can try again from your bookings.');
      return;
    }

    if (!encodedData) {
      setState('failed');
      setMessage('Missing payment information. Please try again.');
      return;
    }

    // Decode the base64 response to extract orderId (transaction_uuid)
    let orderId = '';
    try {
      const decoded = JSON.parse(atob(encodedData));
      orderId = decoded.transaction_uuid || '';
    } catch {
      setState('failed');
      setMessage('Invalid payment response data.');
      return;
    }

    if (!orderId) {
      setState('failed');
      setMessage('Missing order information in payment response.');
      return;
    }

    // Only verify once (StrictMode can double-invoke)
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      try {
        const res = await verifyEsewaPayment(encodedData, orderId);
        if (res.success && res.data) {
          setState('success');
          setMessage('Payment completed successfully!');
          setOrderData(res.data.order);
        } else {
          setState('failed');
          setMessage(res.message || 'Payment verification failed.');
        }
      } catch (err: any) {
        setState('failed');
        setMessage(
          err?.response?.data?.message || 'Payment verification failed. Please contact support.'
        );
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-lg mx-auto">
          {/* Loading */}
          {state === 'loading' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
              <Loader2 size={48} className="text-green-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Verifying Payment</h2>
              <p className="text-gray-500 mt-2">
                Please wait while we confirm your payment with eSewa...
              </p>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center">
                <CheckCircle size={56} className="text-white mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
                <p className="text-green-100 mt-1 text-sm">{message}</p>
              </div>

              {orderData && (
                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Service</span>
                      <span className="font-medium text-gray-900">
                        {orderData.service?.name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-semibold text-green-600">
                        NPR {Number(orderData.totalAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="inline-flex items-center gap-1 font-medium text-green-700">
                        <CreditCard size={14} /> eSewa
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-mono text-xs text-gray-600">
                        {orderData.paymentId || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Booking ID</span>
                      <span className="font-mono text-xs text-gray-600">
                        {orderData.id?.slice(-8) || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to="/my-bookings"
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition text-sm"
                    >
                      <ArrowLeft size={16} />
                      My Bookings
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Failed */}
          {state === 'failed' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-rose-500 p-8 text-center">
                <XCircle size={56} className="text-white mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white">Payment Failed</h2>
                <p className="text-red-100 mt-1 text-sm">{message}</p>
              </div>

              <div className="p-6">
                <div className="flex gap-3">
                  <Link
                    to="/my-bookings"
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition text-sm"
                  >
                    <ArrowLeft size={16} />
                    Back to Bookings
                  </Link>
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">
                  If you were charged, the amount will be refunded automatically. Contact support if the issue persists.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EsewaCallback;
