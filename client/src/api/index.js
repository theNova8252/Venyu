// client/src/api/index.js

export const api = {
  async getEventsNearby(lat, lng) {
    const res = await fetch(`/api/events/nearby?lat=${lat}&lng=${lng}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    return await res.json();
  },
  async getMatches() {
    const res = await fetch('/api/matches/candidates', {
      credentials: 'include',
    });
    if (!res.ok) {
      console.error('getMatches failed', res.status);
      throw new Error('getMatches failed');
    }
    return res.json();
  },

  async likeUser(otherUserId) {
    const res = await fetch(`/api/matches/${otherUserId}/like`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      console.error('likeUser failed', res.status);
      throw new Error('likeUser failed');
    }
    return res.json(); // { isMatch, roomId? }
  },
  async getCurrentlyPlaying(userId) {
    const res = await fetch(`/api/spotify/currently-playing?userId=${userId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch currently playing');
    return res.json();
  },
  async getEventRsvps(ids) {
    const q = encodeURIComponent(ids.join(','));
    const res = await fetch(`/api/events/rsvp?ids=${q}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load RSVPs');
    return res.json(); 
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
};


