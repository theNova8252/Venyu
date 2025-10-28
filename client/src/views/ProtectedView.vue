<template>
  <div class="column items-center q-mt-xl">
    <h2>Protected Area</h2>
    <p v-if="auth.accessToken">Access-Token: {{ auth.accessToken.slice(0, 12) }}…</p>
    <button @click="auth.logout()">Logout</button>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'
const auth = useAuthStore()
</script>
