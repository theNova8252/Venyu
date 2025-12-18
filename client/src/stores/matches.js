import { defineStore } from 'pinia';
import { api } from '@/api';

export const useMatchesStore = defineStore('matches', {
  state: () => ({ list: [], loading: false, error: null, ws: null, }),
  actions: {
    async fetchMatches() {
      this.loading = true;
      this.error = null;
      try {
        // Endpoint: z.B. GET /api/matches/candidates
        this.list = await api.getMatches();
      } catch (e) {
        this.error = e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },

    async like(otherUserId) {
      this.error = null;
      try {
        // Endpoint: POST /api/matches/:otherUserId/like
        const res = await api.likeUser(otherUserId);

        // UI-Status updaten (optional)
        const m = this.list.find(
          (x) => x.id === otherUserId || x.userId === otherUserId
        );
        if (m) m.liked = true;

        return res; // { isMatch, roomId }
      } catch (e) {
        this.error = e?.message || String(e);
        throw e;
      }
    },

    // currently playing
    connectNowPlayingWS() {
  if (this.ws) return; // 🔒 schon verbunden

  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  this.ws = new WebSocket(`${proto}://${location.host}/ws/now-playing`);

  this.ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type !== 'now_playing') return;

    const idx = this.list.findIndex(
      (u) => u.id === msg.userId || u.userId === msg.userId
    );

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
