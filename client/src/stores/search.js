import { defineStore } from 'pinia';
import { api } from '@/api';

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    activeTab: 'all',
    results: { people: [], music: [], events: [] },
    loading: false,
    error: null,
    selectedIndex: -1,
  }),

  getters: {
    flatResults(state) {
      const items = [];
      const tabs = state.activeTab === 'all'
        ? ['people', 'music', 'events']
        : [state.activeTab];

      for (const category of tabs) {
        const list = state.results[category] || [];
        for (const item of list) {
          items.push({ ...item, _category: category });
        }
      }
      return items;
    },

    hasResults(state) {
      return (
        state.results.people.length > 0 ||
        state.results.music.length > 0 ||
        state.results.events.length > 0
      );
    },
  },

  actions: {
    async search() {
      const q = this.query.trim();
      if (q.length < 2) {
        this.results = { people: [], music: [], events: [] };
        return;
      }

      this.loading = true;
      this.error = null;
      this.selectedIndex = -1;

      try {
        this.results = await api.search(q, this.activeTab);
      } catch (err) {
        this.error = err.message || 'Search failed';
        this.results = { people: [], music: [], events: [] };
      } finally {
        this.loading = false;
      }
    },

    setTab(tab) {
      this.activeTab = tab;
      this.selectedIndex = -1;
      if (this.query.trim().length >= 2) {
        this.search();
      }
    },

    moveSelection(direction) {
      const total = this.flatResults.length;
      if (total === 0) return;
      if (this.selectedIndex === -1) {
        this.selectedIndex = direction === 1 ? 0 : total - 1;
      } else {
        this.selectedIndex = (this.selectedIndex + direction + total) % total;
      }
    },

    reset() {
      this.query = '';
      this.activeTab = 'all';
      this.results = { people: [], music: [], events: [] };
      this.loading = false;
      this.error = null;
      this.selectedIndex = -1;
    },
  },
});
