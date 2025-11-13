<template>
  <div class="q-pa-xl text-center">Connecting…</div>
</template>
<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();
onMounted(async () => {
  await auth.fetchMe();
  const dest = auth.popIntended() || '/profile';
  router.replace(dest);
});



</script>

