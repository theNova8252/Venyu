import { defineStore } from 'pinia';
import { api } from '@/api';

const TOKEN_KEY = 'spotify_tokens';
const CODE_VERIFIER_KEY = 'spotify_pkce_verifier';

function saveTokens(t) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
}
function loadTokens() {
  const r = localStorage.getItem(TOKEN_KEY);
  return r ? JSON.parse(r) : null;
}
function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

async function sha256(base) {
  const data = new TextEncoder().encode(base);
  const digest = await crypto.subtle.digest('SHA-256', data);
  // base64url
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function randomString(len = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let s = '';
  const arr = crypto.getRandomValues(new Uint8Array(len));
  for (const n of arr) s += chars[n % chars.length];
  return s;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    tokens: loadTokens(),
    refreshTimer: 0,
  }),
  getters: {
    isAuthenticated(state) {
      return !!state.tokens && Date.now() < state.tokens.expires_at - 5000;
    },
    accessToken(state) {
      return state.tokens ? state.tokens.access_token : null;
    },
  },
  actions: {
    async login() {
      const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
      const scope = (import.meta.env.VITE_SPOTIFY_SCOPES || '').replace(/\s+/g, ' ');
      const verifier = randomString(64);
      sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
      const challenge = await sha256(verifier);
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope,
        code_challenge_method: 'S256',
        code_challenge: challenge,
        redirect_uri: redirectUri,
      });
      window.location.href = `https://accounts.spotify.com/authorize?${params}`;
    },

    async handleCallback(code) {
      const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
      if (!verifier) throw new Error('Missing PKCE verifier');

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        code_verifier: verifier,
      });

      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error('Token exchange failed');
      const data = await res.json();

      const expires_at = Date.now() + data.expires_in * 1000;
      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at,
      };
      saveTokens(this.tokens);
      this.scheduleRefresh(data.expires_in);
    },

    async refresh() {
      if (!this.tokens || !this.tokens.refresh_token) return;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.tokens.refresh_token,
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
      });
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      const expires_at = Date.now() + data.expires_in * 1000;
      this.tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || this.tokens.refresh_token,
        expires_at,
      };
      saveTokens(this.tokens);
      this.scheduleRefresh(data.expires_in);
    },

    logout() {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = 0;
      this.tokens = null;
      clearTokens();
    },

    scheduleRefresh(expiresInSec) {
      clearTimeout(this.refreshTimer);
      const inMs = Math.max(5000, (expiresInSec - 60) * 1000);
      this.refreshTimer = window.setTimeout(() => this.refresh(), inMs);
    },

    boot() {
      if (!this.tokens) return;
      const remaining = this.tokens.expires_at - Date.now();
      if (remaining > 0) this.scheduleRefresh(Math.floor(remaining / 1000));
      else this.refresh().catch(() => this.logout());
    },
  },
});
