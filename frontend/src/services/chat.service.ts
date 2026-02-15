import api from './api';
import { API_BASE_URL } from '../utils/constants';

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: string;
  content: string;
  timestamp: string;
}

/**
 * Fetch past chat messages for a booking (order) via REST.
 * Falls back to an empty array if the endpoint isn't available yet.
 */
export const getChatHistory = async (bookingId: string): Promise<ChatMessage[]> => {
  try {
    const res = await api.get(`/orders/${bookingId}/chats`);
    if (res.data?.success && Array.isArray(res.data.data?.chats)) {
      return res.data.data.chats.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        bookingId,
        senderId: c.senderId as string,
        senderRole: (c.senderRole as string) || '',
        content: c.message as string,
        timestamp: c.createdAt as string,
      }));
    }
    return [];
  } catch {
    // Endpoint may not exist yet — return empty
    console.warn('[chat.service] Could not fetch chat history for', bookingId);
    return [];
  }
};

export { API_BASE_URL };
