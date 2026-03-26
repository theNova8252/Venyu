<template>
  <q-page class="matches-page">
    <div class="bg-mesh">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="bg-noise"></div>
    </div>

    <div class="matches-container">
      <div class="page-header">
        <h2 class="page-title">Matches</h2>
        <p class="page-subtitle">{{ matches.length }} people matched with you</p>
      </div>

      <div v-if="loading" class="loading-state liquid-glass">
        <q-skeleton v-for="i in 3" :key="i" height="88px" />
      </div>

      <div v-else-if="!matches.length" class="empty-state liquid-glass">
        <q-icon name="favorite_border" size="50px" class="empty-icon" />
        <h3 class="empty-title">No matches yet</h3>
        <p class="empty-sub">Swipe a bit and your matches will show up here.</p>
        <q-btn unelevated no-caps class="empty-cta" icon="swipe" label="Start Swiping" to="/swipe" />
      </div>

      <div v-else class="match-grid">
        <article v-for="match in matches" :key="match.roomId" class="match-card liquid-glass">
          <div class="match-card__top">
            <div class="match-card__identity">
              <div class="avatar-wrap">
                <q-avatar size="62px" class="match-avatar">
                  <img v-if="match.user.avatar" :src="match.user.avatar" />
                  <div v-else class="avatar-fallback">{{ initials(match.user.name) }}</div>
                </q-avatar>
                <span
                  class="presence-dot"
                  :class="presenceStore.isOnline(match.user.id) ? 'online' : 'offline'"
                ></span>
              </div>

              <div class="match-meta">
                <div class="match-name-row">
                  <h3 class="match-name">
                    {{ match.user.name }}
                    <span v-if="match.user.age != null" class="match-age">, {{ match.user.age }}</span>
                  </h3>
                  <span class="match-status" :class="{ 'match-status--online': presenceStore.isOnline(match.user.id) }">
                    {{ presenceStore.isOnline(match.user.id) ? 'Online' : presenceStore.offlineSinceText(match.user.id) }}
                  </span>
                </div>
                <p class="match-bio">
                  {{ match.user.bio || 'Music match ready for the first chat.' }}
                </p>
                <div v-if="badgesFor(match).length" class="badge-row">
                  <span
                    v-for="badge in badgesFor(match)"
                    :key="badge.id"
                    class="music-badge"
                    :class="`music-badge--${badge.tone}`"
                  >
                    {{ badge.title }}
                  </span>
                </div>
              </div>
            </div>

            <div class="match-actions">
              <q-btn
                unelevated
                no-caps
                class="chat-btn"
                icon="chat_bubble"
                label="Chat"
                :to="{ name: 'ChatView', params: { roomId: match.roomId } }"
              />
              <button class="profile-toggle" @click="toggleProfile(match.roomId)">
                {{ expandedRoomId === match.roomId ? 'Hide Profile' : 'Show Profile' }}
              </button>
            </div>
          </div>

          <transition name="expand">
            <div v-if="expandedRoomId === match.roomId" class="match-card__profile">
              <div class="profile-stat">
                <span class="profile-stat__label">Visability</span>
                <strong class="profile-stat__value">Matched</strong>
              </div>
              <div class="profile-stat" v-if="match.user.genres?.length">
                <span class="profile-stat__label">Genres</span>
                <strong class="profile-stat__value">{{ match.user.genres.slice(0, 3).join(', ') }}</strong>
              </div>
              <div class="profile-stat" v-if="match.user.audioFeatures?.danceability != null">
                <span class="profile-stat__label">Danceability</span>
                <strong class="profile-stat__value">{{ Math.round(match.user.audioFeatures.danceability * 100) }}%</strong>
              </div>
              <div class="profile-stat" v-if="match.user.audioFeatures?.energy != null">
                <span class="profile-stat__label">Energy</span>
                <strong class="profile-stat__value">{{ Math.round(match.user.audioFeatures.energy * 100) }}%</strong>
              </div>
            </div>
          </transition>
        </article>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useChatsStore } from '@/stores/chats';
import { usePresenceStore } from '@/stores/active';
import { buildMusicBadges } from '@/services/musicBadges';

const chatsStore = useChatsStore();
const presenceStore = usePresenceStore();
const expandedRoomId = ref(null);

const matches = computed(() => chatsStore.list);
const loading = computed(() => chatsStore.loading);

const initials = (name = '?') =>
  String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

const badgesFor = (match) => buildMusicBadges(match?.user || {}, 3);

const toggleProfile = (roomId) => {
  expandedRoomId.value = expandedRoomId.value === roomId ? null : roomId;
};

onMounted(async () => {
  presenceStore.connect();
  await chatsStore.fetchChats();
});
</script>

<style scoped>
.matches-page {
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
  opacity: 0.22;
}

.orb-1 {
  width: 440px;
  height: 440px;
  right: -90px;
  top: -100px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
}

.orb-2 {
  width: 360px;
  height: 360px;
  left: -80px;
  bottom: -80px;
  background: linear-gradient(135deg, #ec4899, #ef4444);
}

.bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.matches-container {
  position: relative;
  z-index: 1;
  max-width: 980px;
  margin: 0 auto;
  padding: 22px 20px 40px;
}

.page-header {
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

.liquid-glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(1.4);
  border-radius: 22px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.loading-state {
  padding: 18px;
}

.match-grid {
  display: grid;
  gap: 14px;
}

.match-card {
  padding: 18px;
}

.match-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.match-card__identity {
  display: flex;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.match-avatar {
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.14);
  color: #fff;
  font-weight: 700;
}

.presence-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 2px solid #0a0a0f;
}

.presence-dot.online {
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.45);
}

.presence-dot.offline {
  background: rgba(255, 255, 255, 0.24);
}

.match-meta {
  min-width: 0;
  flex: 1;
}

.match-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.match-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.match-age {
  color: rgba(255, 255, 255, 0.38);
  font-weight: 500;
}

.match-status {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.36);
  white-space: nowrap;
}

.match-status--online {
  color: #22c55e;
}

.match-bio {
  margin: 6px 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.48);
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.music-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.music-badge--chill {
  background: rgba(6, 182, 212, 0.14);
  border-color: rgba(103, 232, 249, 0.18);
  color: #67e8f9;
}

.music-badge--beast {
  background: rgba(249, 115, 22, 0.14);
  border-color: rgba(251, 146, 60, 0.2);
  color: #fdba74;
}

.music-badge--vibe {
  background: rgba(236, 72, 153, 0.14);
  border-color: rgba(244, 114, 182, 0.2);
  color: #f9a8d4;
}

.match-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.chat-btn {
  background: linear-gradient(135deg, #8b5cf6, #ec4899) !important;
  color: #fff !important;
  border-radius: 14px;
  font-weight: 700;
}

.profile-toggle {
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.66);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
}

.profile-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.match-card__profile {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.profile-stat {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.profile-stat__label {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.34);
}

.profile-stat__value {
  display: block;
  margin-top: 5px;
  font-size: 0.9rem;
  color: #fff;
}

.empty-state {
  padding: 52px 24px;
  text-align: center;
}

.empty-icon {
  color: rgba(139, 92, 246, 0.42);
}

.empty-title {
  margin: 12px 0 0;
  font-size: 1.15rem;
  color: rgba(255, 255, 255, 0.82);
}

.empty-sub {
  margin: 8px 0 20px;
  color: rgba(255, 255, 255, 0.42);
}

.empty-cta {
  background: linear-gradient(135deg, #8b5cf6, #a855f7 50%, #ec4899) !important;
  color: #fff !important;
  border-radius: 14px;
  font-weight: 700;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.22s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 720px) {
  .match-card__top {
    flex-direction: column;
  }

  .match-actions {
    width: 100%;
    align-items: stretch;
  }

  .match-card__profile {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .matches-container {
    padding: 12px 12px 32px;
  }

  .match-card__identity {
    flex-direction: column;
  }

  .match-name-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
