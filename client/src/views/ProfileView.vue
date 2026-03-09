<template>
  <q-page class="profile-page">
    <!-- Subtle mesh gradient background -->
    <div class="bg-mesh"></div>
    <div class="bg-noise"></div>

    <!-- Top navigation bar -->
    <header class="profile-topbar">
      <div class="topbar-inner">
        <div class="topbar-title">Profile</div>
        <div class="topbar-actions">
          <button class="topbar-btn topbar-btn--ghost" @click="doLogout">
            <q-icon name="logout" size="18px" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>

    <div class="profile-layout">
      <!-- Hero / Identity card -->
      <section class="hero-card">
        <div class="hero-card__bg"></div>
        <div class="hero-card__content">
          <!-- Avatar -->
          <div class="hero-avatar-wrap">
            <div class="hero-avatar" @click="$refs.fileInput.click()">
              <img :src="previewUrl || userAvatar || defaultAvatar" alt="avatar" />
              <div class="hero-avatar__overlay">
                <q-icon name="photo_camera" size="24px" />
              </div>
            </div>
            <input ref="fileInput" type="file" accept="image/*" class="sr-only" @change="onFile" />
            <transition name="fade">
              <button v-if="file" class="upload-pill" :disabled="uploading" @click="uploadAvatar">
                <q-spinner-dots v-if="uploading" color="white" size="16px" />
                <template v-else>
                  <q-icon name="cloud_upload" size="16px" />
                  <span>Upload</span>
                </template>
              </button>
            </transition>
          </div>

          <!-- Identity -->
          <div class="hero-identity">
            <h1 class="hero-name">
              {{ profileName }}
              <span v-if="profileAge != null" class="hero-age">, {{ profileAge }}</span>
            </h1>
            <div class="hero-meta">
              <span v-if="user?.email" class="meta-chip">
                <q-icon name="mail" size="14px" />
                {{ user.email }}
              </span>
              <span v-if="user?.product" class="meta-chip meta-chip--accent">
                <q-icon name="star" size="14px" />
                {{ user.product }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Main content grid -->
      <div class="content-grid">
        <!-- Left column: Settings -->
        <section class="card settings-card">
          <div class="card__header">
            <h2 class="card__title">Settings</h2>
          </div>

          <q-form @submit.prevent="save" class="settings-form">
            <div class="field-group">
              <label class="field-label">Bio</label>
              <q-input v-model="form.bio" type="textarea" outlined placeholder="Tell us about yourself..." autogrow
                maxlength="500" counter class="styled-input" :input-style="{ minHeight: '88px' }" />
            </div>

            <div class="field-group">
              <label class="field-label">Visibility</label>
              <div class="visibility-pill" :class="{ 'visibility-pill--active': form.is_visible }">
                <q-toggle v-model="form.is_visible" color="teal-5" />
                <div class="visibility-pill__text">
                  <q-icon :name="form.is_visible ? 'visibility' : 'visibility_off'" size="18px" />
                  <span>{{ form.is_visible ? 'Public' : 'Private' }}</span>
                </div>
              </div>
              <p class="field-hint">
                {{ form.is_visible
                  ? 'Other users can see your profile'
                  : 'Only you can see your profile'
                }}
              </p>
            </div>

            <q-btn type="submit" unelevated label="Save" no-caps class="save-btn" :loading="saving">
              <template v-slot:loading>
                <q-spinner-dots color="white" size="20px" />
              </template>
            </q-btn>
          </q-form>

          <div class="danger-zone">
            <button class="danger-link" @click="showDeleteDialog">
              <q-icon name="delete_outline" size="16px" />
              Delete Account
            </button>
          </div>
        </section>

        <!-- Right column: Music -->
        <section class="card music-card" v-if="hasSpotifyData">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon
                name="img:https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png"
                size="20px" class="q-mr-xs" />
              Music Profile
            </h2>
            <button class="sync-btn" :disabled="syncing" @click="syncSpotifyData">
              <q-spinner-dots v-if="syncing" color="white" size="14px" />
              <template v-else>
                <q-icon name="sync" size="16px" />
                <span>Sync</span>
              </template>
            </button>
          </div>

          <!-- Genres -->
          <div v-if="genres.length" class="genre-row">
            <span v-for="(g, idx) in genres" :key="idx" class="genre-tag">{{ g }}</span>
          </div>

          <!-- Top Artists & Tracks -->
          <div class="music-grid">
            <div v-if="topArtists.length" class="music-col">
              <h3 class="music-col__title">Top Artists</h3>
              <div class="track-list">
                <div v-for="(artist, idx) in topArtists.slice(0, 5)" :key="artist.id || idx" class="track-row">
                  <span class="track-row__rank">{{ idx + 1 }}</span>
                  <img class="track-row__img track-row__img--round" :src="getArtistImage(artist)" :alt="artist.name" />
                  <div class="track-row__info">
                    <span class="track-row__name">{{ artist.name }}</span>
                    <span class="track-row__sub">{{ getArtistGenres(artist) }}</span>
                  </div>
                  <span v-if="artist.popularity != null" class="track-row__pop">
                    {{ artist.popularity }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="topTracks.length" class="music-col">
              <h3 class="music-col__title">Top Tracks</h3>
              <div class="track-list">
                <div v-for="(track, idx) in topTracks.slice(0, 5)" :key="track.id || idx" class="track-row">
                  <span class="track-row__rank">{{ idx + 1 }}</span>
                  <img class="track-row__img" :src="getTrackImage(track)" :alt="track.name" />
                  <div class="track-row__info">
                    <span class="track-row__name">{{ track.name }}</span>
                    <span class="track-row__sub">{{ getTrackArtists(track) }}</span>
                  </div>
                  <span v-if="track.popularity != null" class="track-row__pop">
                    {{ track.popularity }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- No Spotify data fallback -->
        <section class="card music-card music-card--empty" v-else>
          <div class="empty-state">
            <div class="empty-state__icon">
              <q-icon name="headphones" size="48px" />
            </div>
            <h3 class="empty-state__title">No Spotify Data</h3>
            <p class="empty-state__text">Connect your Spotify to display your music profile.</p>
            <button class="sync-btn sync-btn--lg" :disabled="syncing" @click="syncSpotifyData">
              <q-spinner-dots v-if="syncing" color="white" size="16px" />
              <template v-else>
                <q-icon name="sync" size="18px" />
                <span>Load Spotify Data</span>
              </template>
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- Delete Account Dialog -->
    <q-dialog v-model="deleteDialog" persistent>
      <div class="delete-modal">
        <div class="delete-modal__icon">
          <q-icon name="warning_amber" size="40px" />
        </div>
        <h2 class="delete-modal__title">Delete Account?</h2>
        <p class="delete-modal__desc">
          This action is permanent. All data will be irreversibly deleted.
        </p>

        <ul class="delete-modal__list">
          <li>Profile picture and bio</li>
          <li>Spotify data and music profile</li>
          <li>All matches and connections</li>
          <li>Event participation and activities</li>
        </ul>

        <div class="delete-modal__confirm">
          <label class="field-label" style="color: #f87171;">
            Type <strong>DELETE</strong> to confirm
          </label>
          <q-input v-model="deleteConfirmation" outlined placeholder="DELETE" class="styled-input styled-input--danger"
            :rules="[val => val === 'DELETE' || 'Type DELETE to confirm']" />
        </div>

        <div class="delete-modal__actions">
          <button class="modal-btn modal-btn--ghost" @click="closeDeleteDialog" :disabled="deleting">
            Cancel
          </button>
          <button class="modal-btn modal-btn--danger" :disabled="deleteConfirmation !== 'DELETE' || deleting"
            @click="deleteAccount">
            <q-spinner-dots v-if="deleting" color="white" size="16px" />
            <template v-else>
              <q-icon name="delete_forever" size="18px" />
              Delete Account
            </template>
          </button>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useQuasar } from 'quasar';
import { api } from '@/api';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();

const user = computed(() => auth.user);
const profileName = computed(() => user.value?.displayName || user.value?.display_name || 'Your Profile');
const profileAge = computed(() =>
  Number.isFinite(Number(user.value?.age)) ? Number(user.value.age) : null
);
const resolveAvatarUrl = (url) => {
  if (!url) return null;

  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Return relative path - Vite proxy will forward to backend
  return url;
};

// Fix avatar display - prioritize uploaded avatar over Spotify
const userAvatar = computed(() => {
  const u = user.value;
  if (!u) return defaultAvatar.value;
  if (!u) return defaultAvatar.value;

  // Priority: database avatar > Spotify images > default
  if (u.avatarUrl) {
    return resolveAvatarUrl(u.avatarUrl);
  }
  if (u.avatar_url) {
    return resolveAvatarUrl(u.avatar_url);
  }
  if (u.images?.[0]?.url) {
    return u.images[0].url;
  }

  return defaultAvatar.value;
});

const genres = computed(() => {
  const g = user.value?.genres;
  return Array.isArray(g) ? g : [];
});

const topArtists = computed(() => {
  const artists = user.value?.top_artists || user.value?.topArtists;
  return Array.isArray(artists) ? artists : [];
});

const topTracks = computed(() => {
  const tracks = user.value?.top_tracks || user.value?.topTracks;
  return Array.isArray(tracks) ? tracks : [];
});

const hasSpotifyData = computed(
  () =>
    genres.value.length > 0 ||
    topArtists.value.length > 0 ||
    topTracks.value.length > 0
);

const form = ref({ bio: '', is_visible: true });
const saving = ref(false);
const uploading = ref(false);
const syncing = ref(false);
const file = ref(null);
const previewUrl = ref('');
const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

const getArtistImage = (artist) => {
  if (artist?.images && Array.isArray(artist.images) && artist.images.length > 0) {
    return artist.images[0]?.url || artist.image || defaultAvatar;
  }
  return artist?.image || defaultAvatar;
};

const getTrackImage = (track) => {
  if (track?.album?.images && Array.isArray(track.album.images) && track.album.images.length > 0) {
    return track.album.images[0]?.url || track.album?.image || defaultAvatar;
  }
  return track?.album?.image || defaultAvatar;
};

const getArtistGenres = (artist) => {
  const g = artist?.genres;
  if (Array.isArray(g) && g.length > 0) {
    return g.slice(0, 2).join(' · ');
  }
  return 'No genres';
};

const getTrackArtists = (track) => {
  const artists = track?.artists;
  if (Array.isArray(artists) && artists.length > 0) {
    return artists.slice(0, 2).map(a => a.name || a).join(' · ');
  }
  return 'Unknown artist';
};


onMounted(async () => {
  // Wait for auth to be ready if not already
  if (!auth.ready) {
    await auth.fetchMe();
  }

  // If not authenticated, redirect to landing
  if (!auth.isAuthenticated) {
    router.push('/');
    return;
  }

  // Load profile data
  await loadProfile();
});


const doLogout = async () => {
  try {
    await auth.logout();

    $q.notify({
      type: 'positive',
      message: 'Successfully logged out',
      position: 'top',
      timeout: 2000
    });

    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  } catch (error) {
    console.error('Logout error:', error);
    $q.notify({
      type: 'negative',
      message: 'Logout failed',
      position: 'top'
    });
  }
};
async function loadProfile() {
  try {
    const res = await fetch('/api/user/me', { credentials: 'include' });
    if (!res.ok) {
      router.push('/login');
      return;
    }

    const data = await res.json();

    console.log('👤 Profile data received:', data);
    console.log('🖼️ Avatar URL (raw):', data.avatarUrl || data.avatar_url);
    console.log('🖼️ Avatar URL (resolved):', resolveAvatarUrl(data.avatarUrl || data.avatar_url));

    // Update auth store with fresh data
    auth.user = data;

    form.value.bio = data.bio || '';
    form.value.is_visible = data.is_visible !== undefined ? data.is_visible : data.isVisible !== false;
  } catch (error) {
    console.error('Load profile error:', error);
  }
}

async function save() {
  saving.value = true;

  try {
    const res = await fetch('/api/user/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form.value),
    });

    if (res.ok) {
      $q.notify({
        type: 'positive',
        message: 'Profile updated successfully',
        icon: 'check_circle',
        position: 'top'
      });

      const updatedData = await res.json();
      auth.user = { ...auth.user, ...updatedData };
    } else {
      throw new Error('Save failed');
    }
  } catch (error) {
    console.error('Save error:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to save',
      icon: 'error',
      position: 'top'
    });
  } finally {
    saving.value = false;
  }
}

async function syncSpotifyData() {
  syncing.value = true;

  try {
    const result = await api.syncSpotifyData();

    $q.notify({
      type: 'positive',
      message: `✅ ${result.topArtists} Artists, ${result.topTracks} Tracks, ${result.genres} Genres loaded`,
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    });

    // Reload profile to show new data
    await loadProfile();
  } catch (error) {
    console.error('Sync error:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to load Spotify data',
      icon: 'error',
      position: 'top'
    });
  } finally {
    syncing.value = false;
  }
}

function onFile(e) {
  file.value = e.target.files?.[0] || null;

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  if (file.value) {
    previewUrl.value = URL.createObjectURL(file.value);
  } else {
    previewUrl.value = '';
  }
}

async function uploadAvatar() {
  if (!file.value) return;

  uploading.value = true;

  try {
    const fd = new FormData();
    fd.append('avatar', file.value);

    const res = await fetch('/api/user/avatar', {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Upload failed:', errorText);
      throw new Error('Upload failed');
    }

    const data = await res.json();
    console.log('✅ Upload response:', data);

    // Clear preview
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = '';
    file.value = null;

    // Force reload profile - IMPORTANT: Wait for both to complete
    await Promise.all([
      loadProfile(),
      auth.fetchMe()
    ]);
    console.log('🔄 Refreshed user data:', auth.user);

    $q.notify({
      type: 'positive',
      message: 'Profile picture uploaded successfully',
      icon: 'cloud_done',
      position: 'top'
    });
  } catch (error) {
    console.error('Upload error:', error);
    $q.notify({
      type: 'negative',
      message: 'Upload failed',
      icon: 'error',
      position: 'top'
    });
  } finally {
    uploading.value = false;
  }
}

const deleting = ref(false);
const deleteDialog = ref(false);
const deleteConfirmation = ref('');

const showDeleteDialog = () => {
  deleteDialog.value = true;
  deleteConfirmation.value = '';
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  deleteConfirmation.value = '';
};

const deleteAccount = async () => {
  if (deleteConfirmation.value !== 'DELETE') {
    $q.notify({
      type: 'negative',
      message: 'Confirmation required',
      position: 'top'
    });
    return;
  }

  deleting.value = true;

  try {
    const res = await fetch('/api/user/me', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Delete failed');
    }

    $q.notify({
      type: 'positive',
      message: 'Account successfully deleted',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    });

    auth.user = null;
    auth.ready = false;

    setTimeout(() => {
      window.location.href = '/';
    }, 1000);

  } catch (error) {
    console.error('Delete account error:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to delete account',
      icon: 'error',
      position: 'top'
    });
  } finally {
    deleting.value = false;
    deleteDialog.value = false;
  }
};
</script>
<style scoped>
/* ─── Foundations ─────────────────────────────────────── */
.profile-page {
  min-height: 100vh;
  position: relative;
  background: #0c0c10;
  color: #e4e4e7;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
}

/* Mesh gradient background */
.bg-mesh {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(ellipse 80% 60% at 10% 0%, rgba(99, 102, 241, .12) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 90% 100%, rgba(236, 72, 153, .08) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 50% 50%, rgba(20, 184, 166, .06) 0%, transparent 60%);
  pointer-events: none;
}

.bg-noise {
  position: fixed;
  inset: 0;
  z-index: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* ─── Top bar ────────────────────────────────────────── */
.profile-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  background: rgba(12, 12, 16, .88);
  border-bottom: 1px solid rgba(255, 255, 255, .06);
}

.topbar-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f4f4f5;
}

.topbar-actions {
  display: flex;
  gap: 0.5rem;
}

.topbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 10px;
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s ease;
}

.topbar-btn--ghost {
  background: rgba(255, 255, 255, .06);
  color: #a1a1aa;
}

.topbar-btn--ghost:hover {
  background: rgba(255, 255, 255, .1);
  color: #f4f4f5;
}

/* ─── Layout ─────────────────────────────────────────── */
.profile-layout {
  position: relative;
  z-index: 1;
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── Hero card ──────────────────────────────────────── */
.hero-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}

.hero-card__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #312e81 0%, #1e1b4b 40%, #0f172a 100%);
  z-index: 0;
}

.hero-card__bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(139, 92, 246, .25) 0%, transparent 50%),
    radial-gradient(circle at 80% 30%, rgba(236, 72, 153, .15) 0%, transparent 50%);
}

.hero-card__content {
  position: relative;
  z-index: 1;
  padding: 2.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* Avatar */
.hero-avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.hero-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, .15);
  cursor: pointer;
  position: relative;
  transition: transform .25s ease, border-color .25s ease;
}

.hero-avatar:hover {
  transform: scale(1.04);
  border-color: rgba(139, 92, 246, .6);
}

.hero-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-avatar__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, .5);
  opacity: 0;
  transition: opacity .2s ease;
  color: white;
}

.hero-avatar:hover .hero-avatar__overlay {
  opacity: 1;
}

.upload-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 999px;
  border: none;
  background: rgba(139, 92, 246, .9);
  color: white;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .2s ease, transform .15s ease;
}

.upload-pill:hover:not(:disabled) {
  background: rgba(139, 92, 246, 1);
  transform: translateY(-1px);
}

.upload-pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Identity */
.hero-identity {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.hero-name {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0;
  color: #f4f4f5;
  line-height: 1.2;
}

.hero-age {
  font-weight: 500;
  color: #a1a1aa;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  background: rgba(255, 255, 255, .07);
  color: #a1a1aa;
  border: 1px solid rgba(255, 255, 255, .06);
}

.meta-chip--accent {
  background: rgba(251, 191, 36, .1);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, .15);
}

/* ─── Cards ──────────────────────────────────────────── */
.content-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.card {
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 16px;
  padding: 1.75rem;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.card__title {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: #f4f4f5;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ─── Settings card ──────────────────────────────────── */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #a1a1aa;
  letter-spacing: 0.01em;
}

.field-hint {
  font-size: 0.75rem;
  color: #71717a;
  margin: 0;
}

/* Quasar input overrides */
.styled-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, .04);
  border-radius: 10px;
  border-color: rgba(255, 255, 255, .08);
  color: #e4e4e7;
  transition: border-color .2s ease, box-shadow .2s ease;
}

.styled-input :deep(.q-field__control:hover) {
  border-color: rgba(139, 92, 246, .3);
}

.styled-input :deep(.q-field--focused .q-field__control) {
  border-color: rgba(139, 92, 246, .6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, .08);
}

.styled-input :deep(textarea),
.styled-input :deep(input) {
  color: #e4e4e7;
  font-size: 0.9rem;
}

.styled-input :deep(.q-field__counter) {
  color: #52525b;
}

.styled-input--danger :deep(.q-field__control) {
  border-color: rgba(239, 68, 68, .25);
}

.styled-input--danger :deep(.q-field--focused .q-field__control) {
  border-color: rgba(239, 68, 68, .6);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, .08);
}

/* Visibility pill */
.visibility-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .07);
  transition: all .25s ease;
}

.visibility-pill--active {
  border-color: rgba(20, 184, 166, .25);
  background: rgba(20, 184, 166, .05);
}

.visibility-pill__text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #d4d4d8;
}

/* Save button */
.save-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 12px;
  padding: 10px 0;
  border: none;
  transition: transform .15s ease, box-shadow .2s ease;
  box-shadow: 0 2px 12px rgba(124, 58, 237, .25);
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(124, 58, 237, .35);
}

.save-btn:active {
  transform: translateY(0);
}

/* Danger zone */
.danger-zone {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, .06);
}

.danger-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #71717a;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  transition: color .2s ease;
}

.danger-link:hover {
  color: #f87171;
}

/* ─── Music card ─────────────────────────────────────── */
.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, .08);
  background: rgba(255, 255, 255, .05);
  color: #a1a1aa;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s ease;
}

.sync-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, .09);
  color: #f4f4f5;
  border-color: rgba(255, 255, 255, .14);
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-btn--lg {
  padding: 8px 20px;
  font-size: 0.85rem;
  border-radius: 12px;
}

/* Genre row */
.genre-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1.5rem;
}

.genre-tag {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(139, 92, 246, .12);
  color: #c4b5fd;
  border: 1px solid rgba(139, 92, 246, .18);
  transition: all .2s ease;
}

.genre-tag:hover {
  background: rgba(139, 92, 246, .2);
  border-color: rgba(139, 92, 246, .3);
}

/* Music grid */
.music-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.music-col__title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #a1a1aa;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.75rem 0;
}

/* Track / artist rows */
.track-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 8px 10px;
  border-radius: 10px;
  transition: background .2s ease;
}

.track-row:hover {
  background: rgba(255, 255, 255, .04);
}

.track-row__rank {
  width: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #52525b;
  text-align: center;
  flex-shrink: 0;
}

.track-row__img {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background: rgba(255, 255, 255, .05);
}

.track-row__img--round {
  border-radius: 50%;
}

.track-row__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.track-row__name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #e4e4e7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-row__sub {
  font-size: 0.75rem;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-row__pop {
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 700;
  color: #6d28d9;
  background: rgba(139, 92, 246, .1);
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

/* ─── Empty state ────────────────────────────────────── */
.music-card--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

.empty-state {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-state__icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .04);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #52525b;
  margin-bottom: 0.25rem;
}

.empty-state__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #a1a1aa;
  margin: 0;
}

.empty-state__text {
  font-size: 0.85rem;
  color: #71717a;
  margin: 0;
  max-width: 260px;
}

/* ─── Delete Modal ───────────────────────────────────── */
.delete-modal {
  background: #18181b;
  border: 1px solid rgba(239, 68, 68, .15);
  border-radius: 20px;
  padding: 2rem 2rem 1.75rem;
  max-width: 440px;
  width: 100%;
  color: #e4e4e7;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.delete-modal__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(239, 68, 68, .1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f87171;
  margin-bottom: 0.5rem;
}

.delete-modal__title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fca5a5;
  margin: 0 0 0.5rem;
}

.delete-modal__desc {
  font-size: 0.88rem;
  color: #a1a1aa;
  margin: 0 0 1rem;
  line-height: 1.5;
}

.delete-modal__list {
  text-align: left;
  font-size: 0.82rem;
  color: #71717a;
  padding-left: 1.25rem;
  margin: 0 0 1.25rem;
  width: 100%;
  line-height: 1.8;
}

.delete-modal__confirm {
  width: 100%;
  text-align: left;
  margin-bottom: 1.5rem;
}

.delete-modal__actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.modal-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 0;
  border-radius: 12px;
  border: none;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s ease;
}

.modal-btn--ghost {
  background: rgba(255, 255, 255, .06);
  color: #a1a1aa;
}

.modal-btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, .1);
  color: #f4f4f5;
}

.modal-btn--danger {
  background: #dc2626;
  color: white;
}

.modal-btn--danger:hover:not(:disabled) {
  background: #ef4444;
  transform: translateY(-1px);
}

.modal-btn--danger:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.modal-btn--ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── Transitions ────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* ─── Utility ────────────────────────────────────────── */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ─── Focus states ───────────────────────────────────── */
button:focus-visible {
  outline: 2px solid rgba(139, 92, 246, .6);
  outline-offset: 2px;
}

/* ─── Scrollbar ──────────────────────────────────────── */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, .08);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, .14);
}

/* ─── Responsive ─────────────────────────────────────── */
@media (max-width: 800px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .music-grid {
    grid-template-columns: 1fr;
  }

  .hero-card__content {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }

  .hero-meta {
    justify-content: center;
  }

  .hero-name {
    font-size: 1.5rem;
  }

  .profile-layout {
    padding: 1.25rem 1rem 3rem;
  }
}

@media (max-width: 480px) {
  .hero-avatar {
    width: 96px;
    height: 96px;
  }

  .hero-name {
    font-size: 1.3rem;
  }

  .card {
    padding: 1.25rem;
    border-radius: 14px;
  }

  .delete-modal {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }
}
</style>
