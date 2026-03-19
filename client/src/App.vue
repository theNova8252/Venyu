<template>
  <q-layout view="hHh lpR fFf">
    <!-- HEADER -->
    <q-header elevated class="glass-header" v-if="isAuthenticated">
      <q-toolbar class="toolbar-inner">
        <!-- Left: menu + logo -->
        <div class="toolbar-left">
          <q-btn flat round dense icon="menu" @click="toggleLeftDrawer" class="menu-btn lt-md" />
          <router-link to="/home" class="logo-link">
            <div class="logo-container">
              <img src="@/assets/venyuUpscaled.png" alt="Venyu" class="logo-img" />
            </div>
          </router-link>
        </div>

        <!-- Center: search trigger -->
        <div class="toolbar-center">
          <div class="search-trigger gt-sm" @click="showSearch = true">
            <q-icon name="search" size="16px" />
            <span class="search-trigger-text">Search...</span>
            <kbd class="search-trigger-kbd">{{ isMac ? '\u2318' : 'Ctrl' }}+K</kbd>
          </div>
          <q-btn flat round dense icon="search" class="lt-md search-mobile-btn" @click="showSearch = true" />
        </div>

        <!-- Right: now-playing + actions -->
        <div class="toolbar-right">
          <!-- Currently Playing -->
          <div v-if="nowPlaying?.isPlaying" class="now-playing-pill" @click="showNowPlayingDialog = true">
            <img v-if="nowPlaying.albumImage" :src="nowPlaying.albumImage" class="np-album" />
            <q-icon v-else name="music_note" size="16px" />
            <div class="np-info">
              <div class="np-track">{{ nowPlaying.trackName }}</div>
              <div class="np-artist">{{ nowPlaying.artistName }}</div>
            </div>
            <div class="np-bars">
              <span></span><span></span><span></span>
            </div>
          </div>

          <!-- Profile Menu -->
          <q-btn flat round dense class="profile-avatar-btn">
            <q-avatar size="34px" class="avatar-ring">
              <img :src="userAvatar" />
            </q-avatar>
            <q-menu class="profile-dropdown">
            <div class="dropdown-header">
              <q-avatar size="48px" class="dropdown-avatar">
                <img :src="userAvatar" />
              </q-avatar>
              <div class="dropdown-user-info">
                <div class="dropdown-name">{{ userName }}</div>
                <div class="dropdown-handle">@{{ userHandle }}</div>
              </div>
            </div>
            <q-separator class="dropdown-sep" />
            <q-list class="dropdown-list">
              <q-item clickable v-close-popup :to="{ name: 'ProfileView' }" class="dropdown-item">
                <q-item-section avatar>
                  <q-icon name="account_circle" />
                </q-item-section>
                <q-item-section>Profile</q-item-section>
              </q-item>
              <q-item clickable v-close-popup class="dropdown-item">
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
                <q-item-section>Settings</q-item-section>
              </q-item>
              <q-separator class="dropdown-sep" />
              <q-item clickable v-close-popup @click="handleLogout" class="dropdown-item logout-item">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- LEFT DRAWER (NAVIGATION) -->
    <q-drawer v-if="isAuthenticated" v-model="leftDrawerOpen" show-if-above :width="280" :breakpoint="1024" bordered
      class="glass-drawer">
      <q-scroll-area class="fit">
        <div class="drawer-content">
          <!-- User Profile Section -->
          <div class="user-profile-section">
            <div class="profile-bg-glow"></div>
            <q-avatar size="56px" class="profile-avatar">
              <img :src="userAvatar" />
            </q-avatar>
            <div class="profile-name">{{ userName }}</div>
            <div class="profile-handle">@{{ userHandle }}</div>
          </div>

          <!-- Navigation -->
          <q-list class="nav-list">
            <!-- SOCIAL -->
            <div class="nav-section-label">
              <span>Social</span>
              <div class="nav-section-line"></div>
            </div>

            <q-item clickable v-ripple :to="{ name: 'Home' }" exact class="nav-item">
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Home</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="{ name: 'SwipeCard' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="local_fire_department" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Swipe</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/chats" class="nav-item">
              <q-item-section avatar>
                <q-icon name="chat_bubble_outline" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Chats</q-item-label>
              </q-item-section>
              <q-item-section side v-if="unreadMessages > 0">
                <q-badge class="nav-badge-pill" rounded>{{ unreadMessages }}</q-badge>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="{ name: 'Matches' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="favorite_border" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Matches</q-item-label>
              </q-item-section>
            </q-item>

            <!-- DISCOVER -->
            <div class="nav-section-label">
              <span>Discover</span>
              <div class="nav-section-line"></div>
            </div>

            <q-item clickable v-ripple :to="{ name: 'Music' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="library_music" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Music</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="{ name: 'EventMap' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="event" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Events</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="{ name: 'Favorites' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="star_outline" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Favorites</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="{ name: 'Notifications' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="notifications_none" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Notifications</q-item-label>
              </q-item-section>
            </q-item>

            <!-- YOU -->
            <div class="nav-section-label">
              <span>You</span>
              <div class="nav-section-line"></div>
            </div>

            <q-item clickable v-ripple :to="{ name: 'ProfileView' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="person_outline" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Profile</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="{ name: 'Settings' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="nav-label">Settings</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Now Playing Widget (sidebar) -->
          <div v-if="nowPlaying?.isPlaying" class="now-playing-sidebar" @click="showNowPlayingDialog = true">
            <img v-if="nowPlaying.albumImage" :src="nowPlaying.albumImage" class="nps-album" />
            <q-icon v-else name="music_note" size="20px" color="green" />
            <div class="nps-info">
              <div class="nps-track">{{ nowPlaying.trackName }}</div>
              <div class="nps-artist">{{ nowPlaying.artistName }}</div>
            </div>
            <div class="nps-bars">
              <span></span><span></span><span></span>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div class="drawer-footer">
            <img src="@/assets/venyuUpscaled.png" alt="venyu" class="drawer-footer-logo" />
            <span class="drawer-footer-text">find your rhythm</span>
          </div>
        </div>
      </q-scroll-area>
    </q-drawer>

    <!-- Search Modal -->
    <SearchModal v-model="showSearch" />

    <!-- PAGE CONTENT -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Global Match Popup -->
    <q-dialog v-model="showMatchPopup" persistent>
      <div class="match-popup">
        <div class="match-popup__content">
          <div class="match-popup__avatars">
            <q-avatar size="72px" class="match-popup__av">
              <img :src="userAvatar" />
            </q-avatar>
            <div class="match-popup__heart">
              <q-icon name="favorite" size="22px" color="pink-5" />
            </div>
            <q-avatar size="72px" class="match-popup__av">
              <img :src="matchedUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=match'" />
            </q-avatar>
          </div>
          <h2 class="match-popup__title">It's a Match!</h2>
          <p class="match-popup__sub">
            You and <strong>{{ matchedUser?.name }}</strong> both liked each other
          </p>
          <div class="match-popup__actions">
            <q-btn flat no-caps class="match-popup__btn-ghost" label="Dismiss" @click="dismissMatch" />
            <q-btn unelevated no-caps class="match-popup__btn-primary" icon="chat_bubble" label="Send Message" @click="goToMatchChat" />
          </div>
        </div>
      </div>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from '@/stores/auth';
import { usePresenceStore } from '@/stores/active';
import { useChatsStore } from '@/stores/chats';
import { api } from '@/api';
import { Notify } from 'quasar';
import SearchModal from '@/components/SearchModal.vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const presenceStore = usePresenceStore();
const chatsStore = useChatsStore();

// Match popup state
const showMatchPopup = ref(false);
const matchedUser = ref(null);
const matchRoomId = ref(null);

// Watch for incoming match events from the presence WS
watch(() => presenceStore.pendingMatch, (match) => {
  if (!match) return;
  matchedUser.value = match.user;
  matchRoomId.value = match.roomId;
  showMatchPopup.value = true;

  // Also show a notification
  Notify.create({
    message: `You matched with ${match.user?.name || 'someone'}!`,
    color: 'pink-6',
    icon: 'favorite',
    position: 'top',
    timeout: 5000,
  });

  // Refresh chat list
  chatsStore.fetchChats();

  presenceStore.clearMatch();
});

const dismissMatch = () => {
  showMatchPopup.value = false;
  matchedUser.value = null;
  matchRoomId.value = null;
};

const goToMatchChat = () => {
  showMatchPopup.value = false;
  if (matchRoomId.value) {
    router.push({ name: 'ChatView', params: { roomId: matchRoomId.value } });
  }
  matchedUser.value = null;
  matchRoomId.value = null;
};

// Currently playing state
const nowPlaying = ref(null);
const showNowPlayingDialog = ref(false);
let nowPlayingInterval = null;
let npTickInterval = null;

const fetchNowPlaying = async () => {
  if (!auth.isAuthenticated || document.hidden) return;
  try {
    const data = await api.getCurrentlyPlaying();
    if (data) {
      data._fetchedAt = Date.now();
      nowPlaying.value = data;
    } else {
      nowPlaying.value = null;
    }
  } catch {
    nowPlaying.value = null;
  }
};

// Client-side tick: advance progressMs every second so the UI feels live
const tickProgress = () => {
  const np = nowPlaying.value;
  if (!np?.isPlaying || !np.durationMs) return;
  const elapsed = Date.now() - (np._fetchedAt || Date.now());
  np.progressMs = Math.min(np.durationMs, (np._baseProgress ?? np.progressMs) + elapsed);
};

// Initialize auth on app mount
onMounted(async () => {
  if (!auth.ready) {
    await auth.fetchMe();
  }
  // Start polling for currently playing every 5s
  await fetchNowPlaying();
  if (nowPlaying.value) nowPlaying.value._baseProgress = nowPlaying.value.progressMs;
  nowPlayingInterval = setInterval(async () => {
    const prev = nowPlaying.value;
    await fetchNowPlaying();
    if (nowPlaying.value) nowPlaying.value._baseProgress = nowPlaying.value.progressMs;
  }, 5000);
  // Tick progress every 1s for smooth UI
  npTickInterval = setInterval(tickProgress, 1000);

  // Connect presence WS so we can receive match events
  if (auth.isAuthenticated) {
    presenceStore.connect();
  }

  // Pause/resume when tab visibility changes
  document.addEventListener('visibilitychange', onVisChange);

  // Ctrl+K / Cmd+K to open search
  document.addEventListener('keydown', handleSearchShortcut);
});

const onVisChange = () => {
  if (!document.hidden && auth.isAuthenticated) fetchNowPlaying();
};

const handleSearchShortcut = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    showSearch.value = true;
  }
};

onUnmounted(() => {
  if (nowPlayingInterval) clearInterval(nowPlayingInterval);
  if (npTickInterval) clearInterval(npTickInterval);
  document.removeEventListener('visibilitychange', onVisChange);
  document.removeEventListener('keydown', handleSearchShortcut);
});

const leftDrawerOpen = ref(true);
const showSearch = ref(false);
const isMac = computed(() => navigator.platform.toUpperCase().indexOf('MAC') >= 0);

// Get user data from auth store - match your User model fields
const isAuthenticated = computed(() => auth.isAuthenticated);
const userName = computed(() => auth.user?.displayName || auth.user?.display_name || "Guest");
const userHandle = computed(() => auth.user?.spotifyId || auth.user?.spotify_id || "user");
const userAvatar = computed(() => {
  const user = auth.user;
  if (!user) return "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

  // Priority: database avatar > Spotify images
  if (user.avatarUrl) return user.avatarUrl;
  if (user.avatar_url) return user.avatar_url;
  if (user.images?.[0]?.url) return user.images[0].url;

  return "https://api.dicebear.com/7.x/avataaars/svg?seed=default";
});
const unreadMessages = ref(0);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const handleLogout = () => {
  auth.logout();
  router.push('/');
};
</script>


<style scoped>
/* ========== TRANSITIONS ========== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<!-- Unscoped styles for Quasar deep overrides that scoped can't reach -->
<style>
/* ========== GLOBAL FONT ========== */
body,
#app,
.q-page,
.q-layout,
.q-toolbar,
.q-btn,
.q-input,
.q-card,
.q-dialog,
.q-menu,
.q-list,
.q-item {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
/* ========== HEADER ========== */
.glass-header {
  background: #0a0a12 !important;
  border-bottom: 1px solid rgba(139, 92, 246, 0.08) !important;
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.6) !important;
}

.toolbar-inner {
  padding: 0 16px;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 0;
}

/* Toolbar layout sections */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.toolbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 0 24px;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
}

/* Logo */
.logo-link {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 28px;
  width: auto;
  object-fit: contain;
  filter: brightness(1.1);
  transition: filter 0.3s ease, transform 0.3s ease;
}

.logo-link:hover .logo-img {
  filter: brightness(1.35) drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
  transform: scale(1.04);
}

/* Search Trigger */
.search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 260px;
  height: 34px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-trigger:hover {
  border-color: rgba(139, 92, 246, 0.2);
  background: rgba(255, 255, 255, 0.06);
}

.search-trigger .q-icon {
  color: rgba(255, 255, 255, 0.25);
  font-size: 16px;
}

.search-trigger-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
}

.search-trigger-kbd {
  margin-left: auto;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  border: none;
}

.search-mobile-btn {
  color: rgba(255, 255, 255, 0.55) !important;
}

/* Header Icon Buttons */
.menu-btn,
.header-icon-btn {
  color: rgba(255, 255, 255, 0.55) !important;
  width: 36px !important;
  height: 36px !important;
  transition: all 0.2s ease;
}

.menu-btn:hover,
.header-icon-btn:hover {
  color: #fff !important;
  background: rgba(139, 92, 246, 0.12) !important;
}

.header-icon-btn .q-badge {
  font-size: 9px;
  min-height: 16px;
  padding: 0 5px;
}

/* Profile Avatar Button */
.profile-avatar-btn {
  transition: all 0.2s ease;
}

.avatar-ring {
  border: 2px solid rgba(139, 92, 246, 0.4) !important;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.avatar-ring img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.profile-avatar-btn:hover .avatar-ring {
  border-color: rgba(139, 92, 246, 0.8) !important;
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.3);
}

/* Now Playing Pill */
.now-playing-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  background: rgba(30, 215, 96, 0.06);
  border: 1px solid rgba(30, 215, 96, 0.14);
  cursor: pointer;
  transition: all 0.25s ease;
  max-width: 220px;
  overflow: hidden;
}

.now-playing-pill:hover {
  background: rgba(30, 215, 96, 0.12);
  border-color: rgba(30, 215, 96, 0.28);
  box-shadow: 0 0 14px rgba(30, 215, 96, 0.08);
}

.np-album {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  object-fit: cover;
  flex-shrink: 0;
}

.np-info {
  min-width: 0;
  overflow: hidden;
}

.np-track {
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #1ed760;
  line-height: 1.25;
}

.np-artist {
  font-size: 0.62rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.2;
}

.np-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
  flex-shrink: 0;
}

.np-bars span {
  display: block;
  width: 2px;
  background: #1ed760;
  border-radius: 2px;
  animation: np-bar-bounce 0.8s ease-in-out infinite alternate;
}

.np-bars span:nth-child(1) { height: 4px; animation-delay: 0s; }
.np-bars span:nth-child(2) { height: 8px; animation-delay: 0.2s; }
.np-bars span:nth-child(3) { height: 3px; animation-delay: 0.4s; }

@keyframes np-bar-bounce {
  0% { transform: scaleY(0.4); }
  100% { transform: scaleY(1); }
}

/* ========== LEFT DRAWER ========== */
.glass-drawer,
.glass-drawer .q-drawer,
.glass-drawer .q-drawer__content {
  background: #0a0a12 !important;
}

aside.glass-drawer {
  background: #0a0a12 !important;
  border-right: 1px solid rgba(139, 92, 246, 0.08) !important;
}

.drawer-content {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-bottom: 0;
}

/* User Profile Section */
.user-profile-section {
  position: relative;
  text-align: center;
  padding: 28px 20px 20px;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 8px;
}

.profile-bg-glow {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 120px;
  background: radial-gradient(
    ellipse at center,
    rgba(139, 92, 246, 0.2) 0%,
    rgba(236, 72, 153, 0.08) 40%,
    transparent 75%
  );
  pointer-events: none;
}

.profile-avatar {
  border: 2.5px solid rgba(139, 92, 246, 0.35) !important;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.15);
  margin-bottom: 12px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.profile-avatar:hover {
  border-color: rgba(139, 92, 246, 0.6) !important;
  box-shadow: 0 6px 28px rgba(139, 92, 246, 0.25);
}

.profile-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.profile-name {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff !important;
  margin-bottom: 2px;
  letter-spacing: -0.01em;
}

.profile-handle {
  font-size: 11px;
  color: rgba(167, 139, 250, 0.6) !important;
  font-weight: 500;
}

/* Navigation */
.nav-list {
  padding: 4px 12px;
  flex: 1;
}

.nav-section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.25) !important;
  padding: 14px 14px 6px;
}

.nav-section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.15), transparent);
}

/* Nav Badge Pill */
.nav-badge-pill {
  background: linear-gradient(135deg, #8b5cf6, #ec4899) !important;
  font-size: 9px;
  min-height: 16px;
  padding: 0 6px;
}

.nav-item {
  border-radius: 12px;
  margin-bottom: 2px;
  min-height: 40px;
  padding: 10px 12px;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.6) !important;
}

.nav-item .q-item__label,
.nav-item .q-item__section--main {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.nav-item .q-icon {
  color: rgba(255, 255, 255, 0.35) !important;
  font-size: 20px;
  transition: color 0.2s ease;
}

.nav-item:hover {
  background: rgba(139, 92, 246, 0.08) !important;
}

.nav-item:hover .q-item__label,
.nav-item:hover .q-item__section--main {
  color: #ffffff !important;
}

.nav-item:hover .q-icon {
  color: rgba(167, 139, 250, 0.85) !important;
}

/* Active nav item */
.nav-item.q-router-link--active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(236, 72, 153, 0.04) 100%) !important;
  position: relative;
}

.nav-item.q-router-link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: linear-gradient(180deg, #8b5cf6, #ec4899);
  border-radius: 0 4px 4px 0;
}

.nav-item.q-router-link--active .q-item__label,
.nav-item.q-router-link--active .q-item__section--main {
  color: #ffffff !important;
  font-weight: 700;
}

.nav-item.q-router-link--active .q-icon {
  color: #a78bfa !important;
  filter: drop-shadow(0 0 4px rgba(167, 139, 250, 0.3));
}

/* Drawer Footer */
.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
}

.drawer-footer-logo {
  height: 18px;
  width: auto;
  opacity: 0.3;
  filter: grayscale(20%);
}

.drawer-footer-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.18);
  font-weight: 500;
  font-style: italic;
}

/* Now Playing Sidebar Widget */
.now-playing-sidebar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 12px;
  padding: 10px 12px;
  background: rgba(30, 215, 96, 0.05);
  border: 1px solid rgba(30, 215, 96, 0.12);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.now-playing-sidebar:hover {
  background: rgba(30, 215, 96, 0.1);
  border-color: rgba(30, 215, 96, 0.22);
}

.nps-album {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.nps-info {
  min-width: 0;
  flex: 1;
}

.nps-track {
  font-size: 12px;
  font-weight: 600;
  color: #1ed760;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.nps-artist {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.nps-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
  flex-shrink: 0;
}

.nps-bars span {
  display: block;
  width: 2.5px;
  background: #1ed760;
  border-radius: 2px;
  animation: np-bar-bounce 0.8s ease-in-out infinite alternate;
}

.nps-bars span:nth-child(1) { height: 5px; animation-delay: 0s; }
.nps-bars span:nth-child(2) { height: 10px; animation-delay: 0.2s; }
.nps-bars span:nth-child(3) { height: 4px; animation-delay: 0.4s; }

/* ========== RESPONSIVE ========== */
@media (max-width: 1023px) {
  .logo-img {
    height: 24px;
  }

  .toolbar-inner {
    padding: 0 10px;
  }

  .toolbar-right {
    gap: 4px;
  }
}

/* Profile dropdown menu (rendered outside component scope via portal) */
.profile-dropdown.q-menu {
  background: #13131f !important;
  border: 1px solid rgba(139, 92, 246, 0.18) !important;
  border-radius: 16px !important;
  min-width: 250px !important;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.6),
    0 0 24px rgba(139, 92, 246, 0.08) !important;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 16px;
}

.dropdown-avatar {
  border: 2px solid rgba(139, 92, 246, 0.35) !important;
  flex-shrink: 0;
}

.dropdown-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.dropdown-user-info {
  min-width: 0;
}

.dropdown-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-handle {
  font-size: 12px;
  color: rgba(167, 139, 250, 0.6) !important;
  font-weight: 500;
}

.dropdown-sep {
  background: rgba(255, 255, 255, 0.06) !important;
  margin: 0 !important;
}

.dropdown-list {
  padding: 6px !important;
}

.dropdown-item {
  border-radius: 10px !important;
  min-height: 42px;
  color: rgba(255, 255, 255, 0.85) !important;
  transition: all 0.2s ease;
  margin: 2px 0;
}

.dropdown-item:hover {
  background: rgba(139, 92, 246, 0.12) !important;
  color: #fff !important;
}

.dropdown-item .q-icon {
  color: rgba(167, 139, 250, 0.7) !important;
}

.logout-item:hover {
  background: rgba(239, 68, 68, 0.1) !important;
}

.logout-item .q-icon {
  color: rgba(239, 68, 68, 0.7) !important;
}

/* Global dark body */
body,
.q-page-container {
  background: #09090b;
}

/* ─── Match Popup ────────────────────────────────────── */
.match-popup {
  background: rgba(16, 16, 28, 0.96);
  backdrop-filter: blur(32px) saturate(1.5);
  -webkit-backdrop-filter: blur(32px) saturate(1.5);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 28px;
  padding: 40px 32px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(236, 72, 153, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.match-popup__content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.match-popup__avatars {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 20px;
}

.match-popup__av {
  border: 3px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.match-popup__heart {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(236, 72, 153, 0.15);
  border: 2px solid rgba(236, 72, 153, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 -8px;
  z-index: 1;
}

.match-popup__title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.match-popup__sub {
  margin: 8px 0 24px;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.55);
}

.match-popup__sub strong {
  color: #fff;
}

.match-popup__actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.match-popup__btn-ghost {
  flex: 1;
  color: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  font-weight: 600;
}

.match-popup__btn-primary {
  flex: 1;
  background: linear-gradient(135deg, #8b5cf6, #ec4899) !important;
  color: #fff !important;
  border-radius: 14px;
  font-weight: 700;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
}
</style>