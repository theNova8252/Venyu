import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    ready: false,
    intendedPath: null, // neu
  }),
  getters: {
    isAuthenticated: (state) => !!state.user, // neu
  },
  actions: {
    login() {
      window.location.href = "/api/spotify/auth/login";
    },
    async fetchMe() {
      try {
        const res = await fetch("/api/user/me", { credentials: "include" });
        if (!res.ok) {
          this.user = null;
          this.ready = true;
          return;
        }
        this.user = await res.json();
      } catch (e) {
        console.error("fetchMe failed", e);
        this.user = null;
      } finally {
        this.ready = true;
      }
    },
    async logout() {
      await fetch("/api/spotify/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      this.user = null;
    },
    setIntended(path) {
      this.intendedPath = path;
    },
    popIntended() {
      const path = this.intendedPath;
      this.intendedPath = null;
      return path;
    },
  },
});
