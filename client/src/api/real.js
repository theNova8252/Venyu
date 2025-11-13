// src/api/real.js
const baseFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
};

export const realAPI = {
  // User-Profil (für deinen UserStore / SwipeCard)
  async getMe() {
    // Annahme: /api/user/me gibt dein erweitertes Profil mit topArtists, genres etc.
    return baseFetch('/api/user/me');
  },

  // Matches – aktuell keine echte Route => stabil: leeres Array
  async getMatches() {
    return [];
  },

  // Events – aktuell keine echte Route => stabil: leeres Array
  async getEventsNearby() {
    return [];
  },

  // Like – vorerst no-op (kein Fehler)
  async likeMatch(/* id */) {
    return;
  },

  // 💬 Chat
  async getChatMessages(roomId) {
    return baseFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`);
  },

  async sendChatMessage(roomId, text, senderId) {
    return baseFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, senderId }),
    });
  },
};
