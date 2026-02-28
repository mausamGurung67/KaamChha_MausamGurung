import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Play,
  Camera,
  UserCheck,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  listBookings,
  acceptBooking,
  rejectBooking,
  updateBookingStatus,
  completeByTechnician,
  uploadBookingImage,
  type Booking,
  type BookingStatus,
} from '../../services/booking.service';
import { ORDER_STATUS_COLORS } from '../../utils/constants';
import { TabBarSkeleton, BookingCardSkeleton } from '../../components/common/Skeleton';
import toast from 'react-hot-toast';

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED_BY_TECHNICIAN: 'Completed (Pending Customer)',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const TechnicianBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed' | 'all'>('pending');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [beforePreviews, setBeforePreviews] = useState<string[]>([]);
  const [afterPreviews, setAfterPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listBookings({ limit: 50 });
      if (res.success && res.data) {
        setBookings(res.data.orders);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    switch (activeTab) {
      case 'pending': return b.status === 'PENDING';
      case 'active': return ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED_BY_TECHNICIAN'].includes(b.status);
      case 'completed': return ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status);
      case 'all': return true;
      default: return true;
    }
  });

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await acceptBooking(id);
      toast.success('Booking accepted successfully!');
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to accept booking');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectBooking(id, rejectReason || undefined);
      toast.success('Booking rejected');
      setShowRejectModal(null);
      setRejectReason('');
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject booking');
    } finally {
      setActionLoading('');
    }
  };

  const handleStartWork = async (id: string) => {
    setActionLoading(id);
    try {
      await updateBookingStatus(id, 'IN_PROGRESS' as BookingStatus, 'Work started by technician');
      toast.success('Work started!');
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start work');
    } finally {
      setActionLoading('');
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(id);
    try {
      // Upload photos first
      setUploadProgress('Uploading before photos...');
      const beforeUrls = await Promise.all(beforePhotos.map((f) => uploadBookingImage(f)));
      setUploadProgress('Uploading after photos...');
      const afterUrls = await Promise.all(afterPhotos.map((f) => uploadBookingImage(f)));
      setUploadProgress('');

      await completeByTechnician(id, {
        notes: completeNotes || undefined,
        beforePhotos: beforeUrls.length > 0 ? beforeUrls : undefined,
        afterPhotos: afterUrls.length > 0 ? afterUrls : undefined,
      });
      toast.success('Job marked as completed! Waiting for customer confirmation.');
      setShowCompleteModal(null);
      setCompleteNotes('');
      setBeforePhotos([]);
      setAfterPhotos([]);
      setBeforePreviews([]);
      setAfterPreviews([]);
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      setUploadProgress('');
      toast.error(err?.response?.data?.message || 'Failed to mark as completed');
    } finally {
      setActionLoading('');
    }
  };

  const tabs = [
    { key: 'pending', label: 'New Requests', count: bookings.filter((b) => b.status === 'PENDING').length },
    { key: 'active', label: 'Active Jobs', count: bookings.filter((b) => ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED_BY_TECHNICIAN'].includes(b.status)).length },
    { key: 'completed', label: 'History', count: bookings.filter((b) => ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)).length },
    { key: 'all', label: 'All', count: bookings.length },
  ] as const;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} className="text-yellow-600" />;
      case 'ACCEPTED':
      case 'ASSIGNED': return <UserCheck size={14} className="text-blue-600" />;
      case 'IN_PROGRESS': return <Play size={14} className="text-purple-600" />;
      case 'COMPLETED_BY_TECHNICIAN': return <CheckCircle size={14} className="text-teal-600" />;
      case 'COMPLETED': return <CheckCircle size={14} className="text-green-600" />;
      case 'CANCELLED':
      case 'REJECTED': return <XCircle size={14} className="text-red-600" />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Service Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Manage incoming bookings and active jobs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
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
          <button onClick={fetchBookings} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <ClipboardList size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No {activeTab === 'all' ? '' : activeTab} bookings</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'pending'
              ? 'New service requests from customers will appear here'
              : 'Bookings will appear here as you work on them'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => (
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
                    <p className="text-xs text-gray-500 mt-0.5">
                      {b.customer?.profile?.name || 'Customer'} &middot; {b.service.category.name}
                    </p>
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
                  {['ACCEPTED', 'IN_PROGRESS', 'COMPLETED_BY_TECHNICIAN'].includes(b.status) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/technician/chat', { state: { bookingId: b.id } });
                      }}
                      className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 transition-colors"
                      title={`Chat with ${b.customer?.profile?.name || 'Customer'}`}
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

              {/* Expanded details */}
              {selectedBooking?.id === b.id && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  {/* Customer info */}
                  <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {b.customer?.profile?.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{b.customer?.profile?.name || 'Customer'}</p>
                        <p className="text-xs text-gray-500">{b.customer?.profile?.phone || b.customer?.email}</p>
                      </div>
                    </div>
                    {['ACCEPTED', 'IN_PROGRESS', 'COMPLETED_BY_TECHNICIAN'].includes(b.status) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/technician/chat', { state: { bookingId: b.id } });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <MessageSquare size={14} />
                        Chat
                      </button>
                    )}
                  </div>

                  {/* Location */}
                  {b.serviceAddress && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600">{b.serviceAddress}</p>
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
                      <span className="text-gray-400">Amount</span>
                      <p className="text-gray-700 font-semibold mt-0.5">NPR {Number(b.totalAmount).toLocaleString()}</p>
                    </div>
                    {b.technicianAmount && (
                      <div>
                        <span className="text-gray-400">Your Earnings</span>
                        <p className="text-green-600 font-semibold mt-0.5">NPR {Number(b.technicianAmount).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions based on status */}
                  <div className="flex gap-2 pt-2">
                    {/* PENDING: Accept or Reject */}
                    {b.status === 'PENDING' && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAccept(b.id); }}
                          disabled={actionLoading === b.id}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {actionLoading === b.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          Accept
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowRejectModal(b.id); }}
                          disabled={actionLoading === b.id}
                          className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </>
                    )}

                    {/* ACCEPTED/ASSIGNED: Start Work */}
                    {['ACCEPTED', 'ASSIGNED'].includes(b.status) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartWork(b.id); }}
                        disabled={actionLoading === b.id}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading === b.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        Start Work
                      </button>
                    )}

                    {/* IN_PROGRESS: Mark as Complete */}
                    {b.status === 'IN_PROGRESS' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowCompleteModal(b.id); }}
                        disabled={actionLoading === b.id}
                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Camera size={14} />
                        Mark as Completed
                      </button>
                    )}

                    {/* COMPLETED_BY_TECHNICIAN: Waiting for customer */}
                    {b.status === 'COMPLETED_BY_TECHNICIAN' && (
                      <div className="flex-1 bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium py-2.5 rounded-lg text-center flex items-center justify-center gap-2">
                        <Clock size={14} />
                        Waiting for customer confirmation
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRejectModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Booking</h3>
            <p className="text-sm text-gray-500 mb-4">Optionally provide a reason for rejection.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={actionLoading === showRejectModal}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === showRejectModal ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCompleteModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Mark as Completed</h3>
            <p className="text-sm text-gray-500 mb-4">Add notes and upload before/after photos of the work. The customer will need to confirm.</p>
            <div className="space-y-4">
              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  <FileText size={14} className="inline mr-1" />
                  Notes
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="Describe the work completed..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Before Photos */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  <Camera size={14} className="inline mr-1" />
                  Before Photos
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {beforePreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={src} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setBeforePhotos((p) => p.filter((_, idx) => idx !== i));
                          setBeforePreviews((p) => p.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {beforePhotos.length < 5 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition text-gray-400 hover:text-orange-500">
                      <Camera size={18} />
                      <span className="text-[10px] mt-0.5">Add</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBeforePhotos((p) => [...p, file]);
                            setBeforePreviews((p) => [...p, URL.createObjectURL(file)]);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-400">Upload up to 5 photos of the work area before starting</p>
              </div>

              {/* After Photos */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  <Camera size={14} className="inline mr-1" />
                  After Photos
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {afterPreviews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                      <img src={src} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setAfterPhotos((p) => p.filter((_, idx) => idx !== i));
                          setAfterPreviews((p) => p.filter((_, idx) => idx !== i));
                        }}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {afterPhotos.length < 5 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition text-gray-400 hover:text-orange-500">
                      <Camera size={18} />
                      <span className="text-[10px] mt-0.5">Add</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAfterPhotos((p) => [...p, file]);
                            setAfterPreviews((p) => [...p, URL.createObjectURL(file)]);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-400">Upload up to 5 photos showing the completed work</p>
              </div>
            </div>

            {/* Upload progress */}
            {uploadProgress && (
              <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                <Loader2 size={14} className="animate-spin" />
                {uploadProgress}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCompleteModal(null);
                  setCompleteNotes('');
                  setBeforePhotos([]);
                  setAfterPhotos([]);
                  setBeforePreviews([]);
                  setAfterPreviews([]);
                  setUploadProgress('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleComplete(showCompleteModal)}
                disabled={actionLoading === showCompleteModal}
                className="flex-1 bg-teal-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === showCompleteModal ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianBookings;
