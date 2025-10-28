<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="glass-header" height-hint="80">
      <q-toolbar class="q-py-sm">
        <q-btn flat round dense icon="menu" @click="toggleLeftDrawer" class="menu-btn" />

        <q-toolbar-title class="logo-title">
          <div class="logo-container">
            <span class="logo-icon">♫</span>
            <span class="logo-text">venyu</span>
          </div>
        </q-toolbar-title>

        <q-btn flat round dense icon="notifications_none" class="menu-btn">
          <q-badge color="accent" floating>3</q-badge>
        </q-btn>

        <q-btn flat round dense icon="account_circle" @click="toggleRightDrawer" class="menu-btn q-ml-sm" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" :width="280" class="glass-drawer" overlay>
      <div class="drawer-content">
        <div class="drawer-header q-pa-lg">
          <div class="drawer-logo">
            <span class="logo-icon-large">♫</span>
          </div>
          <h6 class="q-mt-md q-mb-none">Explore</h6>
        </div>

        <q-list class="nav-list">
          <q-item clickable v-ripple to="/" exact class="nav-item">
            <q-item-section avatar>
              <q-icon name="home" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Home</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/discover" class="nav-item">
            <q-item-section avatar>
              <q-icon name="explore" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Discover</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/matches" class="nav-item">
            <q-item-section avatar>
              <q-icon name="favorite" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Matches</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge color="accent">12</q-badge>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/playlists" class="nav-item">
            <q-item-section avatar>
              <q-icon name="queue_music" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Shared Playlists</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/events" class="nav-item">
            <q-item-section avatar>
              <q-icon name="event" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Music Events</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <q-item clickable v-ripple to="/settings" class="nav-item">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Settings</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple to="/about" class="nav-item">
            <q-item-section avatar>
              <q-icon name="info" />
            </q-item-section>
            <q-item-section>
              <q-item-label>About</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-drawer v-model="rightDrawerOpen" side="right" :width="320" class="glass-drawer" overlay>
      <div class="drawer-content profile-drawer">
        <div class="profile-header q-pa-lg">
          <q-avatar size="100px" class="profile-avatar">
            <img src="https://cdn.quasar.dev/img/avatar.png">
            <q-badge color="positive" floating rounded />
          </q-avatar>
          <h6 class="q-mt-md q-mb-xs">Alex Rivers</h6>
          <p class="text-caption text-grey-7">Music taste: Eclectic</p>

          <div class="music-stats q-mt-md">
            <div class="stat-item">
              <div class="stat-value">127</div>
              <div class="stat-label">Matches</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">89%</div>
              <div class="stat-label">Compatibility</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">42</div>
              <div class="stat-label">Concerts</div>
            </div>
          </div>
        </div>

        <q-list class="profile-list">
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="person" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Edit Profile</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="music_note" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Music Preferences</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="workspace_premium" color="amber" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Upgrade to Premium</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Logout</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component || LoginPage" />
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};

const LoginPage = {
  template: `
    <q-page class="login-page">
      <div class="login-container">
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
          <div class="shape shape-4"></div>
        </div>
        
        <div class="login-content">
          <div class="logo-section">
            <div class="big-logo">
              <span class="logo-icon-xl">♫</span>
            </div>
            <h1 class="app-title">venyu</h1>
            <p class="tagline">Where music meets connection</p>
          </div>

          <div class="features q-mt-xl">
            <div class="feature">
              <q-icon name="music_note" size="32px" color="primary" />
              <h6>Match by Music</h6>
              <p>Find people with your vibe</p>
            </div>
            <div class="feature">
              <q-icon name="favorite" size="32px" color="accent" />
              <h6>Shared Playlists</h6>
              <p>Create together</p>
            </div>
            <div class="feature">
              <q-icon name="event" size="32px" color="secondary" />
              <h6>Concert Dates</h6>
              <p>Live music together</p>
            </div>
          </div>

          <div class="login-actions q-mt-xl">
            <q-btn 
              @click="auth.login()" 
              unelevated
              rounded
              size="lg"
              class="spotify-btn q-px-xl q-py-md"
              no-caps
            >
              <q-icon name="play_circle_filled" size="24px" class="q-mr-sm" />
              Continue with Spotify
            </q-btn>
            
            <p class="terms q-mt-lg">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </q-page>
  `
};
</script>

<style>
@font-face {
  font-family: 'Montserrat';
  src: url('/fonts/Montserrat/Montserrat-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'Lora';
  src: url('/fonts/Lora/Lora-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'LibreBodoni';
  src: url('/fonts/LibreBodoni/LibreBodoni-Regular.ttf') format('truetype');
}

* {
  font-family: 'Montserrat', sans-serif;
}

/* Glassmorphism Header */
.glass-header {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.dark .glass-header {
  background: rgba(30, 30, 30, 0.7) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Logo Styling */
.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: float 3s ease-in-out infinite;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
}

.menu-btn {
  transition: all 0.3s ease;
}

.menu-btn:hover {
  transform: scale(1.1);
  background: rgba(102, 126, 234, 0.1);
}

/* Glassmorphism Drawer */
.glass-drawer {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-drawer {
  background: rgba(30, 30, 30, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0 0 24px 24px;
}

.drawer-logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-icon-large {
  font-size: 48px;
  animation: pulse 2s ease-in-out infinite;
}

.nav-list {
  padding: 16px;
}

.nav-item {
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(4px);
}

/* Profile Drawer */
.profile-drawer {
  background: rgba(255, 255, 255, 0.95) !important;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  border-radius: 0 0 24px 24px;
}

.profile-avatar {
  border: 4px solid white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.music-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  margin-top: 4px;
}

.profile-list {
  padding: 16px;
}

/* Login Page */
.login-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float-random 20s ease-in-out infinite;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  top: 30%;
  right: 30%;
  animation-delay: 1s;
}

.login-container {
  max-width: 600px;
  width: 100%;
  padding: 40px;
  position: relative;
  z-index: 1;
}

.login-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 32px;
  padding: 60px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.logo-section {
  margin-bottom: 40px;
}

.big-logo {
  margin-bottom: 16px;
}

.logo-icon-xl {
  font-size: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: pulse 2s ease-in-out infinite;
}

.app-title {
  font-size: 64px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -2px;
}

.tagline {
  font-size: 18px;
  color: #666;
  margin-top: 8px;
  font-weight: 500;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 24px;
  padding: 0 20px;
}

.feature {
  text-align: center;
  padding: 20px;
  border-radius: 16px;
  background: rgba(102, 126, 234, 0.05);
  transition: all 0.3s ease;
}

.feature:hover {
  transform: translateY(-4px);
  background: rgba(102, 126, 234, 0.1);
}

.feature h6 {
  margin: 12px 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.feature p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.login-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spotify-btn {
  background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%) !important;
  color: white !important;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(29, 185, 84, 0.4);
  transition: all 0.3s ease;
  text-transform: none;
}

.spotify-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(29, 185, 84, 0.5);
}

.terms {
  font-size: 12px;
  color: #999;
  text-align: center;
  max-width: 400px;
  line-height: 1.6;
}

/* Animations */
@keyframes float {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

@keyframes float-random {

  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }

  33% {
    transform: translate(30px, -30px) rotate(120deg);
  }

  66% {
    transform: translate(-30px, 30px) rotate(240deg);
  }
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .login-content {
    padding: 40px 24px;
  }

  .app-title {
    font-size: 48px;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>