<template>
  <q-layout view="hHh lpR fFf">
    <!-- HEADER -->
    <q-header elevated class="glass-header" v-if="isAuthenticated">
      <q-toolbar class="q-px-md">
        <!-- Left menu button (only on mobile) -->
        <q-btn flat round dense icon="menu" @click="toggleLeftDrawer" class="menu-btn lt-md" />

        <!-- Logo -->
        <q-toolbar-title class="logo-title">
          <div class="logo-container">
            <span class="logo-icon">♫</span>
            <span class="logo-text">venyu</span>
          </div>
        </q-toolbar-title>

        <q-space />

        <!-- Search Bar (Desktop) -->
        <q-input dark dense standout v-model="searchQuery" placeholder="Search artists, venues..."
          class="search-bar gt-sm">
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-space />

        <!-- Notifications -->
        <q-btn flat round dense icon="notifications_none" class="menu-btn">
          <q-badge color="accent" floating rounded>3</q-badge>
        </q-btn>

        <!-- Profile Menu -->
        <q-btn flat round dense class="menu-btn q-ml-sm">
          <q-avatar size="32px">
            <img :src="userAvatar" />
          </q-avatar>
          <q-menu>
            <q-list style="min-width: 180px">
              <q-item clickable v-close-popup :to="{ name: 'ProfileView' }">
                <q-item-section avatar>
                  <q-icon name="account_circle" />
                </q-item-section>
                <q-item-section>Profile</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
                <q-item-section>Settings</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Logout</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- LEFT DRAWER (NAVIGATION) -->
    <q-drawer v-if="isAuthenticated" v-model="leftDrawerOpen" show-if-above :width="280" :breakpoint="1024" bordered
      class="glass-drawer">
      <q-scroll-area class="fit">
        <div class="drawer-content">
          <!-- User Profile Section -->
          <div class="user-profile-section q-pa-md">
            <q-avatar size="56px" class="q-mb-sm">
              <img :src="userAvatar" />
            </q-avatar>
            <div class="text-h6 text-weight-bold">{{ userName }}</div>
          </div>

          <q-separator class="q-my-md" />

          <!-- Navigation -->
          <q-list class="nav-list">
            <q-item clickable v-ripple :to="{ name: 'Home' }" exact class="nav-item">
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Home</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="{ name: 'SwipeCard' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="explore" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Discover</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/chats" class="nav-item">
              <q-item-section avatar>
                <q-icon name="chat" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Chats</q-item-label>
              </q-item-section>
              <q-item-section side v-if="unreadMessages > 0">
                <q-badge color="accent" rounded>{{ unreadMessages }}</q-badge>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple :to="{ name: 'ProfileView' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="account_circle" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Profile</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator class="q-my-md" />

            <q-item clickable v-ripple :to="{ name: 'EventMap' }" class="nav-item">
              <q-item-section avatar>
                <q-icon name="event" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Events</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple class="nav-item">
              <q-item-section avatar>
                <q-icon name="favorite" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Favorites</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple class="nav-item">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">Settings</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-scroll-area>
    </q-drawer>

    <!-- PAGE CONTENT -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const leftDrawerOpen = ref(true);
const searchQuery = ref("");

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
.glass-header {
  background: rgba(18, 18, 25, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
}

.glass-drawer {
  background: rgba(18, 18, 25, 0.98);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.logo-icon {
  font-size: 1.6rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-text {
  font-weight: 800;
  font-size: 1.3rem;
  letter-spacing: 0.05em;
  text-transform: lowercase;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.search-bar {
  max-width: 400px;
  border-radius: 24px;
}

.search-bar :deep(.q-field__control) {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
}

.menu-btn {
  transition: all 0.3s ease;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.drawer-content {
  padding: 1rem 0;
}

.user-profile-section {
  text-align: center;
}

.nav-list {
  padding: 0 0.75rem;
}

.nav-item {
  border-radius: 12px;
  margin-bottom: 0.4rem;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.nav-item.q-router-link--active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  border-left: 3px solid #667eea;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Responsive */
@media (max-width: 1023px) {
  .logo-text {
    font-size: 1.1rem;
  }
}
.user-profile-section .q-avatar img,
.menu-btn .q-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.user-profile-section .q-avatar {
  border: 2px solid rgba(255, 255, 255, 0.1);
}
</style>