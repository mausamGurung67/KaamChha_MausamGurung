import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, WifiOff, AlertCircle } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import type { ChatMessage } from '../../services/chat.service';

interface ChatWindowProps {
  bookingId: string;
  /** Compact mode hides the header — used inside the floating chat bubble */
  compact?: boolean;
  /** Optional header content (service name, etc.) */
  headerLabel?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ bookingId, compact = false, headerLabel }) => {
  const { user } = useAuth();
  const { messages, sendMessage, joined, loading, error, isConnected } = useChat({ bookingId });
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'TECHNICIAN': return 'Technician';
      case 'CUSTOMER': return 'Customer';
      default: return role;
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-600';
      case 'TECHNICIAN': return 'text-blue-600';
      case 'CUSTOMER': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader2 className="animate-spin text-orange-500" size={28} />
        <span className="ml-2 text-gray-500 text-sm">Joining chat…</span>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-2 text-red-500 px-4 text-center">
        <AlertCircle size={28} />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[calc(100vh-12rem)]'} bg-white rounded-xl border border-gray-200 overflow-hidden`}>
      {/* Header */}
      {!compact && (
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {headerLabel || `Booking Chat`}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Room: booking_{bookingId.slice(0, 8)}…</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected && joined ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-500">{isConnected && joined ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!isConnected && (
          <div className="flex items-center gap-2 text-yellow-600 text-xs bg-yellow-50 rounded-lg px-3 py-2">
            <WifiOff size={14} />
            <span>Reconnecting…</span>
          </div>
        )}

        {messages.length === 0 && joined && (
          <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hello! 👋</p>
        )}

        {messages.map((msg: ChatMessage) => {
          const isOwn = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? 'bg-orange-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}
              >
                {!isOwn && (
                  <p className={`text-[11px] font-medium mb-0.5 ${roleColor(msg.senderRole)}`}>
                    {roleLabel(msg.senderRole)}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-orange-100' : 'text-gray-400'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-3 py-2 shrink-0 bg-gray-50">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={joined ? 'Type a message…' : 'Connecting…'}
            disabled={!joined}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!joined || !input.trim()}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
