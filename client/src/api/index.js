// client/src/api/index.js

async function baseFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return text ? JSON.parse(text) : null;
}

export const api = {
  // User
  async getMe() {
    return baseFetch('/api/user/me');
  },

  // Events
  async getEventsNearby(lat, lng) {
    return baseFetch(`/api/events/nearby?lat=${lat}&lng=${lng}`);
  },

  async getEventRsvps(ids) {
    const q = encodeURIComponent(ids.join(','));
    return baseFetch(`/api/events/rsvp?ids=${q}`);
  },

  async setEventRsvp(eventId, payload) {
    return baseFetch(`/api/events/${eventId}/rsvp`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Matches
  async getMatches() {
    return baseFetch('/api/matches/candidates');
  },

  async likeUser(otherUserId) {
    return baseFetch(`/api/matches/${encodeURIComponent(otherUserId)}/like`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Spotify
  async getCurrentlyPlaying(userId) {
    const qs = userId ? `?userId=${userId}` : '';
    return baseFetch(`/api/spotify/currently-playing${qs}`);
  },

  async syncSpotifyData() {
    return baseFetch('/api/spotify/sync', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  // Search
  async search(query, type = 'all') {
    return baseFetch(`/api/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`);
  },

  // Chat
  async getChatRooms() {
    return baseFetch('/api/chat/rooms');
  },

  async getChatMessages(roomId) {
    return baseFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`);
  },

  // E2EE
  async upsertMyPublicKey(publicKeyJwk) {
    return baseFetch('/api/chat/e2ee/public-key', {
      method: 'POST',
      body: JSON.stringify({ publicKeyJwk }),
    });
  },

  async getPeerPublicKey(roomId) {
    return baseFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/peer-key`);
  },
};
