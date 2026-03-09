import { defineStore } from 'pinia';

const normalizeSignupProfile = (profile = {}) => {
  const firstName = typeof profile.firstName === 'string' ? profile.firstName.trim() : '';
  const lastName = typeof profile.lastName === 'string' ? profile.lastName.trim() : '';
  const birthDate = typeof profile.birthDate === 'string' ? profile.birthDate.trim() : '';

  return {
    firstName,
    lastName,
    birthDate,
  };
};

const toBase64Url = (value) =>
  value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const fromBase64Url = (value) => {
  if (typeof value !== 'string') return '';

  const normalized = value
    .trim()
    .replace(/ /g, '+')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padding = normalized.length % 4;
  if (padding === 0) return normalized;

  return normalized.padEnd(normalized.length + (4 - padding), '=');
};

const encodeAuthState = (payload) => {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return toBase64Url(btoa(binary));
};

const decodeAuthState = (state) => {
  try {
    const binary = atob(fromBase64Url(state));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    console.error('Error decoding auth state:', error);
    return null;
  }
};

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

    async login(returnTo = '/swipe', profile = {}) {
      const signupProfile = normalizeSignupProfile(profile);
      if (!signupProfile.firstName || !signupProfile.birthDate) {
        throw new Error('signup_profile_required');
      }

      const target =
        typeof returnTo === 'string' && /^https?:\/\//.test(returnTo)
          ? returnTo
          : `${window.location.origin}${returnTo}`;

      const state = encodeAuthState({
        returnTo: target,
        profile: signupProfile,
      });

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
        const decoded = decodeAuthState(state);
        const returnTo = decoded?.returnTo;

        if (returnTo) {
          try {
            const url = new URL(returnTo);
            return url.pathname;
          } catch (error) {
            console.error('Error parsing return URL:', error);
          }
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
