// client/src/stores/user.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const me = ref(null);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/user/me', { credentials: 'include' });
      if (!res.ok) return;
      me.value = await res.json();
    } catch (error) {
      console.error('Failed to fetch user from API', error);
    }
  };

  const setUser = (userData) => {
    me.value = userData;
  };

  return {
    me,
    fetchMe,
    setUser,
  };
});
