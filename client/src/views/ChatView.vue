<template>
  <q-page class="chat-page column">
    <div class="chat-header row items-center q-pa-md">
      <q-btn flat round dense icon="arrow_back" @click="$router.back()" />
      <div class="q-ml-md">
        <div class="text-subtitle1">Chat</div>

        <div class="text-caption" :class="otherIsOnline ? 'text-positive' : 'text-grey-6'">
          {{ otherIsOnline ? "Online" : "Offline" }}
        </div>

        <div v-if="otherTyping" class="text-caption text-grey-6">
          tippt...
        </div>

        <div v-if="countdownText" class="text-caption text-primary q-mt-xs">
          {{ countdownText }}
        </div>

        <q-btn
  class="q-mt-sm"
  size="sm"
  outline
  :disable="!topTrack"
  :label="topTrack ? `Sync: ${topTrack.name}` : 'Kein Track verfügbar'"
  @click="topTrack && startSyncedSong(topTrack.uri, 3000)"
/>
<div v-if="topTrack" class="text-caption text-grey-7 q-mt-xs">
   {{ topTrack.name }} – {{ topTrack.artists.map(a => a.name).join(', ') }}
</div>

      </div>
    </div>

    <q-separator />

    <div class="chat-messages col scroll q-pa-md">
      <div
        v-for="m in messages"
        :key="m.id"
        class="q-mb-sm"
        :class="{ 'self-message': m.isMine, 'other-message': !m.isMine }"
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
        @update:model-value="onTyping"
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


import {
  generateIdentity,
  exportPublicJwk,
  importRemotePublicJwk,
  deriveAesKey,
  encryptText,
  decryptText,
} from "@/api/e2ee";

import { makeSpotifyWs, measureServerOffset, spotifyPlay } from "@/api/spotifySync";

const route = useRoute();
const chatStore = useChatStore();
const authStore = useAuthStore();
const topTrack = computed(() => authStore.user?.topTracks?.[0] || null);
const presenceStore = usePresenceStore();

const roomId = computed(() => route.params.roomId);
const messages = computed(() => chatStore.messages(roomId.value));
const loading = computed(() => chatStore.loading);

const draft = ref("");
const sending = ref(false);

const otherTyping = ref(false);
const countdownText = ref("");

let socket = null;

// E2EE key state
let myKeyPair = null;
let aesKey = null;
let sentMyPub = false;

// Spotify sync WS
let spotifySocket = null;
let serverOffsetMs = 0;

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

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function decryptAllLoadedMessages() {
  if (!aesKey) return;

  const arr = chatStore.messages(roomId.value);
  for (const m of arr) {
    m.isMine = String(m.senderId) === String(currentUserId.value);

    if (!m.text && m.ciphertext && m.iv) {
      try {
        m.text = await decryptText(aesKey, m.ciphertext, m.iv);
      } catch {
        m.text = "🔒 (Entschlüsselung fehlgeschlagen)";
      }
    }
  }
}

async function fetchMessages() {
  await chatStore.fetchMessages(roomId.value);
  await decryptAllLoadedMessages();
}

function connectChatWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    socket.close();
  }

  // reset per-room
  aesKey = null;
  sentMyPub = false;
  otherTyping.value = false;

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = import.meta.env.DEV ? "127.0.0.1:5000" : window.location.host;

  const wsUrl = `${protocol}://${host}/ws/chat?roomId=${encodeURIComponent(roomId.value)}`;
  socket = new WebSocket(wsUrl);

  socket.onopen = async () => {
    if (!myKeyPair) myKeyPair = await generateIdentity();

    if (!sentMyPub) {
      const publicKeyJwk = await exportPublicJwk(myKeyPair);
      socket.send(JSON.stringify({ type: "key_exchange", publicKeyJwk }));
      sentMyPub = true;
    }
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "key_exchange") {
        if (String(data.fromUserId) === String(currentUserId.value)) return;
        const theirPub = await importRemotePublicJwk(data.publicKeyJwk);
        aesKey = await deriveAesKey(myKeyPair, theirPub);
        await decryptAllLoadedMessages();
        return;
      }

      if (data.type === "typing") {
        if (String(data.fromUserId) === String(otherUserId.value)) {
          otherTyping.value = !!data.isTyping;
        }
        return;
      }

      if (data.type === "read") {
        // optional: could store read status in UI
        return;
      }

      if (data.type === "chat_message") {
        const msg = data.message;

        msg.isMine = String(msg.senderId) === String(currentUserId.value);

        if (aesKey && msg.ciphertext && msg.iv) {
          try {
            msg.text = await decryptText(aesKey, msg.ciphertext, msg.iv);
          } catch {
            msg.text = "🔒 (Entschlüsselung fehlgeschlagen)";
          }
        } else {
          msg.text = "🔒 (Key wird noch ausgehandelt...)";
        }

        chatStore.addMessage(roomId.value, msg);

        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: "read", lastReadMessageId: msg.id }));
        }
        return;
      }
    } catch (e) {
      console.error("WS message parse error", e);
    }
  };

  socket.onclose = (ev) => console.log("WS closed", ev.code, ev.reason);
  socket.onerror = (err) => console.error("WS error", err);
}

let typingTimer = null;
function onTyping() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({ type: "typing", isTyping: true }));
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "typing", isTyping: false }));
    }
  }, 800);
}

async function onSend() {
  const text = draft.value.trim();
  if (!text) return;

  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  if (!aesKey) {
    console.warn("No E2EE key yet (wait a second).");
    return;
  }

  sending.value = true;
  try {
    const { ciphertext, iv } = await encryptText(aesKey, text);

    socket.send(
      JSON.stringify({
        type: "chat_message",
        ciphertext,
        iv,
        version: "aes-gcm-v1",
      })
    );

    draft.value = "";
    socket.send(JSON.stringify({ type: "typing", isTyping: false }));
  } finally {
    sending.value = false;
  }
}

// ---- Spotify Sync ----
async function connectSpotifyWs() {
  if (spotifySocket && (spotifySocket.readyState === WebSocket.OPEN || spotifySocket.readyState === WebSocket.CONNECTING)) {
    spotifySocket.close();
  }

  countdownText.value = "";
  serverOffsetMs = 0;

  spotifySocket = makeSpotifyWs(roomId.value);

  spotifySocket.onopen = async () => {
    serverOffsetMs = await measureServerOffset(spotifySocket);
  };

  spotifySocket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "spotify_sync_start") {
        const { trackUri, startAt } = data;

        const now = Date.now() + serverOffsetMs;
        const msUntil = Math.max(0, startAt - now);

        // countdown text
        const startedAt = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startedAt;
          const left = Math.max(0, msUntil - elapsed);
          countdownText.value = left > 0 ? `Start in ${(left / 1000).toFixed(1)}s` : "";
          if (left > 0) requestAnimationFrame(tick);
        };
        tick();

        setTimeout(async () => {
          try {
            await spotifyPlay(trackUri);
            countdownText.value = "";
          } catch (e) {
            console.error(e);
            countdownText.value = "";
          }
        }, msUntil);

        return;
      }
    } catch (e) {
      console.error("spotify ws parse error", e);
    }
  };

  spotifySocket.onclose = () => {};
  spotifySocket.onerror = () => {};
}

function startSyncedSong(trackUri, countdownMs = 3000) {
  if (!spotifySocket || spotifySocket.readyState !== WebSocket.OPEN) return;
  spotifySocket.send(JSON.stringify({ type: "spotify_start", trackUri, countdownMs }));
}

onMounted(async () => {
  await authStore.fetchMe();
  presenceStore.connect();
  await fetchMessages();
  connectChatWebSocket();
  await connectSpotifyWs();
});

watch(roomId, async () => {
  await fetchMessages();
  connectChatWebSocket();
  await connectSpotifyWs();
});

onUnmounted(() => {
  if (socket) socket.close();
  if (spotifySocket) spotifySocket.close();
});
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
