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
        let res = await fetch('/api/user/me', {
          credentials: 'include',
        });

        // If unauthorized, try refreshing the token and retry once
        if (res.status === 401) {
          const refreshRes = await fetch('/api/spotify/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });

          if (refreshRes.ok) {
            res = await fetch('/api/user/me', {
              credentials: 'include',
            });
          }
        }

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

    async login(returnTo = '/swipe') {
      // Build state parameter with return URL
      const state = btoa(
        JSON.stringify({
          returnTo: `${window.location.origin}${returnTo}`,
        }),
      );

      // Redirect to Spotify auth with state
      window.location.href = `/api/spotify/auth/login?state=${encodeURIComponent(state)}`;
    },

    async handleAuthCallback() {
      // Fetch user data after OAuth callback
      await this.fetchMe();

      // Parse state parameter to get return URL
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get('state');

      if (state) {
        try {
          const decoded = JSON.parse(atob(state));
          const returnTo = decoded.returnTo;

          if (returnTo) {
            // Extract path from full URL
            const url = new URL(returnTo);
            return url.pathname;
          }
        } catch (error) {
          console.error('Error parsing state:', error);
        }
      }

      // Default redirect to matching page
      return '/swipe';
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
