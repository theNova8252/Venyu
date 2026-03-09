<template>
  <q-page class="chat-list-page">
    <!-- Background -->
    <div class="bg-mesh">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="bg-noise"></div>
    </div>

    <div class="chat-list-container">
      <!-- Header -->
      <div class="page-header">
        <h2 class="page-title">Messages</h2>
        <p class="page-subtitle">{{ list.length }} conversation{{ list.length !== 1 ? 's' : '' }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state liquid-glass">
        <div v-for="i in 3" :key="i" class="chat-item-skeleton">
          <q-skeleton type="QAvatar" size="48px" />
          <div class="skel-lines">
            <q-skeleton type="text" width="40%" />
            <q-skeleton type="text" width="65%" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="list.length === 0" class="empty-state liquid-glass">
        <q-icon name="chat_bubble_outline" size="48px" class="empty-icon" />
        <h3 class="empty-title">No conversations yet</h3>
        <p class="empty-sub">Match with someone to start chatting</p>
        <q-btn
          unelevated
          no-caps
          class="empty-cta"
          icon="swipe"
          label="Start Swiping"
          to="/swipe"
        />
      </div>

      <!-- Chat list -->
      <div v-else class="chat-list">
        <div
          v-for="c in list"
          :key="c.roomId"
          class="chat-item liquid-glass"
          @click="openChat(c.roomId)"
        >
          <div class="chat-avatar-wrap">
            <q-avatar size="48px" class="chat-avatar">
              <img :src="c.user.avatar" />
            </q-avatar>
            <div
              class="presence-dot"
              :class="isUserOnline(c.user.id) ? 'online' : 'offline'"
            ></div>
          </div>

          <div class="chat-info">
            <div class="chat-top-row">
              <span class="chat-name">{{ c.user.name }}</span>
              <span class="chat-status" :class="{ 'is-online': isUserOnline(c.user.id) }">
                {{ isUserOnline(c.user.id) ? 'Online' : offlineSinceText(c.user.id) }}
              </span>
            </div>
            <p class="chat-bio" v-if="c.user.bio">{{ c.user.bio }}</p>
          </div>

          <q-icon name="chevron_right" size="20px" class="chat-chevron" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, computed } from "vue";
import { useChatsStore } from "@/stores/chats";
import { useRouter } from "vue-router";
import { usePresenceStore } from "@/stores/active";

const chats = useChatsStore();
const router = useRouter();
const presenceStore = usePresenceStore();

onMounted(() => {
  presenceStore.connect();
  chats.fetchChats();
});

const list = computed(() => chats.list);
const loading = computed(() => chats.loading);

const isUserOnline = (userId) => presenceStore.isOnline(userId);
const offlineSinceText = (userId) => presenceStore.offlineSinceText(userId);

function openChat(roomId) {
  router.push({ name: "ChatView", params: { roomId } });
}
</script>

<style scoped lang="scss">
.chat-list-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e4e4e7;
  position: relative;
  overflow-x: hidden;
}

/* ─── Background ─────────────────────────────────────── */
.bg-mesh {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(120px);
  opacity: 0.2;
}

.orb-1 {
  width: 420px;
  height: 420px;
  right: -80px;
  top: -80px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
}

.orb-2 {
  width: 350px;
  height: 350px;
  left: -60px;
  bottom: -60px;
  background: linear-gradient(135deg, #ec4899, #f43f5e);
}

.bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* ─── Container ──────────────────────────────────────── */
.chat-list-container {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 20px 40px;
}

/* ─── Header ─────────────────────────────────────────── */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.4);
}

/* ─── Liquid Glass ───────────────────────────────────── */
.liquid-glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

/* ─── Chat list ──────────────────────────────────────── */
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(139, 92, 246, 0.15);
  }
}

/* ─── Avatar ─────────────────────────────────────────── */
.chat-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.chat-avatar {
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.presence-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #0a0a0f;

  &.online {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  }

  &.offline {
    background: rgba(255, 255, 255, 0.2);
  }
}

/* ─── Chat info ──────────────────────────────────────── */
.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.chat-name {
  font-weight: 700;
  font-size: 0.95rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-status {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  flex-shrink: 0;

  &.is-online {
    color: #22c55e;
  }
}

.chat-bio {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-chevron {
  color: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

/* ─── Empty state ────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  color: rgba(139, 92, 246, 0.4);
  margin-bottom: 16px;
}

.empty-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

.empty-sub {
  margin: 6px 0 20px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
}

.empty-cta {
  background: linear-gradient(135deg, #8b5cf6, #a855f7 50%, #ec4899) !important;
  color: #fff !important;
  padding: 10px 22px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.85rem;
}

/* ─── Loading skeleton ───────────────────────────────── */
.loading-state {
  padding: 16px 18px;
}

.chat-item-skeleton {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
}

.skel-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ─── Mobile ─────────────────────────────────────────── */
@media (max-width: 520px) {
  .chat-list-container {
    padding: 12px 12px 32px;
  }
}
</style>
