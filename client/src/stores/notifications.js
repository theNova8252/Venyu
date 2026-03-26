import { defineStore } from 'pinia';

const STORAGE_KEY = 'venyu_notifications_v1';

const loadNotifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistNotifications = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore persistence errors
  }
};

const createId = () =>
  `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: loadNotifications(),
  }),

  getters: {
    unreadCount: (state) => state.items.filter((item) => !item.read).length,
    recentItems: (state) => state.items.slice(0, 8),
  },

  actions: {
    add(payload = {}) {
      const type = payload.type || 'system';
      const roomId = payload.roomId || null;
      const item = {
        id: payload.id || createId(),
        type,
        title: payload.title || (type === 'match' ? 'New Match' : 'Notification'),
        message: payload.message || '',
        icon: payload.icon || (type === 'match' ? 'favorite' : 'notifications'),
        roomId,
        user: payload.user || null,
        createdAt: payload.createdAt || new Date().toISOString(),
        read: payload.read === true,
      };

      const nextItems = [
        item,
        ...this.items.filter((existing) =>
          !(roomId && existing.type === type && existing.roomId === roomId)),
      ].slice(0, 40);

      this.items = nextItems;
      persistNotifications(this.items);
      return item;
    },

    addMatch({ user, roomId }) {
      return this.add({
        type: 'match',
        title: 'New Match',
        message: user?.name ? `You matched with ${user.name}` : 'You have a new match',
        icon: 'favorite',
        user,
        roomId,
      });
    },

    markRead(id) {
      this.items = this.items.map((item) =>
        item.id === id ? { ...item, read: true } : item);
      persistNotifications(this.items);
    },

    markAllRead() {
      this.items = this.items.map((item) => ({ ...item, read: true }));
      persistNotifications(this.items);
    },

    remove(id) {
      this.items = this.items.filter((item) => item.id !== id);
      persistNotifications(this.items);
    },

    clear() {
      this.items = [];
      persistNotifications(this.items);
    },
  },
});
