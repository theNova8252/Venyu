<template>
  <div class="column items-center q-mt-xl">
    <p>Authentifiziere…</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  const code = route.query.code
  const redirect = route.query.redirect || '/protected'
  if (!code) return router.replace('/login')
  try {
    await auth.handleCallback(code)
    router.replace(redirect)
  } catch (e) {
    console.error(e)
    router.replace('/login')
  }
})
</script>
