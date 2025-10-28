<template>
  <div class="column items-center q-mt-md">
    <router-link to="/login">Login</router-link> |
    <router-link to="/protected">Protected</router-link>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useMyStore } from '@/stores/myStore.js'
import { useAuthStore } from '@/stores/auth.js'
const myStore = useMyStore()
useAuthStore().boot()
</script>
