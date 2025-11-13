<template>
  <q-page class="profile-page">
    <div class="animated-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="profile-container">
      <div class="row q-col-gutter-xl items-start">
        <div class="col-12 col-md-4">
          <q-card class="glass-card q-pa-lg">
            <div class="text-h5 text-weight-bold gradient-text q-mb-md">
              <q-icon name="photo_camera" class="q-mr-sm" />
              Profilbild
            </div>

            <div class="flex column items-center q-gutter-md">
              <div class="avatar-container">
                <q-avatar size="160px" class="avatar-glow">
                  <img :src="previewUrl || user?.avatar_url || defaultAvatar" alt="avatar" />
                </q-avatar>
                <div v-if="previewUrl" class="avatar-badge">
                  <q-icon name="fiber_new" size="sm" />
                </div>
              </div>

              <div class="full-width q-gutter-sm">
                <q-btn flat unelevated icon="upload" label="Bild wählen" class="full-width modern-btn-outline" no-caps
                  @click="$refs.fileInput.click()" />
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFile" />

                <q-btn unelevated icon="cloud_upload" label="Hochladen" class="full-width gradient-btn" no-caps
                  :disable="!file" :loading="uploading" @click="uploadAvatar">
                  <template v-slot:loading>
                    <q-spinner-dots color="white" />
                  </template>
                </q-btn>
              </div>
            </div>
          </q-card>
        </div>

        <div class="col-12 col-md-8">
          <q-card class="glass-card q-pa-lg">
            <div class="row items-center justify-between q-mb-lg">
              <div class="text-h5 text-weight-bold gradient-text">
                <q-icon name="person" class="q-mr-sm" />
                Mein Profil
              </div>
              <div class="flex q-gutter-sm">
                <q-btn unelevated icon="logout" label="Logout" class="logout-btn" no-caps @click="doLogout" />
                <q-btn unelevated icon="delete_forever" label="Account löschen" class="delete-btn" no-caps
                  @click="showDeleteDialog" />
              </div>
            </div>

            <div class="q-mb-lg badges-container">
              <q-badge class="info-badge spotify-badge" v-if="user?.display_name">
                <q-icon
                  name="img:https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png"
                  size="16px" class="q-mr-xs" />
                {{ user.display_name }}
              </q-badge>

              <q-badge class="info-badge premium-badge" v-if="user?.product">
                <q-icon name="star" size="16px" class="q-mr-xs" />
                {{ user.product }}
              </q-badge>

              <q-badge class="info-badge email-badge" v-if="user?.email">
                <q-icon name="email" size="16px" class="q-mr-xs" />
                {{ user.email }}
              </q-badge>
            </div>

            <q-form @submit.prevent="save">
              <div class="q-gutter-md">
                <div>
                  <label class="input-label">
                    <q-icon name="edit_note" class="q-mr-xs" />
                    Bio
                  </label>
                  <q-input v-model="form.bio" type="textarea" outlined placeholder="Erzähl etwas über dich..." autogrow
                    maxlength="500" counter class="modern-input" :input-style="{ minHeight: '100px' }" />
                </div>

                <div class="visibility-toggle">
                  <q-toggle v-model="form.is_visible" color="purple-5" size="lg">
                    <template v-slot:default>
                      <div class="toggle-label">
                        <q-icon :name="form.is_visible ? 'visibility' : 'visibility_off'" size="sm" class="q-mr-sm" />
                        <span class="text-weight-medium">
                          Profil ist {{ form.is_visible ? 'öffentlich' : 'privat' }}
                        </span>
                      </div>
                    </template>
                  </q-toggle>
                  <div class="text-caption text-grey-6 q-mt-xs q-ml-xl">
                    {{ form.is_visible
                      ? 'Andere Nutzer können dein Profil sehen'
                      : 'Nur du kannst dein Profil sehen'
                    }}
                  </div>
                </div>

                <div class="q-mt-lg">
                  <q-btn type="submit" unelevated icon="save" label="Änderungen speichern" size="lg"
                    class="gradient-btn full-width" no-caps :loading="saving">
                    <template v-slot:loading>
                      <q-spinner-dots color="white" />
                    </template>
                  </q-btn>
                </div>
              </div>
            </q-form>
          </q-card>

          <q-card v-if="hasSpotifyData" class="glass-card q-pa-lg q-mt-xl">
            <div class="section-header row items-center justify-between q-mb-lg">
              <div class="text-h5 text-weight-bold gradient-text">
                <q-icon name="music_note" class="q-mr-sm" />
                Dein Musikprofil
              </div>
              <q-badge color="green-6" text-color="white" class="spotify-connected-badge">
                <q-icon name="check_circle" size="xs" class="q-mr-xs" />
                Spotify verbunden
              </q-badge>
            </div>

            <div v-if="genres.length" class="q-mb-lg">
              <div class="section-subtitle q-mb-sm">
                <q-icon name="category" size="sm" class="q-mr-xs" />
                Lieblingsgenres
              </div>
              <div class="genre-chips">
                <q-chip v-for="(g, idx) in genres" :key="idx" dense color="deep-purple-5" text-color="white"
                  class="genre-chip">
                  <q-icon name="music_note" size="xs" class="q-mr-xs" />
                  {{ g }}
                </q-chip>
              </div>
            </div>

            <div class="row q-col-gutter-lg">
              <div class="col-12 col-md-6" v-if="topArtists.length">
                <div class="music-section">
                  <div class="section-subtitle q-mb-sm">
                    <q-icon name="person" size="sm" class="q-mr-xs" />
                    Top-Künstler:innen
                  </div>
                  <q-list class="music-list">
                    <q-item v-for="(artist, idx) in topArtists.slice(0, 5)" :key="artist.id || idx"
                      class="music-item q-mb-xs">
                      <q-item-section avatar>
                        <q-avatar size="50px" class="artist-avatar">
                          <img :src="getArtistImage(artist)" :alt="artist.name" />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="music-title text-weight-medium">
                          {{ artist.name }}
                        </q-item-label>
                        <q-item-label caption class="music-caption">
                          {{ getArtistGenres(artist) }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side top>
                        <div class="column items-end q-gutter-xs">
                          <q-badge v-if="artist.popularity != null" color="deep-purple-4" text-color="white"
                            class="popularity-badge">
                            {{ artist.popularity }}
                            <q-icon name="trending_up" size="xs" class="q-ml-xs" />
                          </q-badge>
                          <div class="rank-badge">
                            #{{ idx + 1 }}
                          </div>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>

              <!-- Top Tracks -->
              <div class="col-12 col-md-6" v-if="topTracks.length">
                <div class="music-section">
                  <div class="section-subtitle q-mb-sm">
                    <q-icon name="library_music" size="sm" class="q-mr-xs" />
                    Top-Songs
                  </div>
                  <q-list class="music-list">
                    <q-item v-for="(track, idx) in topTracks.slice(0, 5)" :key="track.id || idx"
                      class="music-item q-mb-xs">
                      <q-item-section avatar>
                        <q-avatar size="50px" class="track-avatar" square>
                          <img :src="getTrackImage(track)" :alt="track.name" />
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="music-title text-weight-medium">
                          {{ track.name }}
                        </q-item-label>
                        <q-item-label caption class="music-caption">
                          {{ getTrackArtists(track) }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side top>
                        <div class="column items-end q-gutter-xs">
                          <q-badge v-if="track.popularity != null" color="deep-purple-4" text-color="white"
                            class="popularity-badge">
                            {{ track.popularity }}
                            <q-icon name="trending_up" size="xs" class="q-ml-xs" />
                          </q-badge>
                          <div class="rank-badge">
                            #{{ idx + 1 }}
                          </div>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </div>
          </q-card>

          <q-card v-else class="glass-card q-pa-lg q-mt-xl">
            <div class="text-center q-py-lg">
              <q-icon name="music_off" size="4rem" color="grey-6" class="q-mb-md" />
              <div class="text-h6 text-grey-4 q-mb-sm">
                Keine Spotify-Daten verfügbar
              </div>
              <div class="text-caption text-grey-6">
                Verbinde dein Spotify-Konto, um dein Musikprofil anzuzeigen
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <q-dialog v-model="deleteDialog" persistent>
      <q-card class="delete-dialog-card">
        <q-card-section class="text-center q-pb-none">
          <q-icon name="warning" size="4rem" color="red-5" class="q-mb-md" />
          <div class="text-h5 text-weight-bold text-red-5 q-mb-sm">
            Account permanent löschen?
          </div>
          <div class="text-body1 text-grey-4 q-mb-md">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </div>
        </q-card-section>

        <q-card-section>
          <div class="text-body2 text-grey-6 q-mb-md">
            Alle deine Daten werden permanent gelöscht:
          </div>
          <ul class="text-body2 text-grey-6 q-mb-lg delete-list">
            <li>Profilbild und Bio</li>
            <li>Spotify-Daten und Musikprofil</li>
            <li>Alle Matches und Verbindungen</li>
            <li>Event-Teilnahmen und Aktivitäten</li>
          </ul>

          <div class="q-mb-md">
            <label class="input-label text-red-4">
              <q-icon name="edit" class="q-mr-xs" />
              Gib "LÖSCHEN" ein um zu bestätigen:
            </label>
            <q-input v-model="deleteConfirmation" outlined placeholder="LÖSCHEN" class="delete-input"
              :rules="[val => val === 'LÖSCHEN' || 'Gib LÖSCHEN ein']" />
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pa-lg q-gutter-md">
          <q-btn flat label="Abbrechen" color="grey-6" size="lg" class="cancel-btn" @click="closeDeleteDialog"
            :disable="deleting" />
          <q-btn unelevated icon="delete_forever" label="Account löschen" color="red-5" size="lg"
            class="confirm-delete-btn" :disable="deleteConfirmation !== 'LÖSCHEN'" :loading="deleting"
            @click="deleteAccount">
            <template v-slot:loading>
              <q-spinner-dots color="white" />
            </template>
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useQuasar } from 'quasar';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();

const user = computed(() => auth.user);
const genres = computed(() => {
  const g = user.value?.genres;
  return Array.isArray(g) ? g : [];
});

const topArtists = computed(() => {
  const artists = user.value?.top_artists;
  return Array.isArray(artists) ? artists : [];
});

const topTracks = computed(() => {
  const tracks = user.value?.top_tracks;
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
  return 'Keine Genres';
};

const getTrackArtists = (track) => {
  const artists = track?.artists;
  if (Array.isArray(artists) && artists.length > 0) {
    return artists.slice(0, 2).map(a => a.name || a).join(' · ');
  }
  return 'Unbekannter Künstler';
};

onMounted(async () => {
  if (!auth.ready) await auth.fetchMe();
  await loadProfile();
});

const doLogout = async () => {
  try {
    await auth.logout();

    $q.notify({
      type: 'positive',
      message: 'Erfolgreich abgemeldet',
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
      message: 'Fehler beim Abmelden',
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

    if (data.avatar_url) {
      const timestamp = new Date().getTime();
      data.avatar_url = data.avatar_url.includes('?')
        ? `${data.avatar_url}&t=${timestamp}`
        : `${data.avatar_url}?t=${timestamp}`;
    }

    auth.user = data;

    form.value.bio = data.bio || '';
    form.value.is_visible = !!data.is_visible;
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
        message: 'Profil erfolgreich aktualisiert',
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
      message: 'Fehler beim Speichern',
      icon: 'error',
      position: 'top'
    });
  } finally {
    saving.value = false;
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
      throw new Error('Upload failed');
    }

    const data = await res.json();

    if (data?.avatar_url) {
      if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
      }
      previewUrl.value = '';
      file.value = null;

      const timestamp = new Date().getTime();
      const avatarUrlWithCacheBuster = data.avatar_url.includes('?')
        ? `${data.avatar_url}&t=${timestamp}`
        : `${data.avatar_url}?t=${timestamp}`;

      auth.user = { ...auth.user, avatar_url: avatarUrlWithCacheBuster };

      await loadProfile();

      $q.notify({
        type: 'positive',
        message: 'Profilbild erfolgreich hochgeladen',
        icon: 'cloud_done',
        position: 'top'
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    $q.notify({
      type: 'negative',
      message: 'Fehler beim Hochladen',
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
  if (deleteConfirmation.value !== 'LÖSCHEN') {
    $q.notify({
      type: 'negative',
      message: 'Bestätigung erforderlich',
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
      message: 'Account erfolgreich gelöscht',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000
    });

    // Clear auth state and redirect
    auth.user = null;
    auth.ready = false;

    setTimeout(() => {
      window.location.href = '/';
    }, 1000);

  } catch (error) {
    console.error('Delete account error:', error);
    $q.notify({
      type: 'negative',
      message: 'Fehler beim Löschen des Accounts',
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
.profile-page {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a0b2e 50%, #2d1b4e 100%);
  padding: 2rem 1rem;
}

.animated-bg {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  animation: float 20s infinite ease-in-out;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  top: -300px;
  right: -300px;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #ec4899, #f472b6);
  bottom: -200px;
  left: -200px;
  animation-delay: 7s;
}

.orb-3 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 14s;
}

@keyframes float {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  33% {
    transform: translate(30px, -30px) scale(1.1);
  }

  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(124, 58, 237, 0.2);
  border-color: rgba(124, 58, 237, 0.3);
}

.gradient-text {
  background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.avatar-container {
  position: relative;
  margin: 1rem 0;
}

.avatar-glow {
  border: 4px solid rgba(167, 139, 250, 0.3);
  box-shadow: 0 0 30px rgba(167, 139, 250, 0.5);
  transition: all 0.3s ease;
}

.avatar-glow:hover {
  transform: scale(1.05);
  box-shadow: 0 0 40px rgba(167, 139, 250, 0.7);
}

.avatar-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #ec4899, #f472b6);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(10, 10, 15, 0.9);
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.modern-btn-outline {
  border: 2px solid rgba(167, 139, 250, 0.3);
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.1);
  transition: all 0.3s ease;
}

.modern-btn-outline:hover {
  background: rgba(167, 139, 250, 0.2);
  border-color: rgba(167, 139, 250, 0.5);
  transform: translateY(-2px);
}

.gradient-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.6);
}

.gradient-btn:active {
  transform: translateY(0);
}

.logout-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  font-weight: 600;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  font-weight: 600;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

.badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.info-badge {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  border: 2px solid;
}

.spotify-badge {
  background: rgba(30, 215, 96, 0.1);
  color: #1ed760;
  border-color: rgba(30, 215, 96, 0.3);
}

.premium-badge {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.3);
}

.email-badge {
  background: rgba(99, 102, 241, 0.1);
  color: #818cf8;
  border-color: rgba(99, 102, 241, 0.3);
}

.input-label {
  display: flex;
  align-items: center;
  color: #a78bfa;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.modern-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border-color: rgba(167, 139, 250, 0.2);
  color: white;
}

.modern-input :deep(.q-field__control):hover {
  border-color: rgba(167, 139, 250, 0.4);
}

.modern-input :deep(.q-field__control):focus-within {
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
}

.modern-input :deep(textarea) {
  color: white;
}

.modern-input :deep(.q-field__counter) {
  color: rgba(167, 139, 250, 0.6);
}

.visibility-toggle {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(167, 139, 250, 0.2);
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

.visibility-toggle:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(167, 139, 250, 0.3);
}

.toggle-label {
  display: flex;
  align-items: center;
  color: white;
  font-size: 1rem;
}

.hidden {
  display: none;
}

/* Spotify Profile Styles */
.spotify-connected-badge {
  padding: 0.4rem 0.8rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.section-subtitle {
  display: flex;
  align-items: center;
  color: #a78bfa;
  font-weight: 600;
  font-size: 0.95rem;
}

.genre-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genre-chip {
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.9), rgba(236, 72, 153, 0.9));
  font-weight: 600;
  padding: 0.5rem 1rem;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
  transition: all 0.2s ease;
}

.genre-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.5);
}

.music-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(167, 139, 250, 0.1);
}

.music-list {
  background: transparent;
}

.music-item {
  border-radius: 12px;
  padding: 0.75rem;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.music-item:hover {
  background: rgba(167, 139, 250, 0.1);
  border-color: rgba(167, 139, 250, 0.2);
  transform: translateX(4px);
}

.artist-avatar {
  border: 2px solid rgba(167, 139, 250, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.track-avatar {
  border: 2px solid rgba(167, 139, 250, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.music-title {
  color: white;
  font-size: 0.95rem;
}

.music-caption {
  color: rgba(167, 139, 250, 0.7);
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.popularity-badge {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 8px;
}

.rank-badge {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(236, 72, 153, 0.3));
  color: #a78bfa;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(167, 139, 250, 0.3);
}

.delete-dialog-card {
  background: rgba(10, 10, 15, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 24px;
  color: white;
  min-width: 500px;
  max-width: 600px;
}

.delete-list {
  padding-left: 1.5rem;
}

.delete-list li {
  margin-bottom: 0.5rem;
}

.delete-input :deep(.q-field__control) {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: white;
}

.delete-input :deep(.q-field__control):focus-within {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

.cancel-btn {
  min-width: 120px;
}

.confirm-delete-btn {
  min-width: 160px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  font-weight: 600;
}

.confirm-delete-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .profile-page {
    padding: 1rem 0.5rem;
  }

  .glass-card {
    border-radius: 16px;
  }

  .avatar-glow {
    width: 120px !important;
    height: 120px !important;
  }

  .gradient-orb {
    filter: blur(60px);
  }

  .orb-1 {
    width: 400px;
    height: 400px;
  }

  .orb-2 {
    width: 300px;
    height: 300px;
  }

  .orb-3 {
    width: 350px;
    height: 350px;
  }

  .badges-container {
    gap: 0.5rem;
  }

  .info-badge {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }

  .music-item {
    padding: 0.5rem;
  }

  .artist-avatar,
  .track-avatar {
    width: 40px !important;
    height: 40px !important;
  }

  .music-title {
    font-size: 0.85rem;
  }

  .music-caption {
    font-size: 0.75rem;
  }

  .delete-dialog-card {
    min-width: auto;
    margin: 1rem;
  }

  .row.items-center.justify-between {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .flex.q-gutter-sm {
    justify-content: space-between;
  }
}

/* Loading states */
.q-spinner-dots {
  color: white;
}

/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Focus states for accessibility */
button:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(167, 139, 250, 0.3);
  border-radius: 4px;
  transition: background 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(167, 139, 250, 0.5);
}

/* Print styles */
@media print {

  .animated-bg,
  .gradient-orb {
    display: none;
  }

  .glass-card {
    background: white;
    color: black;
    border: 1px solid #ddd;
  }

  .gradient-text {
    -webkit-text-fill-color: black;
    background: none;
  }
}
</style>