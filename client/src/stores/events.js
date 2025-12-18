import { defineStore } from 'pinia';
import { api } from '@/api';

export const useEventsStore = defineStore('events', {
  state: () => ({
    list: [],
    loading: false,
    error: null,

    // RSVP state (eventId -> { interested, going })
    rsvp: {}, // plain object so Pinia devtools + persistence are easy
  }),

  getters: {
    getRsvp: (state) => (eventId) => {
      const key = String(eventId);
      return state.rsvp[key] ?? { interested: false, going: false };
    },
    isInterested() {
      return (eventId) => this.getRsvp(eventId).interested;
    },
    isGoing() {
      return (eventId) => this.getRsvp(eventId).going;
    },
  },

  actions: {
    async fetchNearby(lat = 48.2082, lng = 16.3738) {
      this.loading = true;
      this.error = null;
      try {
        this.list = await api.getEventsNearby(lat, lng);

        const ids = this.list.map((e) => String(e.id)).filter(Boolean);
        if (ids.length) {
          const map = await api.getEventRsvps(ids);
          this.rsvp = { ...this.rsvp, ...map };
        }
      } catch (e) {
        this.error = e?.message || String(e);
      } finally {
        this.loading = false;
      }
    },

    // core setter with rules
    setRsvp(eventId, patch) {
      const key = String(eventId);
      const curr = this.rsvp[key] ?? { interested: false, going: false };
      let next = { ...curr, ...patch };

      // rule: going => interested
      if (next.going) next.interested = true;

      // rule: interested false => going false
      if (!next.interested) next.going = false;

      this.rsvp[key] = next;
    },

    async toggleInterested(eventId) {
      const key = String(eventId);
      const before = this.getRsvp(key);

      this.setRsvp(key, { interested: !before.interested });

      try {
        await api.setEventRsvp(key, this.getRsvp(key));
      } catch (e) {
        this.rsvp[key] = before; // rollback
        this.error = e?.message || String(e);
      }
    },

    async toggleGoing(eventId) {
      const key = String(eventId);
      const before = this.getRsvp(key);

      this.setRsvp(key, { going: !before.going });

      try {
        await api.setEventRsvp(key, this.getRsvp(key));
        console.log('saved rsvp', key, this.getRsvp(key));
      } catch (e) {
        this.rsvp[key] = before; // rollback
        this.error = e?.message || String(e);
      }
    },

    // next: persist to backend
    async saveRsvp(eventId) {
      const key = String(eventId);
      const payload = this.rsvp[key] ?? { interested: false, going: false };
      // example – adjust to backend
      // await api.setEventRsvp(key, payload);
      return payload;
    },
  },
});
