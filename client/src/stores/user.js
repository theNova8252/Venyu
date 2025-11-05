import { defineStore } from 'pinia';
import { api } from '@/api'; // or '../api' if you don't have '@' alias

export const useUserStore = defineStore('user', {
  state: () => ({ me: null, loading: false, error: null }),
  actions: {
    async fetchMe() {
      this.loading = true;
      this.error = null;
      try {
        this.me = await api.getMe(); // <- comes from mock.js in demo mode
      } catch (e) {
        this.error = e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },
  },
});
