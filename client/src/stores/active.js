// stores/active.js
import { defineStore } from 'pinia';

export const usePresenceStore = defineStore('presence', {
  state: () => ({
    onlineUserIds: [],   // Array von User-IDs
    socket: null,
    connected: false,
  }),
  getters: {
    isOnline: (state) => (userId) =>
      !!userId && state.onlineUserIds.includes(String(userId)),
  },
  actions: {
    connect() {
      if (this.connected) return;

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

      let host;
      if (import.meta.env.DEV) {
        host = '127.0.0.1:5000'; // Backend
      } else {
        host = window.location.host;
      }

      const url = `${protocol}://${host}/ws/presence`;

      const socket = new WebSocket(url);
      this.socket = socket;

      socket.onopen = () => {
        console.log('Presence WS connected');
        this.connected = true;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'presence_snapshot') {
            this.onlineUserIds = (data.users || []).map(String);
          }

          if (data.type === 'presence') {
            const id = String(data.userId);
            if (data.isOnline) {
              if (!this.onlineUserIds.includes(id)) {
                this.onlineUserIds = [...this.onlineUserIds, id];
              }
            } else {
              this.onlineUserIds = this.onlineUserIds.filter(
                (u) => u !== id,
              );
            }
          }
        } catch (e) {
          console.error('Presence message parse error', e);
        }
      };

      socket.onclose = () => {
        console.log('Presence WS closed');
        this.connected = false;
        this.socket = null;
      };

      socket.onerror = (err) => {
        console.error('Presence WS error', err);
      };
    },
  },
});
