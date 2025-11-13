// client/src/api/index.js

export const api = {
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
};
