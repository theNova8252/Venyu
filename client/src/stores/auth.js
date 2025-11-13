import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false,
    intendedPath: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    login(redirectTo = null) {
      const base = window.location.origin; 

      const isAbsolute =
        redirectTo && (redirectTo.startsWith('http://') || redirectTo.startsWith('https://'));

      const returnTo = isAbsolute ? redirectTo : `${base}${redirectTo || '/profile'}`;

      const state = btoa(
        JSON.stringify({
          returnTo,
        }),
      );

      window.location.href = `/api/spotify/auth/login?state=${encodeURIComponent(state)}`;
    },

    async fetchMe() {
      try {
        const res = await fetch('/api/spotify/me', { credentials: 'include' });

        if (!res.ok) {
          this.user = null;
          this.ready = true;
          return;
        }

        this.user = await res.json();
      } catch (e) {
        console.error('fetchMe failed', e);
        this.user = null;
      } finally {
        this.ready = true;
      }
    },

    async logout() {
      await fetch('/api/spotify/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      this.user = null;
    },

    setIntended(path) {
      this.intendedPath = path;
    },

    popIntended() {
      const path = this.intendedPath;
      this.intendedPath = null;
      return path;
    },
  },
});
