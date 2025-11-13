import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, ready: false }),
  actions: {
    login() {
      window.location.href = '/api/spotify/auth/login';
    },
    async fetchMe() {
      const res = await fetch('/api/spotify/me', { credentials: 'include' });
      if (!res.ok) return (this.user = null), (this.ready = true);
      this.user = await res.json();
      this.ready = true;
    },
    async logout() {
      await fetch('/api/spotify/auth/logout', { method: 'POST', credentials: 'include' });
      this.user = null;
    },
  },
});
