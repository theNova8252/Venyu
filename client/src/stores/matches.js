import { defineStore } from 'pinia';
import { api } from '@/api';

export const useMatchesStore = defineStore('matches', {
  state: () => ({
    list: [],
    loading: false,
    error: null,
    ws: null,
  }),

  actions: {
    async fetchMatches(forceRefresh = false) {
      this.loading = true;
      this.error = null;
      try {
        // Add cache buster to force fresh data
        const url = forceRefresh
          ? `/api/matches/candidates?t=${Date.now()}`
          : '/api/matches/candidates';

        const res = await fetch(url, {
          credentials: 'include',
          cache: 'no-store', // Prevent caching
        });

        if (!res.ok) throw new Error('Failed to fetch matches');
        const data = await res.json();

        console.log('📥 Raw data from API:', data);

        const candidates = Array.isArray(data)
          ? data
          : Array.isArray(data?.candidates)
            ? data.candidates
            : Array.isArray(data?.data)
              ? data.data
              : [];

        console.log('👥 Candidates parsed:', candidates);
        candidates.forEach((c) => {
          console.log(
            `  - ${c.name}: age=${c.age}, matchScore=${c.matchScore}, topArtists=${c.topArtists?.length}, genres=${c.genres?.length}`,
          );
        });

        this.list = candidates.sort(
          (a, b) =>
            (b.score ?? b.matchScore ?? b.compatibility ?? 0) -
            (a.score ?? a.matchScore ?? a.compatibility ?? 0),
        );
      } catch (e) {
        console.error('fetchMatches error:', e); // ✅ Add logging
        this.error = e?.message || String(e);
        this.list = [];
      } finally {
        this.loading = false;
      }
    },

    async like(otherUserId) {
      this.error = null;
      try {
        // ✅ Persistiert Like im Backend + gibt {isMatch, roomId} zurück
        const res = await api.likeUser(otherUserId);

        // UI-Status updaten (optional)
        const m = this.list.find((x) => x.id === otherUserId || x.userId === otherUserId);
        if (m) m.liked = true;

        return res; // { isMatch, roomId }
      } catch (e) {
        this.error = e?.message || String(e);
        throw e;
      }
    },

    // ⚠️ Hinweis: Backend hat aktuell KEIN /ws/now-playing.
    // Das hier bleibt drin, bringt aber erst was, wenn du serverseitig diese WS Route baust.
    connectNowPlayingWS() {
      if (this.ws) return;

      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      this.ws = new WebSocket(`${proto}://${location.host}/ws/now-playing`);

      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type !== 'now_playing') return;

        const idx = this.list.findIndex((u) => u.id === msg.userId || u.userId === msg.userId);
        if (idx !== -1) {
          this.list[idx].currentlyPlaying = msg.currentlyPlaying;
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
      };
    },
  },
});
