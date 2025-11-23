import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import CallbackView from "@/views/CallbackView.vue";
import ProtectedView from "@/views/ProtectedView.vue";
import LandingView from "../views/LandingView.vue";
import OnboardingPage from "@/views/OnboardingPage.vue";
import SwipeCard from "../views/SwipeCard.vue";
import ProfileView from "@/views/ProfileView.vue";
import AuthCallback from "@/views/AuthCallback.vue";
import { useAuthStore } from "@/stores/auth.js";
import ChatView from "@/views/ChatView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: LandingView },
    { path: '/login', component: LoginView },
    { path: '/home', name: 'Home', component: HomeView },
    { path: '/callback', component: CallbackView },
    {
      path: '/protected',
      component: ProtectedView,
      meta: { requiresAuth: true },
    },
    { path: '/landing', component: LandingView },
    { path: '/onboarding', component: OnboardingPage },
    {
      path: '/swipe',
      component: SwipeCard,
      name: 'SwipeCard',
    },
    {
      path: '/profile',
      component: ProfileView,
      name: 'ProfileView',
      meta: { requiresAuth: true },
    },
    {
      path: '/chat/:roomId',
      name: 'ChatView',
      component: ChatView,
      meta: { requiresAuth: true },
    },
    {
      path: '/chats',
      name: 'ChatList',
      component: () => import('../views/ChatListView.vue'),
    },
    {
      path: '/events',
      component: () => import('../views/EventMap.vue'),
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.ready) {
    await auth.fetchMe();
  }

  if (to.meta.requiresAuth && !auth.user) {
    auth.setIntended(to.fullPath);
    // Lieber auf '/login' oder Landing? Du hast beides.
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  return true;
});

router.beforeResolve((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
});

router.addRoute({
  path: "/auth/callback",
  component: AuthCallback,
});

export default router;
