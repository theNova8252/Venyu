<template>
  <q-page class="q-pa-lg profile-page">
    <div class="row q-col-gutter-xl items-start">
      <!-- Avatar Card -->
      <div class="col-12 col-md-4">
        <q-card class="q-pa-md">
          <div class="text-h6 q-mb-md">Profilbild</div>
          <div class="flex column items-center q-gutter-sm">
            <q-avatar size="140px">
              <img :src="previewUrl || user?.avatar_url || defaultAvatar" alt="avatar" />
            </q-avatar>

            <q-btn flat icon="upload" label="Bild wählen" @click="$refs.file.click()" />
            <input ref="file" type="file" accept="image/*" class="hidden" @change="onFile" />
            <q-btn color="primary" :disable="!file" label="Hochladen" @click="uploadAvatar" />
          </div>
        </q-card>
      </div>

      <!-- Info / Edit Card -->
      <div class="col-12 col-md-8">
        <q-card class="q-pa-md">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Profil</div>
            <q-btn dense color="negative" icon="logout" label="Logout" @click="doLogout" />
          </div>

          <div class="q-mb-md">
            <BadgeWithTooltip color="secondary" :tooltip="`Spotify: ${user?.display_name || ''}`">
              Spotify
            </BadgeWithTooltip>
            <BadgeWithTooltip color="accent" :tooltip="`Abo: ${user?.product || '—'}`">
              {{ user?.product || '—' }}
            </BadgeWithTooltip>
          </div>

          <q-form @submit.prevent="save">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-input v-model="form.bio" type="textarea" label="Bio" autogrow maxlength="500" />
              </div>
              <div class="col-12">
                <q-toggle v-model="form.is_visible" label="Profil ist sichtbar" />
              </div>
            </div>

            <div class="q-mt-md">
              <q-btn type="submit" color="primary" label="Speichern" :loading="saving" />
            </div>
          </q-form>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const user = computed(() => auth.user);
const form = ref({ bio: '', is_visible: true });
const saving = ref(false);
const file = ref(null);
const previewUrl = ref('');
const defaultAvatar = 'https://placehold.co/280x280?text=Avatar';

onMounted(async () => {
  if (!auth.ready) await auth.fetchMe();
  await loadProfile();
});

const doLogout = async () => {
  await auth.logout();
  window.location.href = '/'; 
};

async function loadProfile() {
  const res = await fetch('/api/user/me', { credentials: 'include' });
  if (!res.ok) return;
  const data = await res.json();
  if (!auth.user) auth.user = data;
  form.value.bio = data.bio || '';
  form.value.is_visible = !!data.is_visible;
}

async function save() {
  saving.value = true;
  await fetch('/api/user/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(form.value),
  });
  saving.value = false;
}

function onFile(e) {
  file.value = e.target.files?.[0] || null;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = file.value ? URL.createObjectURL(file.value) : '';
}

async function uploadAvatar() {
  if (!file.value) return;
  const fd = new FormData();
  fd.append('avatar', file.value);
  const res = await fetch('/api/user/avatar', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await res.json();
  if (data?.avatar_url) {
    // Sofort anzeigen
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = '';
    auth.user = { ...auth.user, avatar_url: data.avatar_url };
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 1100px;
  margin: 0 auto;
}

.hidden {
  display: none;
}
</style>
