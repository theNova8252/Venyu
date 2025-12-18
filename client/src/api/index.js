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

  // currently playing

  
};

