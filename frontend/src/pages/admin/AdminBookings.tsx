import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Search,
  Filter,
} from 'lucide-react';
import {
  listBookings,
  cancelBooking,
  updateBookingStatus,
  type Booking,
  type BookingStatus,
} from '../../services/booking.service';
import { ORDER_STATUS_COLORS } from '../../utils/constants';
import { DashboardStatsSkeleton, BookingTableSkeleton } from '../../components/common/Skeleton';

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED_BY_TECHNICIAN: 'Awaiting Customer Confirmation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const ALL_STATUSES: BookingStatus[] = [
  'PENDING', 'ACCEPTED', 'REJECTED', 'CONFIRMED', 'ASSIGNED',
  'IN_PROGRESS', 'COMPLETED_BY_TECHNICIAN', 'COMPLETED', 'CANCELLED',
];

const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await listBookings(params);
      if (res.success && res.data) {
        setBookings(res.data.orders);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, page]);

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    setActionLoading(id);
    try {
      await updateBookingStatus(id, status);
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    setActionLoading(id);
    try {
      await cancelBooking(id);
      fetchBookings();
      setSelectedBooking(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading('');
    }
  };

  const filteredBookings = searchTerm
    ? bookings.filter(
        (b) =>
          b.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.customer?.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : bookings;

  // Count stats
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const activeCount = bookings.filter((b) => ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS'].includes(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;

  const statCards = [
    { label: 'Pending', value: pendingCount, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
    { label: 'Active', value: activeCount, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Completed', value: completedCount, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    { label: 'Total', value: bookings.length, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} className="text-yellow-600" />;
      case 'ACCEPTED':
      case 'CONFIRMED':
      case 'ASSIGNED': return <UserCheck size={14} className="text-blue-600" />;
      case 'IN_PROGRESS': return <ClipboardList size={14} className="text-purple-600" />;
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
        <h1 className="text-xl font-bold text-gray-900">Booking Monitor</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor all service bookings and their statuses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${card.bg}`}>
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by service, customer, or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as BookingStatus | ''); setPage(1); }}
            className="pl-10 pr-8 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 font-medium transition flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <BookingTableSkeleton />
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
          <p className="text-gray-500 font-medium">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Service</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-2">Technician</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
            </div>

            {/* Rows */}
            {filteredBookings.map((b) => (
              <div key={b.id}>
                <div
                  onClick={() => setSelectedBooking(selectedBooking?.id === b.id ? null : b)}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition ${
                    selectedBooking?.id === b.id ? 'bg-orange-50/50' : ''
                  }`}
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {b.service.image ? (
                        <img src={b.service.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ClipboardList size={16} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.service.name}</p>
                      <p className="text-xs text-gray-400">{b.service.category.name}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm text-gray-700 truncate">{b.customer?.profile?.name || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <p className="text-sm text-gray-700 truncate">{b.technician?.profile?.name || '—'}</p>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <p className="text-sm font-medium text-gray-900">NPR {Number(b.totalAmount).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${ORDER_STATUS_COLORS[b.status as keyof typeof ORDER_STATUS_COLORS] || 'bg-gray-100 text-gray-600'}`}>
                      {getStatusIcon(b.status)}
                      {statusLabels[b.status] || b.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <ChevronRight size={14} className={`text-gray-400 transition ${selectedBooking?.id === b.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Expanded detail */}
                {selectedBooking?.id === b.id && (
                  <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400">Booking ID</span>
                        <p className="text-gray-700 font-mono mt-0.5">{b.id.slice(-8)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Scheduled</span>
                        <p className="text-gray-700 mt-0.5">
                          {b.scheduledAt
                            ? new Date(b.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Payment</span>
                        <p className="text-gray-700 mt-0.5 capitalize">{b.paymentStatus.toLowerCase()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Location</span>
                        <p className="text-gray-700 mt-0.5 truncate">{b.serviceAddress?.split(',').slice(0, 2).join(', ') || 'N/A'}</p>
                      </div>
                    </div>

                    {b.technicianNotes && (
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 mb-1">Technician Notes</p>
                        <p className="text-sm text-gray-700">{b.technicianNotes}</p>
                      </div>
                    )}

                    {/* Admin actions — monitoring only, cancel for moderation */}
                    <div className="flex gap-2 pt-2 flex-wrap">
                      {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                          disabled={actionLoading === b.id}
                          className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <XCircle size={13} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminBookings;
