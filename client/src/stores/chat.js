// client/src/stores/chat.js
import { defineStore } from "pinia";

export const useChatStore = defineStore("chat", {
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
          credentials: "include",
        });

        if (!res.ok) {
          console.error("fetchMessages failed", res.status);
          this.byRoomId[roomId] = [];
          return;
        }

        const data = await res.json();
        this.byRoomId[roomId] = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error("fetchMessages error", e);
        this.byRoomId[roomId] = [];
      } finally {
        this.loading = false;
      }
    },

    addMessage(roomId, message) {
      if (!this.byRoomId[roomId]) this.byRoomId[roomId] = [];
      this.byRoomId[roomId].push(message);
    },
  },
});
