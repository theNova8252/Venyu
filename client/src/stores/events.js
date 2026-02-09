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
    loading: false,
    error: null,
    lastFetch: null,
    usingMockData: false,
    clusterRadius: 0.5, 

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
    // Fetch events from Ticketmaster API
    async fetchTicketmaster(lat = 48.2082, lng = 16.3738, radius = 100) {
      const params = new URLSearchParams({
        apikey: API_CONFIG.ticketmaster.key,
        latlong: `${lat},${lng}`,
        radius,
        unit: 'km',
        size: 100,
        sort: 'date,asc',
        classificationName: 'Music',
      });

      try {
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
          city: event._embedded?.venues?.[0]?.city?.name || 'Vienna',
          venue: event._embedded?.venues?.[0]?.name || 'Unknown Venue',
          lat: parseFloat(event._embedded?.venues?.[0]?.location?.latitude || lat),
          lng: parseFloat(event._embedded?.venues?.[0]?.location?.longitude || lng),
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
      } catch (error) {
        console.error('Ticketmaster fetch error:', error);
        throw error;
      }
    },

    // Generate mock data for development
    generateMockEvents(count = 20) {
      const baseDate = new Date();
      const venues = [
        { name: 'Wiener Stadthalle', lat: 48.2021, lng: 16.334, city: 'Vienna' },
        { name: 'Gasometer', lat: 48.185, lng: 16.4193, city: 'Vienna' },
        { name: 'Arena Wien', lat: 48.1867, lng: 16.4183, city: 'Vienna' },
        { name: 'Flex', lat: 48.2145, lng: 16.3803, city: 'Vienna' },
        { name: 'Pannonia Fields', lat: 47.966, lng: 17.066, city: 'Nickelsdorf' },
        { name: 'Óbuda Island', lat: 47.549549, lng: 19.05547, city: 'Budapest' },
      ];

      const artists = [
        'The Weeknd',
        'Billie Eilish',
        'Arctic Monkeys',
        'Taylor Swift',
        'Coldplay',
        'Ed Sheeran',
        'Imagine Dragons',
        'Metallica',
        'Dua Lipa',
        'Harry Styles',
        'Radiohead',
        'Foo Fighters',
        'Tame Impala',
        'The 1975',
        'Glass Animals',
        'alt-J',
        'Bon Iver',
        'Phoebe Bridgers',
        'boygenius',
        'Hozier',
      ];

      const genres = ['Rock', 'Pop', 'Electronic', 'Metal', 'Indie', 'Alternative'];

      return Array.from({ length: count }, (_, i) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + Math.floor(Math.random() * 365));

        const venue = venues[Math.floor(Math.random() * venues.length)];
        const artist = artists[Math.floor(Math.random() * artists.length)];
        const genre = genres[Math.floor(Math.random() * genres.length)];

        return {
          id: `mock-${i}-${Date.now()}`,
          title: `${artist} - ${
            ['World Tour', 'Live', 'European Tour', '2026'][Math.floor(Math.random() * 4)]
          }`,
          date: date.toISOString().split('T')[0],
          time: ['19:00', '20:00', '21:00'][Math.floor(Math.random() * 3)],
          city: venue.city,
          venue: venue.name,
          lat: venue.lat + (Math.random() - 0.5) * 0.01, // slight variation
          lng: venue.lng + (Math.random() - 0.5) * 0.01,
          url: `https://www.ticketmaster.com/event/${i}`,
          image: `https://picsum.photos/seed/${artist.replace(/\s/g, '')}/400/300`,
          category: genre,
          artists: [artist],
          priceRange: {
            min: 35 + Math.floor(Math.random() * 40),
            max: 85 + Math.floor(Math.random() * 100),
            currency: 'EUR',
          },
          source: 'mock',
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    // Main fetch method with fallback to mock data
    async fetchNearby(lat = 48.2082, lng = 16.3738, radius = 100) {
      this.loading = true;
      this.error = null;
      this.usingMockData = false;

      try {
        let events = [];

        // Try Ticketmaster API first
        if (API_CONFIG.ticketmaster.key !== 'YOUR_TICKETMASTER_API_KEY') {
          console.log('Fetching from Ticketmaster API...');
          events = await this.fetchTicketmaster(lat, lng, radius);
        }

        // If no events or API key not configured, use mock data
        if (events.length === 0) {
          console.log(
            'Using mock data (configure VITE_TICKETMASTER_API_KEY in .env for real events)',
          );
          events = this.generateMockEvents(25);
          this.usingMockData = true;
        }

        this.list = events;
        this.lastFetch = new Date();

        // Load RSVP data for all events
        const ids = this.list.map((e) => String(e.id)).filter(Boolean);
        if (ids.length) {
          await this.loadRsvps(ids);
        }

        console.log(
          `Loaded ${this.list.length} events (${this.usingMockData ? 'mock' : 'real'} data)`,
        );
      } catch (e) {
        this.error = e?.message || String(e);
        console.error('Error fetching events:', e);

        // Fallback to mock data on error
        this.list = this.generateMockEvents(25);
        this.usingMockData = true;
      } finally {
        this.loading = false;
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
