import { defineStore } from 'pinia';
import { api } from '@/api';

export const useEventsStore = defineStore('events', {
  state: () => ({ list: [], loading: false, error: null }),
  actions: {
    async fetchNearby(lat = 48.2082, lng = 16.3738) {
      this.loading = true;
      this.error = null;
      try {
        this.list = await api.getEventsNearby(lat, lng);
      } catch (e) {
        this.error = e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },
  },
});
