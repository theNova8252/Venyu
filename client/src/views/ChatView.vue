<template>
  <q-page class="chat-page column">
    <div class="chat-header row items-center q-pa-md">
      <q-btn flat round dense icon="arrow_back" @click="$router.back()" />
      <div class="q-ml-md">
        <div class="text-subtitle1">Chat</div>
        <div class="text-caption text-grey-6">Room: {{ roomId }}</div>
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
import { onMounted, ref, computed, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useChatStore } from "@/stores/chat";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const chatStore = useChatStore();
const authStore = useAuthStore();

const roomId = computed(() => route.params.roomId);
const messages = computed(() => chatStore.messages(roomId.value));
const loading = computed(() => chatStore.loading);
const draft = ref("");
const sending = ref(false);

let pollTimer = null;

async function fetchMessages() {
  await chatStore.fetchMessages(roomId.value);
}

onMounted(async () => {
  await fetchMessages();
  pollTimer = setInterval(fetchMessages, 2000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
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

  sending.value = true;
  try {
    await chatStore.sendMessage(roomId.value, text);
    draft.value = "";
  } finally {
    sending.value = false;
  }
}

// wird jetzt nur noch benutzt, falls du Fallback willst
function isOwnMessage(m) {
  return !!m.isMine;
}
</script>

<style scoped>
.chat-page {
  height: 100vh;
}

.chat-messages {
  background: #0a0a0f;
}

.self-message {
  display: flex;
  justify-content: flex-end;
}

.other-message {
  display: flex;
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.self-message .bubble {
  background: #7c3aed;
}

.chat-input {
  background: #101018;
}
</style>
