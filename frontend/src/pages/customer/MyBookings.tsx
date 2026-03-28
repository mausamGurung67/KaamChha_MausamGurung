import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  UserCheck,
  Star,
  CreditCard,
  MessageSquare,
  X,
} from 'lucide-react';
import ChatWindow from '../../components/chat/ChatWindow';
import Navbar from '../../components/common/Navbar';
import {
  listBookings,
  cancelBooking,
  confirmCompletion,
  type Booking,
  type BookingStatus,
} from '../../services/booking.service';
import { ORDER_STATUS_COLORS } from '../../utils/constants';
import { BookingCardSkeleton } from '../../components/common/Skeleton';
import PaymentModal from '../../components/payment/PaymentModal';
import ReviewModal from '../../components/review/ReviewModal';
import CompletionSuccessModal from '../../components/booking/CompletionSuccessModal';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { getOrderReview, type Review } from '../../services/review.service';

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED_BY_TECHNICIAN: 'Awaiting Confirmation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const MyBookings: React.FC = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [chatBooking, setChatBooking] = useState<Booking | null>(null);
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);
  const [orderReviews, setOrderReviews] = useState<Record<string, Review | null>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Show success banner if redirected from booking
  useEffect(() => {
    if (location.state?.bookingSuccess) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      // Clear the state so it doesn't show on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const statusMap: Record<string, BookingStatus | undefined> = {
        all: undefined,
        active: undefined,
        completed: 'COMPLETED' as BookingStatus,
        cancelled: 'CANCELLED' as BookingStatus,
      };
      const res = await listBookings({ status: statusMap[activeTab], limit: 10, page });
      if (res.success && res.data) {
        let orders = res.data.orders;
        // Client-side filter for "active" tab
        if (activeTab === 'active') {
          orders = orders.filter((b) =>
            ['PENDING', 'ACCEPTED', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED_BY_TECHNICIAN'].includes(b.status)
          );
        }
        setBookings(orders);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.total || orders.length);

        // Fetch reviews for completed+paid bookings
        const paidBookings = orders.filter(
          (b) => b.status === 'COMPLETED' && b.paymentStatus === 'PAID'
        );
        for (const b of paidBookings) {
          try {
            const reviewRes = await getOrderReview(b.id);
            if (reviewRes.success) {
              setOrderReviews((prev) => ({ ...prev, [b.id]: reviewRes.data?.review ?? null }));
            }
          } catch {
            // Review not found is fine
            setOrderReviews((prev) => ({ ...prev, [b.id]: null }));
          }
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab, page]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setActionLoading(id);
    try {
      await cancelBooking(id);
      toast.success('Booking cancelled successfully');
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading('');
    }
  };

  const handleConfirmCompletion = async (id: string) => {
    setActionLoading(id);
    try {
      await confirmCompletion(id);
      toast.success('Service completion confirmed!');
      // Update the booking locally instead of refetching everything
      const updatedBooking = bookings.find((b) => b.id === id);
      if (updatedBooking) {
        const completed = { ...updatedBooking, status: 'COMPLETED' as BookingStatus };
        setBookings((prev) => prev.map((b) => (b.id === id ? completed : b)));
        setCompletedBooking(completed);
      }
      setSelectedBooking(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to confirm completion');
    } finally {
      setActionLoading('');
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ] as const;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} className="text-yellow-600" />;
      case 'ACCEPTED':
      case 'CONFIRMED':
      case 'ASSIGNED': return <UserCheck size={16} className="text-blue-600" />;
      case 'IN_PROGRESS': return <ClipboardList size={16} className="text-purple-600" />;
      case 'COMPLETED_BY_TECHNICIAN': return <Star size={16} className="text-teal-600" />;
      case 'COMPLETED': return <CheckCircle size={16} className="text-green-600" />;
      case 'CANCELLED':
      case 'REJECTED': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link to="/" className="text-sm text-gray-500 hover:text-orange-500 flex items-center gap-1 mb-2">
                <ArrowLeft size={14} /> Back to Home
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-sm text-gray-500 mt-1">Track and manage your service bookings</p>
            </div>
          </div>

          {/* Success banner */}
          {showSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <CheckCircle size={18} className="text-green-600" />
              <p className="text-sm text-green-700 font-medium">Booking created successfully! A technician will accept your request soon.</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
                  activeTab === tab.key
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <BookingCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{error}</p>
              <Button variant="primary" size="sm" onClick={fetchBookings}>
                <RefreshCw size={16} /> Retry
              </Button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <ClipboardList size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No bookings found</p>
              <p className="text-gray-400 text-sm mt-1">Your bookings will appear here once you book a service</p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
              >
                Browse Services
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(selectedBooking?.id === b.id ? null : b)}
                  className={`bg-white rounded-xl border transition cursor-pointer ${
                    selectedBooking?.id === b.id
                      ? 'border-orange-300 shadow-md'
                      : 'border-gray-100 hover:border-gray-200 shadow-sm'
                  }`}
                >
                  {/* Summary row */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {b.service.image ? (
                          <img src={b.service.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ClipboardList size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{b.service.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{b.service.category.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {b.scheduledAt && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400">
                              <Calendar size={11} />
                              {new Date(b.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {b.serviceAddress && (
                            <span className="flex items-center gap-1 text-[11px] text-gray-400 truncate max-w-[150px]">
                              <MapPin size={11} />
                              {b.serviceAddress.split(',').slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Chat icon for active bookings */}
                      {['ACCEPTED', 'IN_PROGRESS', 'COMPLETED_BY_TECHNICIAN'].includes(b.status) && b.technician && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatBooking(b);
                          }}
                          className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors"
                          title={`Chat with ${b.technician?.profile?.name || 'Technician'}`}
                        >
                          <MessageSquare size={16} />
                        </button>
                      )}
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[b.status as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-100 text-gray-600'}`}>
                          {getStatusIcon(b.status)}
                          {statusLabels[b.status] || b.status}
                        </span>
                        <p className="text-xs font-semibold text-gray-900 mt-1">NPR {Number(b.totalAmount).toLocaleString()}</p>
                      </div>
                      <ChevronRight size={16} className={`text-gray-400 transition ${selectedBooking?.id === b.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded detail section */}
                  {selectedBooking?.id === b.id && (
                    <div className="border-t border-gray-100 p-4 space-y-4">
                      {/* Technician info */}
                      {b.technician && (
                        <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                          <div className="w-9 h-9 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {b.technician.profile?.name?.[0]?.toUpperCase() || 'T'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{b.technician.profile?.name || 'Technician'}</p>
                            <p className="text-xs text-gray-500">{b.technician.profile?.phone || b.technician.email}</p>
                          </div>
                        </div>
                      )}

                      {/* Notes from technician */}
                      {b.technicianNotes && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Technician Notes</p>
                          <p className="text-sm text-gray-600">{b.technicianNotes}</p>
                        </div>
                      )}

                      {/* Before/After photos */}
                      {((b.beforePhotos && b.beforePhotos.length > 0) || (b.afterPhotos && b.afterPhotos.length > 0)) && (
                        <div className="grid grid-cols-2 gap-3">
                          {b.beforePhotos && b.beforePhotos.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Before</p>
                              <div className="grid grid-cols-2 gap-1">
                                {b.beforePhotos.map((p, i) => (
                                  <img key={i} src={p} alt="Before" className="w-full h-20 object-cover rounded-lg" />
                                ))}
                              </div>
                            </div>
                          )}
                          {b.afterPhotos && b.afterPhotos.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">After</p>
                              <div className="grid grid-cols-2 gap-1">
                                {b.afterPhotos.map((p, i) => (
                                  <img key={i} src={p} alt="After" className="w-full h-20 object-cover rounded-lg" />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Booking details */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400">Booking ID</span>
                          <p className="text-gray-700 font-mono mt-0.5">{b.id.slice(-8)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Created</span>
                          <p className="text-gray-700 mt-0.5">{new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Payment</span>
                          <p className="text-gray-700 mt-0.5 capitalize">{b.paymentStatus.toLowerCase()}</p>
                        </div>
                        {b.serviceAddress && (
                          <div>
                            <span className="text-gray-400">Location</span>
                            <p className="text-gray-700 mt-0.5 truncate">{b.serviceAddress.split(',').slice(0, 2).join(', ')}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {b.status === 'COMPLETED_BY_TECHNICIAN' && (
                          <Button
                            variant="success"
                            size="sm"
                            className="flex-1 py-2.5"
                            onClick={(e) => { e.stopPropagation(); handleConfirmCompletion(b.id); }}
                            disabled={actionLoading === b.id}
                            isLoading={actionLoading === b.id}
                          >
                            <CheckCircle size={14} />
                            Confirm Completion
                          </Button>
                        )}
                        {b.status === 'COMPLETED' && b.paymentStatus === 'PENDING' && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 py-2.5"
                            onClick={(e) => { e.stopPropagation(); setPaymentBooking(b); }}
                          >
                            <CreditCard size={14} />
                            Pay Now — NPR {Number(b.totalAmount).toLocaleString()}
                          </Button>
                        )}
                        {b.paymentStatus === 'PAID' && !orderReviews[b.id] && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 py-2.5"
                            onClick={(e) => { e.stopPropagation(); setReviewBooking(b); }}
                          >
                            <Star size={14} />
                            Leave Review
                          </Button>
                        )}
                        {b.paymentStatus === 'PAID' && orderReviews[b.id] && (
                          <div className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2">
                            <Star size={14} className="fill-amber-400 text-amber-400" />
                            Reviewed ({orderReviews[b.id]!.rating}/5)
                          </div>
                        )}
                        {b.paymentStatus === 'PAID' && (
                          <div className="flex-1 bg-green-50 border border-green-200 text-green-700 text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2">
                            <CheckCircle size={14} />
                            Paid
                          </div>
                        )}
                        {['PENDING', 'ACCEPTED', 'CONFIRMED'].includes(b.status) && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="flex-1 py-2.5"
                            onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                            disabled={actionLoading === b.id}
                            isLoading={actionLoading === b.id}
                          >
                            <XCircle size={14} />
                            Cancel Booking
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && bookings.length > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={totalItems}
              onPageChange={setPage}
              label="bookings"
            />
          )}
        </div>
      </div>

      {/* Completion Success Modal — shown after confirming completion */}
      {completedBooking && (
        <CompletionSuccessModal
          serviceName={completedBooking.service.name}
          amount={Number(completedBooking.totalAmount)}
          onPayNow={() => {
            const booking = completedBooking;
            setCompletedBooking(null);
            setPaymentBooking(booking);
          }}
          onClose={() => setCompletedBooking(null)}
        />
      )}

      {/* Payment Modal */}
      {paymentBooking && (
        <PaymentModal
          orderId={paymentBooking.id}
          amount={Number(paymentBooking.totalAmount)}
          serviceName={paymentBooking.service.name}
          onClose={() => setPaymentBooking(null)}
          onPaymentInitiated={() => setPaymentBooking(null)}
        />
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          orderId={reviewBooking.id}
          serviceName={reviewBooking.service.name}
          technicianName={reviewBooking.technician?.profile?.name || 'Technician'}
          onClose={() => setReviewBooking(null)}
          onReviewSubmitted={(data) => {
            setOrderReviews((prev) => ({
              ...prev,
              [reviewBooking.id]: data?.review ?? { rating: data?.review?.rating || 5, id: 'temp' } as any,
            }));
            setReviewBooking(null);
          }}
        />
      )}

      {/* Chat Modal */}
      {chatBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setChatBooking(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 h-[600px] max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-orange-500 text-white shrink-0">
              <div>
                <h3 className="text-sm font-semibold">
                  {chatBooking.service?.name} — {chatBooking.technician?.profile?.name || 'Technician'}
                </h3>
                <p className="text-xs text-orange-100 mt-0.5">{statusLabels[chatBooking.status] || chatBooking.status}</p>
              </div>
              <button
                onClick={() => setChatBooking(null)}
                className="p-1.5 hover:bg-orange-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatWindow bookingId={chatBooking.id} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
