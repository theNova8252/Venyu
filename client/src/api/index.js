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
  // ✅ Candidates fürs Swipen
  async getMatches() {
    return baseFetch("/api/matches/candidates");
  },

  // ✅ Like + Match persistiert im Backend (Like-Tabelle)
  async likeUser(otherUserId) {
    return baseFetch(`/api/matches/${encodeURIComponent(otherUserId)}/like`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  // ✅ Chat Rooms (echte Matches)
  async getChatRooms() {
    return baseFetch("/api/chat/rooms");
  },

  // ✅ Chat history
  async getChatMessages(roomId) {
    return baseFetch(`/api/chat/rooms/${encodeURIComponent(roomId)}/messages`);
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
