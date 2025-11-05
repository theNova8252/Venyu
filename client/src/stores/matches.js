import { defineStore } from 'pinia';
import { api } from '@/api';

export const useMatchesStore = defineStore('matches', {
  state: () => ({ list: [], loading: false, error: null }),
  actions: {
    async fetchMatches() {
      this.loading = true;
      this.error = null;
      try {
        this.list = await api.getMatches();
      } catch (e) {
        this.error = e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },
    async like(matchId) {
      // in demo: no-op on server, just update local state so UI reacts
      await api.likeMatch(matchId);
      const m = this.list.find((x) => x.id === matchId);
      if (m) m.liked = true;
    },
  },
});
