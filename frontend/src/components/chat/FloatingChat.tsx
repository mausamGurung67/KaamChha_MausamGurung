import React, { useEffect, useState } from 'react';
import { MessageCircle, X, ChevronDown, Loader2 } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { listBookings, type Booking } from '../../services/booking.service';

/**
 * Floating chat widget for CUSTOMER users.
 * Shows a bubble in the bottom-right corner.
 * Only visible when the customer has at least one ACCEPTED booking.
 */
const FloatingChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);

  // Fetch ACCEPTED bookings on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await listBookings({ status: 'ACCEPTED', limit: 50 });
        if (res.success && res.data) {
          setBookings(res.data.orders);
        }
      } catch {
        // silent — widget just won't show
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Don't render anything if no accepted bookings
  if (!loading && bookings.length === 0) return null;

  return (
    <>
      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-orange-500 text-white shrink-0">
            <h3 className="text-sm font-semibold">
              {selected ? selected.service?.name || 'Chat' : 'Your Conversations'}
            </h3>
            <div className="flex items-center gap-1">
              {selected && (
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 hover:bg-orange-600 rounded-lg transition-colors"
                  title="Back to list"
                >
                  <ChevronDown size={18} />
                </button>
              )}
              <button
                onClick={() => { setOpen(false); setSelected(null); }}
                className="p-1 hover:bg-orange-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {selected ? (
              <ChatWindow bookingId={selected.id} compact />
            ) : (
              <div className="h-full overflow-y-auto p-3 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-orange-500" size={24} />
                  </div>
                ) : (
                  bookings.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelected(b)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        {b.service?.image ? (
                          <img
                            src={b.service.image}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <MessageCircle size={16} className="text-orange-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {b.service?.name || 'Service'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {b.technician?.profile?.name
                            ? `Technician: ${b.technician.profile.name}`
                            : 'Awaiting technician'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Floating bubble ── */}
      {!loading && bookings.length > 0 && (
        <button
          onClick={() => setOpen((prev) => !prev)}
          className={`fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
            open
              ? 'bg-gray-700 hover:bg-gray-800 rotate-0'
              : 'bg-orange-500 hover:bg-orange-600 hover:scale-105'
          }`}
          title="Chat"
        >
          {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
          {/* Unread indicator (future enhancement) */}
          {!open && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
          )}
        </button>
      )}
    </>
  );
};

export default FloatingChat;
