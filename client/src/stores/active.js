// stores/active.js
import { defineStore } from "pinia";

const LS_KEY = "presence_offline_since_v1";

function loadMap() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function saveMap(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map || {}));
  } catch {
    // ignore
  }
}

function toIsoMaybe(v) {
  try {
    const d = v ? new Date(v) : new Date();
    const t = d.getTime();
    if (!Number.isFinite(t)) return null;
    return new Date(t).toISOString();
  } catch {
    return null;
  }
}

function formatAgo(isoString) {
  if (!isoString) return "unbekannt";

  const ts = new Date(isoString).getTime();
  if (!Number.isFinite(ts)) return "unbekannt";

  const diffMs = Date.now() - ts;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 5) return "gerade eben";
  if (diffSec < 60) return `seit ${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `seit ${diffMin} Min`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `seit ${diffHr} Std`;

  const diffDays = Math.floor(diffHr / 24);
  return `seit ${diffDays} Tg`;
}

function formatDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const usePresenceStore = defineStore("presence", {
  state: () => ({
    onlineUserIds: [],
    offlineSinceByUserId: loadMap(), // { [userId]: ISOString }
    socket: null,
    connected: false,
  }),

  getters: {
    isOnline: (state) => (userId) =>
      !!userId && state.onlineUserIds.includes(String(userId)),

    offlineSince: (state) => (userId) => {
      const id = String(userId || "");
      return state.offlineSinceByUserId?.[id] || null;
    },

    offlineSinceText: (state) => (userId) => {
      const id = String(userId || "");
      return formatAgo(state.offlineSinceByUserId?.[id] || null);
    },

    offlineSinceDateTime: (state) => (userId) => {
      const id = String(userId || "");
      return formatDateTime(state.offlineSinceByUserId?.[id] || null);
    },
  },

  actions: {
    connect() {
      if (this.connected) return;

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const host = import.meta.env.DEV ? "127.0.0.1:5000" : window.location.host;
      const url = `${protocol}://${host}/ws/presence`;

      const socket = new WebSocket(url);
      this.socket = socket;

      socket.onopen = () => {
        console.log("Presence WS connected");
        this.connected = true;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "presence_snapshot") {
            this.onlineUserIds = (data.users || []).map(String);
            // optional: wenn backend später offlineSince mitschickt:
            // data.offlineSince = { userId: iso }
            if (data.offlineSince && typeof data.offlineSince === "object") {
              for (const [uid, iso] of Object.entries(data.offlineSince)) {
                const v = toIsoMaybe(iso);
                if (v) this.offlineSinceByUserId[String(uid)] = v;
              }
              saveMap(this.offlineSinceByUserId);
            }
            return;
          }

          if (data.type === "presence") {
            const id = String(data.userId);

            if (data.isOnline) {
              if (!this.onlineUserIds.includes(id)) {
                this.onlineUserIds = [...this.onlineUserIds, id];
              }
              // wenn user online wird, löschen wir offlineSince NICHT zwingend,
              // damit wir weiterhin "seit ... offline" für später haben.
              // (optional könntest du hier löschen)
              return;
            }

            // offline event:
            this.onlineUserIds = this.onlineUserIds.filter((u) => u !== id);

            // Backend kann optional lastSeenAt/offlineSince senden:
            const iso = toIsoMaybe(data.offlineSince || data.lastSeenAt || new Date());
            if (iso) {
              this.offlineSinceByUserId[id] = iso;
              saveMap(this.offlineSinceByUserId);
            }
          }
        } catch (e) {
          console.error("Presence message parse error", e);
        }
      };

      socket.onclose = () => {
        console.log("Presence WS closed");
        this.connected = false;
        this.socket = null;
      };

      socket.onerror = (err) => {
        console.error("Presence WS error", err);
      };
    },
  },
});
