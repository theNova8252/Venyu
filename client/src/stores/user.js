import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const me = ref(null);

  // Load user from localStorage first, then from API
  const fetchMe = async () => {
    // Check localStorage first
    const storedUser = localStorage.getItem('venyu_demo_user');

    if (storedUser) {
      try {
        me.value = JSON.parse(storedUser);
        return;
      } catch (e) {
        console.error('Failed to parse stored user data', e);
      }
    }

    // Fallback to API
    try {
      const res = await fetch('/api/me');
      me.value = await res.json();
    } catch (error) {
      console.error('Failed to fetch user from API', error);
    }
  };

  // Set user data (called from login page)
  const setUser = (userData) => {
    me.value = userData;
  };

  return {
    me,
    fetchMe,
    setUser,
  };
});
