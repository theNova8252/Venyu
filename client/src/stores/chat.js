// stores/chat.js
import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', {
  state: () => ({
    byRoomId: {},
    loading: false,
  }),
  getters: {
    messages: (state) => (roomId) => state.byRoomId[roomId] || [],
  },
  actions: {
    async fetchMessages(roomId) {
      this.loading = true;
      try {
        const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          credentials: 'include',
        });

        if (!res.ok) {
          console.error('fetchMessages failed', res.status);
          return;
        }

        const data = await res.json();
        this.byRoomId[roomId] = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error('fetchMessages error', e);
      } finally {
        this.loading = false;
      }
    },

    async sendMessage(roomId, text) {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        console.error('sendMessage failed', res.status);
        throw new Error('sendMessage failed');
      }

      const saved = await res.json();

      if (!this.byRoomId[roomId]) {
        this.byRoomId[roomId] = [];
      }
      this.byRoomId[roomId].push(saved);

      return saved;
    },
  },
});
