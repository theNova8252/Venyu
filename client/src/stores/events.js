// stores/events.js
import { defineStore } from 'pinia';

// API Configuration
const API_CONFIG = {
  ticketmaster: {
    key: import.meta.env.VITE_TICKETMASTER_API_KEY || 'YOUR_TICKETMASTER_API_KEY',
    baseUrl: 'https://app.ticketmaster.com/discovery/v2',
  },
  // Add more APIs as needed
  predicthq: {
    key: import.meta.env.VITE_PREDICTHQ_API_KEY,
    baseUrl: 'https://api.predicthq.com/v1',
  },
};

export const useEventsStore = defineStore('events', {
  state: () => ({
    list: [],
    searchResults: [],
    loading: false,
    searching: false,
    error: null,
    lastFetch: null,
    usingMockData: false,
    clusterRadius: 0.5,
    userLat: null,
    userLng: null,

    // RSVP state (eventId -> { interested, going })
    rsvp: {},
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
    eventsByCity: (state) => {
      const groups = {};
      state.list.forEach((event) => {
        if (!groups[event.city]) groups[event.city] = [];
        groups[event.city].push(event);
      });
      return groups;
    },
    upcomingEvents: (state) => {
      const now = new Date();
      return state.list
        .filter((e) => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    },
     clusteredEvents(state) {
      // Helper: Calculate distance between two coordinates (in km)
      function getDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      }

      const clusters = [];
      const processed = new Set();

      state.list.forEach((event, i) => {
        if (processed.has(i)) return;

        const cluster = [event];
        processed.add(i);

        state.list.forEach((other, j) => {
          if (i === j || processed.has(j)) return;

          const distance = getDistance(event.lat, event.lng, other.lat, other.lng);

          if (distance < state.clusterRadius) {
            cluster.push(other);
            processed.add(j);
          }
        });

        const avgLat = cluster.reduce((sum, e) => sum + e.lat, 0) / cluster.length;
        const avgLng = cluster.reduce((sum, e) => sum + e.lng, 0) / cluster.length;

        clusters.push({
          id: `cluster-${event.id}`,
          venue: event.venue,
          city: event.city,
          lat: avgLat,
          lng: avgLng,
          events: cluster.sort((a, b) => new Date(a.date) - new Date(b.date)),
          count: cluster.length,
          nextDate: cluster[0].date,
          categories: [...new Set(cluster.map(e => e.category))],
          artists: [...new Set(cluster.flatMap(e => e.artists))],
        });
      });

      return clusters.sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));
    },
  },


  actions: {
    // Fetch music events from Ticketmaster API with location
    async fetchTicketmaster({ lat, lng, radius = 150, keyword } = {}) {
      const params = new URLSearchParams({
        apikey: API_CONFIG.ticketmaster.key,
        size: 200,
        sort: 'date,asc',
        classificationName: 'Music',
      });

      if (lat != null && lng != null) {
        params.set('latlong', `${lat},${lng}`);
        params.set('radius', String(radius));
        params.set('unit', 'km');
      }

      if (keyword) {
        params.set('keyword', keyword);
      }

      const response = await fetch(`${API_CONFIG.ticketmaster.baseUrl}/events.json?${params}`);

      if (!response.ok) {
        throw new Error(`Ticketmaster API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data._embedded?.events) return [];

      return data._embedded.events.map((event) => ({
        id: event.id,
        title: event.name,
        date: event.dates.start.localDate,
        time: event.dates.start.localTime || null,
        city: event._embedded?.venues?.[0]?.city?.name || 'Unknown City',
        venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
        lat: parseFloat(event._embedded?.venues?.[0]?.location?.latitude || 0),
        lng: parseFloat(event._embedded?.venues?.[0]?.location?.longitude || 0),
        url: event.url,
        image: event.images?.[0]?.url || null,
        category: event.classifications?.[0]?.genre?.name || 'concert',
        artists: event._embedded?.attractions?.map((a) => a.name) || [event.name],
        priceRange: event.priceRanges?.[0]
          ? {
              min: event.priceRanges[0].min,
              max: event.priceRanges[0].max,
              currency: event.priceRanges[0].currency,
            }
          : null,
        source: 'ticketmaster',
      }));
    },

    // Get user GPS position
    getUserLocation() {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
        );
      });
    },

    // Main fetch — get user GPS, then fetch nearby events
    async fetchNearby() {
      this.loading = true;
      this.error = null;
      this.usingMockData = false;

      try {
        // Try to get GPS location
        const loc = await this.getUserLocation();
        const lat = loc?.lat ?? 48.2082;  // fallback: Vienna
        const lng = loc?.lng ?? 16.3738;
        this.userLat = lat;
        this.userLng = lng;

        const results = await this.fetchTicketmaster({ lat, lng, radius: 150 });

        this.list = results.filter((e) => e.lat !== 0 && e.lng !== 0);
        this.lastFetch = new Date();

        const ids = this.list.map((e) => String(e.id)).filter(Boolean);
        if (ids.length) {
          await this.loadRsvps(ids);
        }

        console.log(`Loaded ${this.list.length} nearby events (${lat.toFixed(2)}, ${lng.toFixed(2)})`);
      } catch (e) {
        this.error = e?.message || String(e);
        console.error('Error fetching events:', e);
      } finally {
        this.loading = false;
      }
    },

    // Search events by keyword (worldwide, no location filter)
    async searchEvents(keyword) {
      if (!keyword || !keyword.trim()) {
        this.searchResults = [];
        return;
      }
      this.searching = true;
      this.error = null;
      try {
        const results = await this.fetchTicketmaster({ keyword: keyword.trim() });
        this.searchResults = results.filter((e) => e.lat !== 0 && e.lng !== 0);
      } catch (e) {
        this.error = e?.message || String(e);
        console.error('Search error:', e);
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },

    // Load RSVPs from storage or API
    async loadRsvps(eventIds) {
      try {
        // Try to load from persistent storage first
        for (const id of eventIds) {
          try {
            const result = await window.storage.get(`rsvp:${id}`);
            if (result?.value) {
              this.rsvp[id] = JSON.parse(result.value);
            }
          } catch (err) {
            // Key doesn't exist, skip
          }
        }
      } catch (error) {
        console.error('Error loading RSVPs:', error);
      }
    },

    // Save RSVP to persistent storage
    async saveRsvp(eventId, rsvpData) {
      try {
        await window.storage.set(`rsvp:${eventId}`, JSON.stringify(rsvpData));
      } catch (error) {
        console.error('Error saving RSVP:', error);
      }
    },

    // Core setter with rules
    setRsvp(eventId, patch) {
      const key = String(eventId);
      const curr = this.rsvp[key] ?? { interested: false, going: false };
      let next = { ...curr, ...patch };

      // Rule: going => interested
      if (next.going) next.interested = true;

      // Rule: interested false => going false
      if (!next.interested) next.going = false;

      this.rsvp[key] = next;
    },

    // Toggle interested status
    async toggleInterested(eventId) {
      const key = String(eventId);
      const before = this.getRsvp(key);

      this.setRsvp(key, { interested: !before.interested });

      try {
        await this.saveRsvp(key, this.getRsvp(key));
      } catch (e) {
        this.rsvp[key] = before; // rollback
        this.error = e?.message || String(e);
        throw e;
      }
    },

    // Toggle going status
    async toggleGoing(eventId) {
      const key = String(eventId);
      const before = this.getRsvp(key);

      this.setRsvp(key, { going: !before.going });

      try {
        await this.saveRsvp(key, this.getRsvp(key));
        console.log('saved rsvp', key, this.getRsvp(key));
      } catch (e) {
        this.rsvp[key] = before; // rollback
        this.error = e?.message || String(e);
        throw e;
      }
    },

    // Force refresh events
    async refresh() {
      await this.fetchNearby();
    },

    // Clear all data
    clearAll() {
      this.list = [];
      this.rsvp = {};
      this.error = null;
      this.lastFetch = null;
    },
  },

  // Persist RSVP state
  persist: {
    key: 'events-store',
    paths: ['rsvp', 'lastFetch'],
  },
});
