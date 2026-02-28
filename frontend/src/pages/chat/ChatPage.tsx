import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, Loader2, AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import ChatWindow from '../../components/chat/ChatWindow';
import { listBookings, type Booking } from '../../services/booking.service';
import { ORDER_STATUS_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const location = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch all active bookings (ACCEPTED, IN_PROGRESS, COMPLETED_BY_TECHNICIAN)
        const statuses: Array<'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED_BY_TECHNICIAN'> = [
          'ACCEPTED', 'IN_PROGRESS', 'COMPLETED_BY_TECHNICIAN',
        ];
        const results = await Promise.all(
          statuses.map((status) => listBookings({ status, limit: 100 }))
        );
        const allOrders = results.flatMap((r) => (r.success && r.data ? r.data.orders : []));
        // Deduplicate by id just in case
        const unique = Array.from(new Map(allOrders.map((o) => [o.id, o])).values());
        if (unique.length > 0 || results.some((r) => r.success)) {
          setBookings(unique);
          // Auto-select booking if navigated with bookingId in state
          const stateBookingId = (location.state as { bookingId?: string })?.bookingId;
          if (stateBookingId) {
            const match = unique.find((b) => b.id === stateBookingId);
            if (match) setSelected(match);
            // Clear navigation state so back-and-forward doesn't re-select
            window.history.replaceState({}, document.title);
          }
        } else {
          setError('Failed to load bookings');
          toast.error('Failed to load chat bookings');
        }
      } catch {
        setError('Failed to load bookings');
        toast.error('Failed to load chat bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filtered = bookings.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.service?.name?.toLowerCase().includes(q) ||
      b.customer?.profile?.name?.toLowerCase().includes(q) ||
      b.technician?.profile?.name?.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  });

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-500" size={28} />
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-red-500">
        <AlertTriangle size={28} />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // ── Chat view when a booking is selected ──
  if (selected) {
    return (
      <div className="h-full flex flex-col">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to conversations
        </button>
        <div className="flex-1 min-h-0">
          <ChatWindow
            bookingId={selected.id}
            headerLabel={`${selected.service?.name} — ${selected.customer?.profile?.name || 'Customer'}`}
          />
        </div>
      </div>
    );
  }

  // ── Booking list ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <MessageSquare size={20} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chat</h2>
            <p className="text-sm text-gray-500">
              {bookings.length} active conversation{bookings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by service, customer, technician…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="mx-auto text-gray-300 mb-3" size={40} />
          <p className="text-gray-500 text-sm">
            {search ? 'No matching conversations' : 'No active bookings to chat about'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((booking) => (
            <button
              key={booking.id}
              onClick={() => setSelected(booking)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all text-left group"
            >
              {/* Service avatar */}
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                {booking.service?.image ? (
                  <img
                    src={booking.service.image}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <MessageSquare size={18} className="text-orange-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {booking.service?.name || 'Service'}
                  </p>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      ORDER_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  Customer: {booking.customer?.profile?.name || booking.customer?.email || '—'}
                  {booking.technician && (
                    <> · Tech: {booking.technician.profile?.name || booking.technician.email}</>
                  )}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Booked {new Date(booking.createdAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatPage;
