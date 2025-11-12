<template>
  <q-page class="demo-login-page">
    <!-- Login Step -->
    <transition name="fade-slide" mode="out-in">
      <div v-if="step === 'login'" key="login" class="split-container">
        <!-- Left Side - Form -->
        <div class="left-side">
          <div class="form-container">
            <h1 class="form-title">Create an account</h1>
            <p class="form-subtitle">Enter your details below to create your account</p>

            <q-form @submit="handleSignup" class="signup-form">
              <div class="name-row">
                <div class="form-field">
                  <label class="field-label">First Name</label>
                  <q-input v-model="formData.firstName" outlined dense class="custom-input"
                    :rules="[val => !!val || 'Required']" />
                </div>

                <div class="form-field">
                  <label class="field-label">Last Name</label>
                  <q-input v-model="formData.lastName" outlined dense class="custom-input"
                    :rules="[val => !!val || 'Required']" />
                </div>
              </div>

              <div class="form-field">
                <label class="field-label">Birthday</label>
                <q-input v-model="formData.birthday" outlined dense type="date" class="custom-input"
                  :rules="[val => !!val || 'Required']" />
              </div>

              <q-btn type="submit" unelevated class="signup-btn" label="Sign up" no-caps />

              <p class="terms-text">
                By clicking continue, you agree to our Terms of Service and Privacy Policy
              </p>
            </q-form>
          </div>
        </div>

        <!-- Right Side - Brand -->
        <div class="right-side">
          <div class="brand-content">
            <img src="../assets/venyuUpscaled.png" alt="Venyu" class="brand-logo" />

            <div class="user-avatars">
              <img src="https://i.pravatar.cc/150?img=33" alt="User" class="avatar" />
              <img src="https://i.pravatar.cc/150?img=45" alt="User" class="avatar" />
              <img src="https://i.pravatar.cc/150?img=68" alt="User" class="avatar" />
              <div class="avatar-count">+100</div>
            </div>

            <h2 class="brand-tagline">Used by Users Worldwide</h2>

            <div class="testimonial">
              <p class="testimonial-text">
                "Venyu connects your music taste with real people — discover events, find your vibe, and meet those who
                move to the same rhythm."
              </p>
              <p class="testimonial-author">Pitchfork</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Preferences Step -->
      <div v-else-if="step === 'preferences'" key="preferences" class="preferences-container">
        <div class="preferences-content">
          <div class="preferences-header">
            <h1 class="preferences-title">Complete Your Profile</h1>
            <p class="preferences-subtitle">
              Help us personalize your experience by selecting your favorite genres and artists
            </p>
          </div>

          <!-- Genres Section -->
          <div class="selection-section">
            <div class="section-header">
              <q-icon name="music_note" size="28px" color="purple-5" />
              <h3 class="section-title">Favorite Genres</h3>
            </div>

            <div class="chips-container">
              <q-chip v-for="genre in genres" :key="genre" :selected="selectedGenres.includes(genre)"
                @click="toggleGenre(genre)" clickable :color="selectedGenres.includes(genre) ? 'purple-5' : 'grey-8'"
                text-color="white" class="genre-chip">
                {{ genre }}
              </q-chip>
            </div>
          </div>

          <!-- Artists Section -->
          <div class="selection-section">
            <div class="section-header">
              <q-icon name="favorite" size="28px" color="pink-5" />
              <h3 class="section-title">Favorite Artists</h3>
            </div>

            <div class="chips-container">
              <q-chip v-for="artist in artists" :key="artist" :selected="selectedArtists.includes(artist)"
                @click="toggleArtist(artist)" clickable :color="selectedArtists.includes(artist) ? 'pink-5' : 'grey-8'"
                text-color="white" class="artist-chip">
                {{ artist }}
              </q-chip>
            </div>
          </div>

          <div class="preferences-actions">
            <q-btn outline color="grey-6" label="Skip for now" @click="completeSetup" no-caps class="skip-btn" />
            <q-btn unelevated color="purple-5"
              :label="`Continue (${selectedGenres.length + selectedArtists.length} selected)`" @click="completeSetup"
              no-caps class="continue-btn" :disable="selectedGenres.length === 0 && selectedArtists.length === 0" />
          </div>
        </div>

        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>
    </transition>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const $q = useQuasar()
const userStore = useUserStore()

const step = ref('login')
const formData = ref({
  firstName: '',
  lastName: '',
  birthday: ''
})

const genres = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Indie',
  'Jazz', 'Country', 'Classical', 'Metal', 'Alternative', 'Soul',
  'Reggae', 'Blues', 'Folk', 'Punk'
]

const artists = [
  'Taylor Swift', 'Drake', 'The Weeknd', 'Bad Bunny', 'SZA', 'Travis Scott',
  'Olivia Rodrigo', 'Harry Styles', 'Doja Cat', 'Post Malone', 'Billie Eilish',
  'Ariana Grande', 'Ed Sheeran', 'Dua Lipa', 'Kendrick Lamar', 'Beyoncé'
]

const selectedGenres = ref([])
const selectedArtists = ref([])

const handleSignup = () => {
  // Animate to next step
  step.value = 'preferences'
}

const toggleGenre = (genre) => {
  const index = selectedGenres.value.indexOf(genre)
  if (index > -1) {
    selectedGenres.value.splice(index, 1)
  } else {
    selectedGenres.value.push(genre)
  }
}

const toggleArtist = (artist) => {
  const index = selectedArtists.value.indexOf(artist)
  if (index > -1) {
    selectedArtists.value.splice(index, 1)
  } else {
    selectedArtists.value.push(artist)
  }
}

const completeSetup = () => {
  // Create complete user profile
  const userData = {
    id: 'demo-user',
    name: `${formData.value.firstName} ${formData.value.lastName}`,
    firstName: formData.value.firstName,
    lastName: formData.value.lastName,
    birthday: formData.value.birthday,
    topArtists: selectedArtists.value.length > 0 ? selectedArtists.value : ['Fred again..'],
    genres: selectedGenres.value.length > 0 ? selectedGenres.value : ['electropop'],
    createdAt: new Date().toISOString()
  }

  // Save to localStorage
  localStorage.setItem('venyu_demo_user', JSON.stringify(userData))

  // Update the user store
  userStore.setUser(userData)

  $q.notify({
    type: 'positive',
    message: 'Profile created successfully!',
    position: 'top',
    timeout: 2000
  })

  // Navigate to main app
  setTimeout(() => {
    router.push({ name: 'Home' })
  }, 500)
}
</script>

<style scoped lang="scss">
.demo-login-page {
  min-height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
}

// Transition animations
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(60px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-60px);
}

/* ==================== LOGIN STEP ==================== */
.split-container {
  display: flex;
  min-height: 100vh;
}

.left-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
}

.form-container {
  max-width: 500px;
  width: 100%;
}

.form-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.form-subtitle {
  font-size: 1rem;
  color: #666;
  margin-bottom: 3rem;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
}

.custom-input {
  :deep(.q-field__control) {
    height: 50px;
    border-radius: 8px;
    background: white;

    &:before {
      border-color: #d1d5db;
    }
  }

  :deep(.q-field__native) {
    font-size: 1rem;
    color: #1a1a1a;
  }
}

.signup-btn {
  width: 100%;
  height: 50px;
  background: #1a1a1a;
  color: white;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background: #2d2d2d;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
}

.terms-text {
  text-align: center;
  font-size: 0.875rem;
  color: #999;
  line-height: 1.5;
}

.right-side {
  flex: 1;
  background: #2d2d2d;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%);
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 500px;
}

.brand-logo {
  width: 200px;
  height: auto;
  margin-bottom: 3rem;
  filter: brightness(0) invert(1);
}

.user-avatars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 2rem;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #2d2d2d;
  margin-left: -15px;
  transition: transform 0.3s ease;

  &:first-child {
    margin-left: 0;
  }

  &:hover {
    transform: translateY(-5px) scale(1.1);
    z-index: 10;
  }
}

.avatar-count {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.95rem;
  margin-left: -15px;
  border: 3px solid #2d2d2d;
}

.brand-tagline {
  font-size: 2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 3rem;
  font-family: 'Courier New', monospace;
  letter-spacing: -0.5px;
}

.testimonial {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.testimonial-text {
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  margin-bottom: 1rem;
  font-style: italic;
}

.testimonial-author {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

/* ==================== PREFERENCES STEP ==================== */
.preferences-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

.preferences-content {
  max-width: 900px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  padding: 3rem;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 2;
  animation: slideUp 0.6s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preferences-header {
  text-align: center;
  margin-bottom: 3rem;
}

.preferences-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
}

.preferences-subtitle {
  font-size: 1.1rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
}

.selection-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.genre-chip,
.artist-chip {
  font-size: 1rem;
  font-weight: 600;
  height: 42px;
  padding: 0 1.25rem;
  border-radius: 21px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(-1px);
  }
}

.preferences-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e5e5;
}

.skip-btn,
.continue-btn {
  height: 50px;
  padding: 0 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.continue-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.skip-btn {
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.floating-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
  animation: floatShape 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f093fb, #667eea);
  top: -10%;
  right: -5%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #764ba2, #f093fb);
  bottom: 10%;
  left: -5%;
  animation-delay: -7s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  top: 50%;
  left: 50%;
  animation-delay: -14s;
}

@keyframes floatShape {

  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }

  33% {
    transform: translate(50px, -50px) rotate(120deg);
  }

  66% {
    transform: translate(-50px, 50px) rotate(240deg);
  }
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .split-container {
    flex-direction: column;
  }

  .right-side {
    min-height: 400px;
  }
}

@media (max-width: 640px) {

  .left-side,
  .preferences-content {
    padding: 2rem 1.5rem;
  }

  .form-title,
  .preferences-title {
    font-size: 2rem;
  }

  .name-row {
    grid-template-columns: 1fr;
  }

  .brand-logo {
    width: 150px;
  }

  .brand-tagline {
    font-size: 1.5rem;
  }

  .preferences-actions {
    flex-direction: column;

    .skip-btn,
    .continue-btn {
      width: 100%;
    }
  }
}
</style>