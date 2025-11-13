import { defineStore } from "pinia";

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
        this.list = await res.json();
      } finally {
        this.loading = false;
      }
    },
  },
});
