import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PaymentSuccessModal from '../../components/booking/PaymentSuccessModal';
import ReviewModal from '../../components/review/ReviewModal';
import { verifyKhaltiPayment } from '../../services/payment.service';
import toast from 'react-hot-toast';

type VerificationState = 'loading' | 'success' | 'failed';
type FlowStep = 'payment-success' | 'review' | 'done';

const KhaltiCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>('loading');
  const [message, setMessage] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('payment-success');
  const verifiedRef = useRef(false);

  useEffect(() => {
    const pidx = searchParams.get('pidx');
    const orderId = searchParams.get('purchase_order_id');
    const khaltiStatus = searchParams.get('status');

    if (!pidx || !orderId) {
      setState('failed');
      setMessage('Missing payment information. Please try again.');
      toast.error('Missing payment information. Please try again.');
      return;
    }

    if (khaltiStatus && khaltiStatus !== 'Completed') {
      setState('failed');
      const failMsg = khaltiStatus === 'User canceled'
          ? 'Payment was cancelled. You can try again from your bookings.'
          : `Payment failed. Status: ${khaltiStatus}`;
      setMessage(failMsg);
      toast.error(failMsg);
      return;
    }

    if (verifiedRef.current) return;
    verifiedRef.current = true;

    const verify = async () => {
      try {
        const res = await verifyKhaltiPayment(pidx, orderId);
        if (res.success && res.data) {
          setState('success');
          toast.success('Payment completed successfully!');
          setOrderData(res.data.order);
        } else {
          setState('failed');
          const failMsg = res.message || 'Payment verification failed.';
          setMessage(failMsg);
          toast.error(failMsg);
        }
      } catch (err: any) {
        setState('failed');
        const failMsg = err?.response?.data?.message || 'Payment verification failed. Please contact support.';
        setMessage(failMsg);
        toast.error(failMsg);
      }
    };

    verify();
  }, [searchParams]);

  const goToBookings = () => navigate('/my-bookings');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-lg mx-auto">
          {/* Loading */}
          {state === 'loading' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
              <Loader2 size={48} className="text-purple-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">Verifying Payment</h2>
              <p className="text-gray-500 mt-2">
                Please wait while we confirm your payment with Khalti...
              </p>
            </div>
          )}

          {/* Success — Guided modal flow */}
          {state === 'success' && orderData && flowStep === 'payment-success' && (
            <PaymentSuccessModal
              serviceName={orderData.service?.name || 'Service'}
              amount={Number(orderData.totalAmount)}
              paymentMethod="Khalti"
              onLeaveReview={() => setFlowStep('review')}
              onClose={goToBookings}
            />
          )}

          {state === 'success' && orderData && flowStep === 'review' && (
            <ReviewModal
              orderId={orderData.id}
              serviceName={orderData.service?.name || 'Service'}
              technicianName={orderData.technician?.profile?.name || orderData.technician?.name || 'Technician'}
              onClose={goToBookings}
              onReviewSubmitted={() => {
                // ReviewModal shows its own success screen, then auto-closes after 2s
                // which triggers onClose → goToBookings
              }}
            />
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
                  <button
                    onClick={goToBookings}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition text-sm"
                  >
                    <ArrowLeft size={16} />
                    Back to Bookings
                  </button>
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

export default KhaltiCallback;
