<!-- src/pages/OnboardingPage.vue -->
<template>
  <q-page class="q-pa-xl flex column items-center">
    <div class="text-h4 q-mb-md">Welcome to Venyu</div>

    <q-card v-if="me" class="q-pa-lg" style="max-width:600px;width:100%">
      <div class="row items-center q-mb-md">
        <q-avatar size="72px" class="q-mr-md">
          <img :src="me.images?.[0]?.url || fallbackAvatar" />
        </q-avatar>
        <div>
          <div class="text-h6">{{ me.display_name }}</div>
          <div class="text-caption">{{ me.email }}</div>
        </div>
      </div>

      <q-form @submit.prevent="createAccount">
        <q-input v-model="form.username" label="Username" dense outlined class="q-mb-md" />
        <q-input v-model="form.email" label="Email" type="email" dense outlined class="q-mb-md" />
        <q-input v-model="form.city" label="City" dense outlined class="q-mb-md" />

        <div class="row items-center q-gutter-sm">
          <q-btn label="Create account" type="submit" color="primary" unelevated />
          <q-btn flat label="Log out" color="negative" @click="logout" />
        </div>
      </q-form>
    </q-card>

    <q-spinner v-else size="lg" />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8888'
const me = ref(null)
const fallbackAvatar = 'https://avatars.githubusercontent.com/u/9919?s=200&v=4'

const form = ref({ username: '', email: '', city: '' })

onMounted(async () => {
  // cookies (rt/at) are httpOnly; just include credentials and server will use them
  const r = await fetch(`${API}/spotify/me`, { credentials: 'include' })
  if (r.ok) {
    me.value = await r.json()
    form.value.username = me.value.display_name || ''
    form.value.email = me.value.email || ''
  } else {
    // not authenticated; bounce back home
    window.location.href = '/'
  }
})

async function createAccount() {
  // TODO: call your backend to create a Venyu user in Postgres
  // for example: POST /users with form.value + Spotify id (me.value.id)
  // await fetch(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form.value, spotifyId: me.value.id }) , credentials: 'include'})
  alert('Account created (stub). Hook to your /users endpoint.')
}

async function logout() {
  await fetch(`${API}/spotify/auth/logout`, { method: 'POST', credentials: 'include' })
  window.location.href = '/'
}
</script>
