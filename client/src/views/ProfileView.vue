<template>
  <q-page class="profile-page">
    <div class="bg-mesh"></div>
    <div class="bg-noise"></div>

    <header class="profile-topbar">
      <div class="topbar-inner">
        <div class="topbar-title">Profile</div>
        <button class="topbar-btn topbar-btn--ghost" @click="doLogout">
          <q-icon name="logout" size="18px" />
          <span>Logout</span>
        </button>
      </div>
    </header>

    <div class="profile-layout">
      <section class="hero-card">
        <div class="hero-card__bg"></div>
        <div class="hero-card__content">
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

      <section class="card settings-card">
        <div class="card__header">
          <div>
            <h2 class="card__title">Profile Settings</h2>
            <p class="card__sub">Edit your bio, profile picture and whether your swipe card is visible.</p>
          </div>
        </div>

        <q-form @submit.prevent="save" class="settings-form">
          <div class="field-group">
            <label class="field-label">Bio</label>
            <q-input
              v-model="form.bio"
              type="textarea"
              outlined
              placeholder="Tell us about yourself..."
              autogrow
              maxlength="500"
              counter
              class="styled-input"
              :input-style="{ minHeight: '88px' }"
            />
          </div>

          <div class="field-group">
            <label class="field-label">Visability</label>
            <div class="visibility-pill" :class="{ 'visibility-pill--active': form.isVisible }">
              <q-toggle v-model="form.isVisible" color="teal-5" />
              <div class="visibility-pill__text">
                <q-icon :name="form.isVisible ? 'visibility' : 'visibility_off'" size="18px" />
                <span>{{ form.isVisible ? 'Shown In Swipe' : 'Hidden From Swipe' }}</span>
              </div>
            </div>
            <p class="field-hint">
              {{ form.isVisible
                ? 'Your swipe card appears in discover for other users.'
                : 'Your swipe card is removed from discover until you turn it back on.'
              }}
            </p>
          </div>

          <q-btn type="submit" unelevated label="Save" no-caps class="save-btn" :loading="saving">
            <template #loading>
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
    </div>

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
          <q-input
            v-model="deleteConfirmation"
            outlined
            placeholder="DELETE"
            class="styled-input styled-input--danger"
            :rules="[val => val === 'DELETE' || 'Type DELETE to confirm']"
          />
        </div>

        <div class="delete-modal__actions">
          <button class="modal-btn modal-btn--ghost" @click="closeDeleteDialog" :disabled="deleting">
            Cancel
          </button>
          <button
            class="modal-btn modal-btn--danger"
            :disabled="deleteConfirmation !== 'DELETE' || deleting"
            @click="deleteAccount"
          >
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
import { useNotificationsStore } from '@/stores/notifications';
import { useQuasar } from 'quasar';
import { api } from '@/api';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();
const notifications = useNotificationsStore();

const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
const form = ref({ bio: '', isVisible: true });
const saving = ref(false);
const uploading = ref(false);
const file = ref(null);
const previewUrl = ref('');
const deleting = ref(false);
const deleteDialog = ref(false);
const deleteConfirmation = ref('');

const user = computed(() => auth.user);
const profileName = computed(() => user.value?.displayName || user.value?.display_name || 'Your Profile');
const profileAge = computed(() =>
  Number.isFinite(Number(user.value?.age)) ? Number(user.value.age) : null
);

const resolveAvatarUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url;
};

const userAvatar = computed(() => {
  const currentUser = user.value;
  if (!currentUser) return defaultAvatar;
  if (currentUser.avatarUrl) return resolveAvatarUrl(currentUser.avatarUrl);
  if (currentUser.avatar_url) return resolveAvatarUrl(currentUser.avatar_url);
  if (currentUser.images?.[0]?.url) return currentUser.images[0].url;
  return defaultAvatar;
});

onMounted(async () => {
  if (!auth.ready) {
    await auth.fetchMe();
  }

  if (!auth.isAuthenticated) {
    router.push('/');
    return;
  }

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
    const data = await api.getMe();
    auth.user = data;
    form.value.bio = data.bio || '';
    form.value.isVisible = data.isVisible !== false && data.is_visible !== false;
  } catch (error) {
    console.error('Load profile error:', error);
    router.push('/login');
  }
}

async function save() {
  saving.value = true;

  try {
    const updatedData = await api.updateMe({
      bio: form.value.bio,
      isVisible: form.value.isVisible,
    });

    auth.user = { ...auth.user, ...updatedData };
    notifications.add({
      type: 'system',
      title: 'Profile Updated',
      message: form.value.isVisible
        ? 'Your bio and swipe card settings were saved.'
        : 'Your swipe card is now hidden from discover.',
      icon: 'edit',
    });

    $q.notify({
      type: 'positive',
      message: 'Profile updated successfully',
      icon: 'check_circle',
      position: 'top'
    });
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

function onFile(event) {
  file.value = event.target.files?.[0] || null;

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = file.value ? URL.createObjectURL(file.value) : '';
}

async function uploadAvatar() {
  if (!file.value) return;

  uploading.value = true;

  try {
    const fd = new FormData();
    fd.append('avatar', file.value);

    await api.uploadAvatar(fd);

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = '';
    file.value = null;

    await loadProfile();
    notifications.add({
      type: 'system',
      title: 'Profile Picture Updated',
      message: 'Your new profile picture is now live.',
      icon: 'photo_camera',
    });

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
.profile-page {
  min-height: 100vh;
  position: relative;
  background: #0c0c10;
  color: #e4e4e7;
}

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

.profile-topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
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
  color: #f4f4f5;
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

.hero-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}

.hero-card__bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #312e81 0%, #1e1b4b 40%, #0f172a 100%);
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
}

.upload-pill:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hero-identity {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hero-name {
  font-size: 1.8rem;
  font-weight: 800;
  margin: 0;
  color: #f4f4f5;
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
  background: rgba(255, 255, 255, .07);
  color: #a1a1aa;
  border: 1px solid rgba(255, 255, 255, .06);
}

.meta-chip--accent {
  background: rgba(251, 191, 36, .1);
  color: #fbbf24;
  border-color: rgba(251, 191, 36, .15);
}

.card {
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .07);
  border-radius: 16px;
  padding: 1.75rem;
}

.card__header {
  margin-bottom: 1.5rem;
}

.card__title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  color: #f4f4f5;
}

.card__sub {
  margin: 6px 0 0;
  font-size: 0.82rem;
  color: #71717a;
}

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
}

.field-hint {
  font-size: 0.75rem;
  color: #71717a;
  margin: 0;
}

.styled-input :deep(.q-field__control) {
  background: rgba(255, 255, 255, .04);
  border-radius: 10px;
  border-color: rgba(255, 255, 255, .08);
  color: #e4e4e7;
}

.styled-input :deep(.q-field--focused .q-field__control) {
  border-color: rgba(139, 92, 246, .6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, .08);
}

.styled-input :deep(textarea),
.styled-input :deep(input) {
  color: #e4e4e7;
}

.styled-input--danger :deep(.q-field__control) {
  border-color: rgba(239, 68, 68, .25);
}

.visibility-pill {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .07);
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
  color: #d4d4d8;
}

.save-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  color: white;
  font-weight: 600;
  border-radius: 12px;
  padding: 10px 0;
  box-shadow: 0 2px 12px rgba(124, 58, 237, .25);
}

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
  cursor: pointer;
}

.danger-link:hover {
  color: #f87171;
}

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
}

.modal-btn--ghost {
  background: rgba(255, 255, 255, .06);
  color: #a1a1aa;
}

.modal-btn--danger {
  background: #dc2626;
  color: white;
}

.modal-btn--danger:disabled,
.modal-btn--ghost:disabled,
.upload-pill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

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

button:focus-visible {
  outline: 2px solid rgba(139, 92, 246, .6);
  outline-offset: 2px;
}

@media (max-width: 800px) {
  .hero-card__content {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }

  .hero-meta {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .profile-layout {
    padding: 1.25rem 1rem 3rem;
  }

  .hero-avatar {
    width: 96px;
    height: 96px;
  }

  .card {
    padding: 1.25rem;
  }

  .delete-modal {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }
}
</style>
