import { defineStore } from "pinia";

const normalizeChatRoom = (room = {}) => {
  const user = room.user || {};

  return {
    roomId: room.roomId,
    user: {
      id: user.id || null,
      name: user.name || 'Match',
      age: Number.isFinite(Number(user.age)) ? Number(user.age) : null,
      avatar: user.avatar || user.avatarUrl || null,
      bio: user.bio || '',
      genres: Array.isArray(user.genres) ? user.genres : [],
      audioFeatures: user.audioFeatures ?? null,
    },
  };
};

export const useChatsStore = defineStore("chats", {
  state: () => ({
    list: [],
    loading: false,
  }),

  actions: {
    async fetchChats() {
      this.loading = true;
      try {
        const res = await fetch("/api/chat/rooms", {
          credentials: "include",
        });
        if (!res.ok) {
          this.list = [];
          return;
        }

        const data = await res.json();
        this.list = Array.isArray(data) ? data.map(normalizeChatRoom) : [];
      } finally {
        this.loading = false;
      }
    },
  },
});
