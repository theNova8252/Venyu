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
    async fetchMessages(roomId, currentUserId = null) {
      this.loading = true;
      try {
        const res = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("fetchMessages failed", res.status);
          this.byRoomId[roomId] = [];
          return;
        }

        const data = await res.json();
        const arr = Array.isArray(data) ? data : [];

        // Normalize
        for (const m of arr) {
          // isMine kommt vom Backend, aber wir lassen’s notfalls clientseitig korrigieren
          if (currentUserId != null) {
            m.isMine = String(m.senderId) === String(currentUserId);
          }

          // readByOther: wenn ich Sender bin und readAt gesetzt ist (oder readBy existiert)
          if (typeof m.readByOther !== "boolean") {
            m.readByOther =
              !!m.readAt &&
              currentUserId != null &&
              String(m.senderId) === String(currentUserId);
          }

          // text wird später nach Key-Handshake entschlüsselt
          if (typeof m.text !== "string") m.text = "";
        }

        this.byRoomId[roomId] = arr;
      } catch (e) {
        console.error("fetchMessages error", e);
        this.byRoomId[roomId] = [];
      } finally {
        this.loading = false;
      }
    },

    addMessage(roomId, message, currentUserId = null) {
      if (!this.byRoomId[roomId]) this.byRoomId[roomId] = [];
      if (currentUserId != null) {
        message.isMine = String(message.senderId) === String(currentUserId);
      }
      if (typeof message.readByOther !== "boolean") message.readByOther = false;
      if (typeof message.text !== "string") message.text = "";
      this.byRoomId[roomId].push(message);
    },

    // ✅ Mark my messages as read (up to lastReadMessageId)
    markReadUpTo(roomId, lastReadMessageId, currentUserId) {
      const arr = this.byRoomId[roomId];
      if (!arr || !lastReadMessageId || !currentUserId) return;

      const idx = arr.findIndex((m) => String(m.id) === String(lastReadMessageId));
      if (idx === -1) return;

      for (let i = 0; i <= idx; i++) {
        const m = arr[i];
        if (String(m.senderId) === String(currentUserId)) {
          m.readByOther = true;
          m.readAt = m.readAt || new Date().toISOString();
          m.readBy = m.readBy || "peer";
        }
      }
    },
  },
});
