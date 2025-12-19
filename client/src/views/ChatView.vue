<template>
  <q-page class="chat-page column">
    <div class="chat-header row items-center q-pa-md">
      <q-btn flat round dense icon="arrow_back" @click="$router.back()" />
      <div class="q-ml-md">
        <div class="text-subtitle1">Chat</div>
        <div class="text-caption" :class="otherIsOnline ? 'text-positive' : 'text-grey-6'">
          {{ otherIsOnline ? "Online" : "Offline" }}
        </div>
        <div v-if="otherTyping" class="text-caption text-grey-6">tippt...</div>
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
            <span v-if="m.isMine" class="q-ml-sm">
              <span v-if="m.readByOther">✓✓</span>
              <span v-else>✓</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center text-grey-6 q-mt-sm">Loading...</div>
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
        @keydown.enter.prevent="onSend"
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
  getOrCreateIdentity,
  exportPublicJwk,
  importRemotePublicJwk,
  deriveAesKey,
  encryptText,
  decryptText,
} from "@/api/e2ee";

const route = useRoute();
const chatStore = useChatStore();
const authStore = useAuthStore();
const presenceStore = usePresenceStore();

const roomId = computed(() => route.params.roomId);
const messages = computed(() => chatStore.messages(roomId.value));
const loading = computed(() => chatStore.loading);

const draft = ref("");
const sending = ref(false);
const otherTyping = ref(false);

let socket = null;

// E2EE
let myKeyPair = null;
let aesKey = null;

const currentUserId = computed(() => authStore.user?.id ?? null);

const otherUserId = computed(() => {
  const r = roomId.value;
  if (!r) return null;

  const parts = String(r).split("__");
  const me = currentUserId.value ? String(currentUserId.value) : null;
  if (!me) return parts[0] || null;

  return parts.find((p) => p !== me) || null;
});

const otherIsOnline = computed(() =>
  otherUserId.value ? presenceStore.isOnline(otherUserId.value) : false
);

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ✅ retry decrypt + setzt readByOther aus DB (readAt)
async function decryptAllLoadedMessages() {
  if (!aesKey) return;

  const arr = chatStore.messages(roomId.value);
  for (const m of arr) {
    m.isMine = String(m.senderId) === String(currentUserId.value);

    // ✅ wichtig fürs ✓✓: wenn ich Sender bin und readAt existiert => gelesen
    if (m.isMine) {
      m.readByOther = !!m.readAt;
    }

    if (m.ciphertext && m.iv) {
      if (m._decrypted === true) continue;

      try {
        m.text = await decryptText(aesKey, m.ciphertext, m.iv);
        m._decrypted = true;
      } catch {
        m.text = "🔒 (Entschlüsselung fehlgeschlagen)";
        m._decrypted = false;
      }
    }
  }
}

async function fetchMessages() {
  await chatStore.fetchMessages(roomId.value, currentUserId.value);
  await decryptAllLoadedMessages();

  // ✅ Beim Öffnen: alles bis zur letzten fremden Nachricht als gelesen melden
  sendReadUpToLastForeignMessage();
}

// ✅ PublicKey Upload nur 1x
async function ensureE2eeKeyReadyViaRest() {
  if (!currentUserId.value) return;

  if (!myKeyPair) myKeyPair = await getOrCreateIdentity(currentUserId.value);

  const flagKey = `e2ee_pub_uploaded_v1_${currentUserId.value}`;
  if (!localStorage.getItem(flagKey)) {
    try {
      const publicKeyJwk = await exportPublicJwk(myKeyPair);
      await fetch("/api/chat/e2ee/public-key", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKeyJwk }),
      });
      localStorage.setItem(flagKey, "1");
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId.value)}/peer-key`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.publicKeyJwk) {
        const theirPub = await importRemotePublicJwk(data.publicKeyJwk);
        aesKey = await deriveAesKey(myKeyPair, theirPub);
        await decryptAllLoadedMessages();
      }
    }
  } catch {
    // ignore
  }
}

async function sendMyPublicKeyWs() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  if (!myKeyPair) myKeyPair = await getOrCreateIdentity(currentUserId.value);

  const publicKeyJwk = await exportPublicJwk(myKeyPair);
  socket.send(JSON.stringify({ type: "key_exchange", publicKeyJwk }));
}

function connectChatWebSocket() {
  if (socket) socket.close();

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = import.meta.env.DEV ? "127.0.0.1:5000" : window.location.host;
  socket = new WebSocket(`${protocol}://${host}/ws/chat?roomId=${encodeURIComponent(roomId.value)}`);

  socket.onopen = async () => {
    if (!myKeyPair) myKeyPair = await getOrCreateIdentity(currentUserId.value);
    await sendMyPublicKeyWs();

    // ✅ beim Connect ebenfalls readUp senden (für Reload-Fälle)
    sendReadUpToLastForeignMessage();
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "key_exchange") {
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

      // ✅ DAS ist der Grund für ✓✓: read event verarbeiten
      if (data.type === "read") {
        chatStore.markReadUpTo(roomId.value, data.lastReadMessageId, currentUserId.value);
        return;
      }

      if (data.type === "chat_message") {
        const msg = data.message;

        msg.isMine = String(msg.senderId) === String(currentUserId.value);
        msg.readByOther = msg.isMine ? !!msg.readAt : false;

        if (aesKey && msg.ciphertext && msg.iv) {
          try {
            msg.text = await decryptText(aesKey, msg.ciphertext, msg.iv);
            msg._decrypted = true;
          } catch {
            msg.text = "🔒 (Entschlüsselung fehlgeschlagen)";
            msg._decrypted = false;
          }
        } else {
          msg.text = "🔒 (Key wird noch ausgehandelt...)";
          msg._decrypted = false;
        }

        chatStore.addMessage(roomId.value, msg, currentUserId.value);

        // ✅ Wenn ich eine fremde Nachricht sehe: read receipt senden
        if (!msg.isMine) {
          sendRead(msg.id);
        }
      }
    } catch (e) {
      console.error("WS parse error", e);
    }
  };

  socket.onclose = () => console.log("WS closed");
  socket.onerror = (e) => console.error("WS error", e);
}

function sendRead(messageId) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  if (!messageId) return;
  socket.send(JSON.stringify({ type: "read", lastReadMessageId: String(messageId) }));
}

function sendReadUpToLastForeignMessage() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const arr = chatStore.messages(roomId.value);
  if (!arr?.length) return;

  const lastForeign = [...arr]
    .reverse()
    .find((m) => String(m.senderId) !== String(currentUserId.value));

  if (!lastForeign) return;
  sendRead(lastForeign.id);
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
  }, 700);
}

async function onSend() {
  if (sending.value) return; // ✅ verhindert doppelt durch Click+Enter

  const text = draft.value.trim();
  if (!text) return;
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  if (!aesKey) {
    await ensureE2eeKeyReadyViaRest();
    if (!aesKey) {
      await sendMyPublicKeyWs();
      return;
    }
  }

  sending.value = true;
  try {
    const { ciphertext, iv } = await encryptText(aesKey, text);
    socket.send(JSON.stringify({ type: "chat_message", ciphertext, iv, version: "aes-gcm-v1" }));
    draft.value = "";
    socket.send(JSON.stringify({ type: "typing", isTyping: false }));
  } finally {
    sending.value = false;
  }
}

onMounted(async () => {
  await authStore.fetchMe();
  presenceStore.connect();

  await fetchMessages();
  await ensureE2eeKeyReadyViaRest();
  connectChatWebSocket();
});

watch(roomId, async () => {
  await fetchMessages();
  await ensureE2eeKeyReadyViaRest();
  connectChatWebSocket();
});

onUnmounted(() => {
  if (socket) socket.close();
});
</script>

<style scoped>
.chat-page { height: 100vh; }
.chat-messages { background: #ffffff; }
.self-message { display: flex; justify-content: flex-end; }
.bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 12px;
  background: #eaeaea;
}
.self-message .bubble {
  background: #cfe9ff;
}
</style>
