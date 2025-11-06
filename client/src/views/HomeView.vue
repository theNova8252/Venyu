<template>
  <div class="homepage-container">
    <!-- Animated Background -->
    <div class="background-gradient">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="content-wrapper">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="welcome-card">
          <div class="sparkle-icon">✨</div>
          <h1 class="welcome-title">Welcome back, {{ user.me?.firstName || 'Guest' }}</h1>
          <p class="welcome-subtitle">Your music journey continues</p>
        </div>

        <!-- User Profile Card -->
        <div v-if="user.me" class="profile-card glass-card">
          <div class="profile-header">
            <div class="avatar-wrapper">
              <q-avatar size="100px" class="profile-avatar">
                <img :src="`https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`" />
                <div class="avatar-ring"></div>
              </q-avatar>
              <div class="status-dot"></div>
            </div>
            <div class="profile-info">
              <h2 class="profile-name">{{ user.me.name }}</h2>
              <div class="profile-meta" v-if="user.me.birthday">
                <q-icon name="cake" size="18px" />
                <span>{{ formatDate(user.me.birthday) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="quick-action-section">
        <router-link to="/swipe" class="swipe-action-btn">
          <div class="btn-icon-wrapper">
            <q-icon name="swipe" size="32px" />
          </div>
          <div class="btn-content">
            <div class="btn-title">Discover Matches</div>
            <div class="btn-subtitle">Start swiping to find your music soulmate</div>
          </div>
          <q-icon name="arrow_forward" size="24px" class="btn-arrow" />
        </router-link>
      </div>
      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <q-icon name="music_note" size="28px" color="white" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ user.me?.topArtists?.length || 0 }}</div>
            <div class="stat-label">Top Artists</div>
          </div>
        </div>

        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <q-icon name="favorite" size="28px" color="white" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ matches.list?.length || 0 }}</div>
            <div class="stat-label">Matches</div>
          </div>
        </div>

        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <q-icon name="event" size="28px" color="white" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ events.list?.length || 0 }}</div>
            <div class="stat-label">Events</div>
          </div>
        </div>

        <div class="stat-card glass-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <q-icon name="category" size="28px" color="white" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ user.me?.genres?.length || 0 }}</div>
            <div class="stat-label">Genres</div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-grid">
        <!-- Left Column -->
        <div class="left-column">
          <!-- Top Artists -->
          <div class="content-card glass-card">
            <div class="card-header">
              <div class="header-icon">
                <q-icon name="stars" size="24px" color="purple-5" />
              </div>
              <h3 class="card-title">Your Top Artists</h3>
            </div>
            <div class="artists-grid">
              <div v-for="(artist, idx) in (user.me?.topArtists || [])" :key="artist" class="artist-chip"
                :style="{ animationDelay: `${idx * 0.1}s` }">
                <div class="artist-rank">{{ idx + 1 }}</div>
                <div class="artist-name">{{ artist }}</div>
                <q-icon name="verified" size="18px" color="purple-5" />
              </div>
            </div>
          </div>

          <!-- Genres -->
          <div v-if="user.me?.genres && user.me.genres.length > 0" class="content-card glass-card">
            <div class="card-header">
              <div class="header-icon">
                <q-icon name="library_music" size="24px" color="pink-5" />
              </div>
              <h3 class="card-title">Favorite Genres</h3>
            </div>
            <div class="genres-container">
              <div v-for="(genre, idx) in user.me.genres" :key="genre" class="genre-badge"
                :style="{ animationDelay: `${idx * 0.08}s` }">
                {{ genre }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="right-column">
          <!-- Matches -->
          <div class="content-card glass-card">
            <div class="card-header">
              <div class="header-icon">
                <q-icon name="people" size="24px" color="pink-5" />
              </div>
              <h3 class="card-title">Your Matches</h3>
              <q-btn flat round dense icon="refresh" size="sm" @click="matches.fetchMatches()" class="refresh-btn" />
            </div>
            <div class="matches-list">
              <div v-for="m in matches.list" :key="m.id" class="match-item">
                <div class="match-avatar">
                  <img :src="`https://i.pravatar.cc/150?img=${m.id.charCodeAt(0) % 70}`" />
                </div>
                <div class="match-info">
                  <div class="match-score-badge">{{ m.score }}% Match</div>
                  <div class="match-artists">
                    <q-icon name="music_note" size="14px" />
                    {{ m.sharedArtists.join(', ') }}
                  </div>
                </div>
                <q-btn :flat="!m.liked" :unelevated="m.liked" round :icon="m.liked ? 'favorite' : 'favorite_border'"
                  :color="m.liked ? 'pink-5' : 'grey-6'" size="sm" :disable="m.liked" @click="matches.like(m.id)"
                  class="like-btn" />
              </div>
            </div>
          </div>

          <!-- Events -->
          <div class="content-card glass-card">
            <div class="card-header">
              <div class="header-icon">
                <q-icon name="confirmation_number" size="24px" color="blue-5" />
              </div>
              <h3 class="card-title">Nearby Events</h3>
              <q-btn flat round dense icon="refresh" size="sm" @click="events.fetchNearby()" class="refresh-btn" />
            </div>
            <div class="events-list">
              <div v-for="event in events.list" :key="event.id" class="event-item">
                <div class="event-date">
                  <div class="date-month">{{ formatEventMonth(event.date) }}</div>
                  <div class="date-day">{{ formatEventDay(event.date) }}</div>
                </div>
                <div class="event-details">
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-location">
                    <q-icon name="place" size="14px" />
                    {{ event.city }}
                  </div>
                </div>
                <q-btn flat round icon="arrow_forward" size="sm" class="event-btn" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { useMatchesStore } from '@/stores/matches';
import { useEventsStore } from '@/stores/events';

const user = useUserStore();
const matches = useMatchesStore();
const events = useEventsStore();

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatEventMonth = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
};

const formatEventDay = (dateString) => {
  const date = new Date(dateString);
  return date.getDate();
};

onMounted(async () => {
  if (!user.me) await user.fetchMe();
  if (!matches.list.length) await matches.fetchMatches();
  if (!events.list.length) await events.fetchNearby();
});
</script>

<style scoped lang="scss">
.homepage-container {
  min-height: 100vh;
  background: #0a0a0f;
  position: relative;
  overflow-x: hidden;
}

.background-gradient {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: floatOrb 20s infinite ease-in-out;
}

.orb-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  top: -10%;
  right: -10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  bottom: -5%;
  left: -5%;
  animation-delay: -7s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  top: 40%;
  left: 40%;
  animation-delay: -14s;
}

@keyframes floatOrb {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  33% {
    transform: translate(50px, -50px) scale(1.1);
  }

  66% {
    transform: translate(-50px, 50px) scale(0.9);
  }
}

.content-wrapper {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.hero-section {
  margin-bottom: 3rem;
}

.welcome-card {
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease;
}
.quick-action-section {
  margin: 2rem auto;
  max-width: 600px;
  animation: fadeInUp 1s ease;
}

.swipe-action-btn {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15));
  backdrop-filter: blur(20px);
  border: 2px solid rgba(236, 72, 153, 0.3);
  border-radius: 20px;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(168, 85, 247, 0.2));
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(236, 72, 153, 0.5);
    box-shadow: 0 20px 60px rgba(236, 72, 153, 0.3);

    &::before {
      opacity: 1;
    }

    .btn-arrow {
      transform: translateX(8px);
    }

    .btn-icon-wrapper {
      transform: scale(1.1) rotate(10deg);
    }
  }

  &:active {
    transform: translateY(-2px);
  }
}

.btn-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 10px 30px rgba(236, 72, 153, 0.4);
  transition: all 0.4s ease;
  position: relative;
  z-index: 1;
}

.btn-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.btn-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.25rem;
}

.btn-subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

.btn-arrow {
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.4s ease;
  position: relative;
  z-index: 1;
}

.sparkle-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: sparkle 2s infinite ease-in-out;
}

@keyframes sparkle {

  0%,
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }

  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 0.8;
  }
}

.welcome-title {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #c7d2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.6);
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  animation: fadeInUp 0.8s ease;
}

.profile-card {
  padding: 2rem;
  margin: 0 auto;
  max-width: 600px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.avatar-wrapper {
  position: relative;
}

.profile-avatar {
  border: 4px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
  z-index: -1;
  animation: rotateRing 3s linear infinite;
}

@keyframes rotateRing {
  to {
    transform: rotate(360deg);
  }
}

.status-dot {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  background: #4ade80;
  border: 3px solid #0a0a0f;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
  }
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.content-card {
  padding: 2rem;
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  flex: 1;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.refresh-btn {
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;

  &:hover {
    color: white;
    transform: rotate(180deg);
  }
}

.artists-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.artist-chip {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
  animation: slideInLeft 0.6s ease forwards;
  opacity: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(5px);
  }
}

@keyframes slideInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.artist-rank {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 0.9rem;
}

.artist-name {
  flex: 1;
  color: white;
  font-weight: 600;
  font-size: 1.05rem;
}

.genres-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.genre-badge {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(239, 68, 68, 0.2));
  border: 1px solid rgba(236, 72, 153, 0.3);
  border-radius: 12px;
  color: #fda4af;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  animation: slideInLeft 0.6s ease forwards;
  opacity: 0;

  &:hover {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(239, 68, 68, 0.3));
    transform: scale(1.05);
  }
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.match-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.match-info {
  flex: 1;
}

.match-score-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  border-radius: 8px;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.match-artists {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.like-btn {
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.2);
  }
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.event-date {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.date-month {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 1px;
}

.date-day {
  font-size: 1.75rem;
  font-weight: 800;
  color: white;
  line-height: 1;
}

.event-details {
  flex: 1;
}

.event-title {
  font-weight: 700;
  color: white;
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}

.event-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.event-btn {
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;

  &:hover {
    color: white;
    transform: translateX(5px);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .content-wrapper {
    padding: 2rem 1rem;
  }

  .welcome-title {
    font-size: 2rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .main-grid {
    gap: 1rem;
  }

  .content-card {
    padding: 1.5rem;
  }
}
</style>