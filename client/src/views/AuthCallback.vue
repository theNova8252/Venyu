<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <q-spinner-dots color="purple-5" size="80px" />
      <div class="text-h6 q-mt-md text-white">Authenticating...</div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
  // Handle the OAuth callback
  const redirectPath = await auth.handleAuthCallback();
  router.replace(redirectPath);
});
</script>

<style scoped>
.q-page {
  background: linear-gradient(135deg, #0a0a0f 0%, #1a0b2e 50%, #2d1b4e 100%);
  min-height: 100vh;
}
</style>