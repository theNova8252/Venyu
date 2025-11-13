import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useAuthStore } from './auth';

export const useUserStore = defineStore('user', () => {
  const auth = useAuthStore();

  const me = computed(() => auth.user);

  const fetchMe = async () => {
    await auth.fetchMe();
  };

  const setUser = (userData) => {
    auth.user = userData;
  };

  return {
    me,
    fetchMe,
    setUser,
  };
});
