<template>
  <q-layout view="hHh lpR fFf">
    <!-- HEADER -->
    <q-header elevated class="glass-header" height-hint="80">
      <q-toolbar class="q-py-sm">
        <!-- Left menu button -->
        <q-btn
          flat
          round
          dense
          icon="menu"
          @click="toggleLeftDrawer"
          class="menu-btn"
        />

        <!-- Logo -->
        <q-toolbar-title class="logo-title">
          <div class="logo-container">
            <span class="logo-icon">♫</span>
            <span class="logo-text">venyu</span>
          </div>
        </q-toolbar-title>

        <!-- Notifications -->
        <q-btn flat round dense icon="notifications_none" class="menu-btn">
          <q-badge color="accent" floating>3</q-badge>
        </q-btn>

        <!-- (optional) Right drawer button -->
        <q-btn
          flat
          round
          dense
          icon="account_circle"
          @click="toggleRightDrawer"
          class="menu-btn q-ml-sm"
        />
      </q-toolbar>
    </q-header>

    <!-- LEFT DRAWER (NAVIGATION) -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-scroll-area class="fit">
        <q-list class="nav-list">
          <!-- Home -->
          <q-item
            clickable
            v-ripple
            :to="{ name: 'Home' }"
            exact
            class="nav-item"
          >
            <q-item-section avatar>
              <q-icon name="home" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Home</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Discover -->
          <q-item
            clickable
            v-ripple
            :to="{ name: 'SwipeCard' }"
            class="nav-item"
          >
            <q-item-section avatar>
              <q-icon name="explore" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Discover</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Profile -->
          <q-item
            clickable
            v-ripple
            :to="{ name: 'ProfileView' }"
            class="nav-item"
          >
            <q-item-section avatar>
              <q-icon name="account_circle" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Profile</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Chat -->
          <q-item clickable to="/chats">
            <q-item-section avatar><q-icon name="chat" /></q-item-section>
            <q-item-section>Chats</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- PAGE CONTENT -->
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
import { ref } from "vue";
import LoginPage from "@/views/LoginView.vue";

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false); // falls du später einen rechten Drawer baust

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};
</script>

<style scoped>
.glass-header {
  background: rgba(10, 10, 15, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 1.4rem;
}

.logo-text {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-list {
  padding-top: 1rem;
}

.nav-item {
  border-radius: 999px;
  margin: 0.25rem 0.75rem;
}
</style>
