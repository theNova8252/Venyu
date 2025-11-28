<template>
  <q-page class="chat-page column">
    <div class="chat-header row items-center q-pa-md">
      <q-btn flat round dense icon="arrow_back" @click="$router.back()" />
      <div class="q-ml-md">
        <div class="text-subtitle1">Chat</div>
        <div
          class="text-caption"
          :class="otherIsOnline ? 'text-positive' : 'text-grey-6'"
        >
          {{ otherIsOnline ? "Online" : "Offline" }}
        </div>
      </div>
    </div>

    <q-separator />

    <div class="chat-messages col scroll q-pa-md">
      <div
        v-for="m in messages"
        :key="m.id"
        class="q-mb-sm"
        :class="{
          'self-message': m.isMine,
          'other-message': !m.isMine,
        }"
      >
        <div class="bubble">
          <div class="text-body2">{{ m.text }}</div>
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ formatTime(m.createdAt) }}
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center text-grey-6 q-mt-sm">
        Loading...
      </div>
    </div>

    <div class="chat-input row items-center q-pa-sm">
      <q-input
        v-model="draft"
        class="col q-mr-sm"
        rounded
        outlined
        dense
        placeholder="Nachricht schreiben..."
        :disable="sending"
        @keyup.enter="onSend"
      />
      <q-btn
        round
        icon="send"
        color="primary"
        :loading="sending"
        :disable="!draft.trim()"
        @click="onSend"
      />
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref, computed, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useChatStore } from "@/stores/chat";
import { useAuthStore } from "@/stores/auth";
import { usePresenceStore } from "@/stores/active";

const route = useRoute();
const chatStore = useChatStore();
const authStore = useAuthStore();
const presenceStore = usePresenceStore();

const roomId = computed(() => route.params.roomId);
const messages = computed(() => chatStore.messages(roomId.value));
const loading = computed(() => chatStore.loading);
const draft = ref("");
const sending = ref(false);

let socket = null;

// --- Online-Status des anderen Nutzers ---
const currentUserId = computed(() => authStore.user?.id ?? null);

const otherUserId = computed(() => {
  const r = roomId.value;
  if (!r) return null;

  const parts = String(r).split("__");
  const me = currentUserId.value ? String(currentUserId.value) : null;

  if (me) {
    const other = parts.find((p) => p !== me);
    return other || parts[0] || null;
  }
  return parts[0] || null;
});

const otherIsOnline = computed(() =>
  otherUserId.value ? presenceStore.isOnline(otherUserId.value) : false
);

// --- Chat Nachrichten laden / WebSocket ---

async function fetchMessages() {
  await chatStore.fetchMessages(roomId.value);
}

function connectWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";

  let host;
  if (import.meta.env.DEV) {
    host = "127.0.0.1:5000";
  } else {
    host = window.location.host;
  }

  const wsUrl = `${protocol}://${host}/ws/chat?roomId=${encodeURIComponent(
    roomId.value
  )}`;

  console.log("Connecting WS:", wsUrl);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("WS connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "chat_message") {
        const msg = data.message;
        chatStore.addMessage(roomId.value, msg);
      }
    } catch (e) {
      console.error("WS message parse error", e);
    }
  };

  socket.onclose = (ev) => {
    console.log("WS closed", ev.code, ev.reason);
  };

  socket.onerror = (err) => {
    console.error("WS error", err);
  };
}

onMounted(async () => {
  presenceStore.connect();   // Presence-Verbindung aufbauen
  await fetchMessages();     // Verlauf per HTTP
  connectWebSocket();        // Realtime
});

watch(roomId, async () => {
  await fetchMessages();
  connectWebSocket();
});

onUnmounted(() => {
  if (socket) {
    socket.close();
  }
});

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function onSend() {
  const text = draft.value.trim();
  if (!text) return;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket not connected, cannot send");
    return;
  }

  sending.value = true;
  try {
    socket.send(
      JSON.stringify({
        type: "chat_message",
        text,
      })
    );
    draft.value = "";
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.chat-page {
  height: 100vh;
}

.chat-messages {
  background: #ffffff;
}

.self-message {
  display: flex;
  justify-content: flex-end;
}
</style>