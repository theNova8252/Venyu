// src/api/real.js
const baseFetch = async (url, options = {}) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const txt = await res.text().catch(() => "");
  return txt ? JSON.parse(txt) : null;
};

export const realAPI = {
  async getMe() {
    return baseFetch("/api/user/me");
  },

  async getMatchesCandidates() {
    return baseFetch("/api/matches/candidates");
  },

  // ✅ WICHTIG: jetzt wird wirklich gespeichert
  async likeMatch(otherUserId) {
    return baseFetch(`/api/matches/${encodeURIComponent(otherUserId)}/like`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  // Chats = Matches die wirklich existieren
  async getChatRooms() {
    return baseFetch("/api/chat/rooms");
  },

  async getChatMessages(roomId) {
    return baseFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`);
  },
};
