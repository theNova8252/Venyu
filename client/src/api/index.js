// client/src/api/index.js
// Einheitlicher API Wrapper (nutzt fetch + credentials cookies)

async function baseFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return text ? JSON.parse(text) : null;
}

export const api = {
  async getEventsNearby(lat, lng) {
    const res = await fetch(`/api/events/nearby?lat=${lat}&lng=${lng}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    return await res.json();
  },
  // ✅ Candidates fürs Swipen
  async getMatches() {
    const res = await fetch('/api/matches/candidates', {
      credentials: 'include',
    });
    if (!res.ok) {
      console.error('getMatches failed', res.status);
      throw new Error('getMatches failed');
    }
    return res.json();
    return baseFetch("/api/matches/candidates");
  },

  // ✅ Like + Match persistiert im Backend (Like-Tabelle)
  async likeUser(otherUserId) {
    return baseFetch(`/api/matches/${encodeURIComponent(otherUserId)}/like`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
  async getCurrentlyPlaying(userId) {
    const res = await fetch(`/api/spotify/currently-playing?userId=${userId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch currently playing');
    return res.json();
  },

  // ✅ Chat Rooms (echte Matches)
  async getChatRooms() {
    return baseFetch("/api/chat/rooms");
  },
  async getEventRsvps(ids) {
    const q = encodeURIComponent(ids.join(','));
    const res = await fetch(`/api/events/rsvp?ids=${q}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load RSVPs');
    return res.json();
  },

  // ✅ Chat history
  async getChatMessages(roomId) {
    return baseFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`);
  },

  async setEventRsvp(eventId, payload) {
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save RSVP');
    return res.json();
  },

  // ✅ E2EE Public Key speichern
  async upsertMyPublicKey(publicKeyJwk) {
    return baseFetch("/api/chat/e2ee/public-key", {
      method: "POST",
      body: JSON.stringify({ publicKeyJwk }),
    });
  },

  // ✅ Peer Key holen (damit alte Nachrichten nach Reload decryptbar sind)
  async getPeerPublicKey(roomId) {
    return baseFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/peer-key`);
  },
};