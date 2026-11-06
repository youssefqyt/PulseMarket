import { create } from "zustand";
import { fetchNotifications } from "../services/notification.service";

interface NotificationState {
  unreadCount: number;
  lastFetched: number | null;

  /** Fetch from API and update unread count. Silently swallows errors. */
  refresh: () => Promise<void>;
  /** Decrement unread count by 1 (called when a single notification is marked read). */
  markOneRead: () => void;
  /** Set unread count to 0 (called after mark-all-read). */
  markAllRead: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  lastFetched: null,

  refresh: async () => {
    try {
      const notifications = await fetchNotifications();
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ unreadCount, lastFetched: Date.now() });
    } catch {
      // Network not available — keep previous count
    }
  },

  markOneRead: () => {
    const current = get().unreadCount;
    set({ unreadCount: Math.max(0, current - 1) });
  },

  markAllRead: () => {
    set({ unreadCount: 0 });
  },

  reset: () => {
    set({ unreadCount: 0, lastFetched: null });
  },
}));
