import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async fetchMe() {
      try {
        const res = await fetch('/api/user/me', {
          credentials: 'include',
        });

        if (!res.ok) {
          this.user = null;
          this.ready = true;
          return false;
        }

        const data = await res.json();
        this.user = data;
        this.ready = true;
        return true;
      } catch (error) {
        console.error('fetchMe error:', error);
        this.user = null;
        this.ready = true;
        return false;
      }
    },

    async login(returnTo = '/profile') {
      // Build state parameter with return URL
      const state = btoa(
        JSON.stringify({
          returnTo: `${window.location.origin}${returnTo}`,
        }),
      );

      // Redirect to Spotify auth with state
      window.location.href = `/api/spotify/auth/login?state=${encodeURIComponent(state)}`;
    },

    async logout() {
      try {
        await fetch('/api/spotify/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });

        this.user = null;
        this.ready = false;
      } catch (error) {
        console.error('Logout error:', error);
      }
    },
  },
});
