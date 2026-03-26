<template>
  <q-page class="notifications-page">
    <div class="bg-mesh">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="bg-noise"></div>
    </div>

    <div class="notifications-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">Notifications</h2>
          <p class="page-subtitle">{{ items.length }} updates in your inbox</p>
        </div>
        <button v-if="items.length" class="clear-btn" @click="clearNotifications">Clear All</button>
      </div>

      <div v-if="!items.length" class="empty-state liquid-glass">
        <q-icon name="notifications_off" size="50px" class="empty-icon" />
        <h3 class="empty-title">Nothing new right now</h3>
        <p class="empty-sub">New matches and app updates will show up here.</p>
      </div>

      <div v-else class="notification-list">
        <article
          v-for="item in items"
          :key="item.id"
          class="notification-card liquid-glass"
          @click="openNotification(item)"
        >
          <div class="notification-icon" :class="`notification-icon--${item.type}`">
            <q-icon :name="item.icon || 'notifications'" size="22px" />
          </div>

          <div class="notification-body">
            <div class="notification-top">
              <h3 class="notification-title">{{ item.title }}</h3>
              <span class="notification-time">{{ formatNotificationDate(item.createdAt) }}</span>
            </div>
            <p class="notification-message">{{ item.message }}</p>
          </div>

          <q-icon name="chevron_right" size="20px" class="notification-arrow" />
        </article>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '@/stores/notifications';

const router = useRouter();
const notifications = useNotificationsStore();

const items = computed(() => notifications.items);

const formatNotificationDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString();
};

const openNotification = (item) => {
  notifications.markRead(item.id);

  if (item.roomId) {
    router.push({ name: 'ChatView', params: { roomId: item.roomId } });
    return;
  }

  router.push({ name: 'Home' });
};

const clearNotifications = () => {
  notifications.clear();
};

onMounted(() => {
  notifications.markAllRead();
});
</script>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e4e4e7;
  position: relative;
  overflow-x: hidden;
}

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
  right: -100px;
  top: -80px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
}

.orb-2 {
  width: 320px;
  height: 320px;
  left: -60px;
  bottom: -60px;
  background: linear-gradient(135deg, #ec4899, #ef4444);
}

.bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.notifications-container {
  position: relative;
  z-index: 1;
  max-width: 820px;
  margin: 0 auto;
  padding: 22px 20px 40px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.page-title {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.72) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 0.84rem;
  color: rgba(255, 255, 255, 0.42);
}

.clear-btn {
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.68);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.liquid-glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(1.4);
  border-radius: 22px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.notification-card:hover {
  transform: translateY(-1px);
  border-color: rgba(139, 92, 246, 0.16);
  background: rgba(255, 255, 255, 0.06);
}

.notification-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon--match {
  background: rgba(236, 72, 153, 0.14);
  color: #f472b6;
}

.notification-icon--system {
  background: rgba(59, 130, 246, 0.14);
  color: #60a5fa;
}

.notification-body {
  min-width: 0;
  flex: 1;
}

.notification-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notification-title {
  margin: 0;
  font-size: 0.96rem;
  font-weight: 700;
  color: #fff;
}

.notification-time {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.34);
  white-space: nowrap;
}

.notification-message {
  margin: 6px 0 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.52);
}

.notification-arrow {
  color: rgba(255, 255, 255, 0.18);
  flex-shrink: 0;
  align-self: center;
}

.empty-state {
  padding: 54px 24px;
  text-align: center;
}

.empty-icon {
  color: rgba(139, 92, 246, 0.42);
}

.empty-title {
  margin: 12px 0 0;
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.84);
}

.empty-sub {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.42);
}

@media (max-width: 520px) {
  .notifications-container {
    padding: 12px 12px 32px;
  }

  .page-header {
    flex-direction: column;
  }

  .notification-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
