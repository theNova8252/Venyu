<template>
  <q-page class="home">
    <!-- Background -->
    <div class="bg-mesh">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="bg-noise"></div>
    </div>

    <div class="home-container">

      <!-- HERO -->
      <section class="hero-card liquid-glass">
        <div class="hero-grid">

          <!-- Left: Greeting + CTA -->
          <div class="hero-left">
            <template v-if="loadingMe">
              <q-skeleton type="text" width="70%" height="48px" />
              <q-skeleton type="text" width="45%" class="q-mt-sm" />
            </template>

            <template v-else>
              <p class="hero-greeting">Welcome back,</p>
              <h1 class="hero-name">{{ displayName }}</h1>
              <p class="hero-subtitle">
                Your music taste is your superpower. Let's find your people.
              </p>
            </template>

            <div class="hero-actions">
              <q-btn to="/swipe" unelevated no-caps class="cta-primary" icon="swipe" label="Start Swiping" />
              <q-btn to="/events" flat no-caps class="cta-secondary" icon="event" label="Explore Events" />
            </div>
          </div>

          <!-- Right: Spotify profile -->
          <div class="hero-right">
            <div class="profile-card liquid-glass-strong">
              <div class="profile-top">
                <template v-if="loadingMe">
                  <q-skeleton type="QAvatar" size="72px" />
                  <div class="col">
                    <q-skeleton type="text" width="60%" />
                    <q-skeleton type="text" width="40%" />
                  </div>
                </template>

                <template v-else>
                  <q-avatar size="72px" class="profile-avatar">
                    <img v-if="avatarUrl" :src="avatarUrl" />
                    <div v-else class="initials">{{ initials }}</div>
                  </q-avatar>

                  <div class="profile-info">
                    <div class="profile-name">{{ displayName }}</div>
                    <div class="profile-handle" v-if="user.me?.spotifyId">
                      @{{ user.me.spotifyId }}
                    </div>
                    <div class="profile-meta">
                      <q-icon name="public" size="13px" />
                      <span>{{ user.me?.country || 'World' }}</span>
                      <span class="dot">·</span>
                      <span>{{ user.me?.product || 'Spotify User' }}</span>
                    </div>
                  </div>
                </template>
              </div>

              <div class="profile-divider"></div>

              <div class="profile-bottom">
                <div class="sync-info">
                  <span class="sync-label">Last sync</span>
                  <span class="sync-value">{{ lastSync }}</span>
                </div>
                <q-btn flat dense no-caps icon="sync" label="Refresh" size="sm" @click="refreshAll" class="refresh-btn" />
              </div>
            </div>

            <router-link to="/profile" class="profile-link">
              View full profile
              <q-icon name="arrow_forward" size="16px" />
            </router-link>
          </div>
        </div>

        <!-- Stats strip -->
        <div class="stats-strip">
          <div class="stat-pill liquid-glass-inset">
            <div class="stat-value">{{ user.me?.topArtists?.length || 0 }}</div>
            <div class="stat-label">Top Artists</div>
          </div>
          <div class="stat-pill liquid-glass-inset">
            <div class="stat-value">{{ matches.list?.length || 0 }}</div>
            <div class="stat-label">Matches</div>
          </div>
          <div class="stat-pill liquid-glass-inset">
            <div class="stat-value">{{ events.list?.length || 0 }}</div>
            <div class="stat-label">Events</div>
          </div>
          <div class="stat-pill liquid-glass-inset">
            <div class="stat-value">{{ user.me?.genres?.length || 0 }}</div>
            <div class="stat-label">Genres</div>
          </div>
        </div>
      </section>

      <!-- CURRENTLY PLAYING -->
      <section v-if="currentlyPlaying?.isPlaying" class="np-card liquid-glass">
        <div class="np-inner">
          <img v-if="currentlyPlaying.albumImage" :src="currentlyPlaying.albumImage" class="np-cover" />
          <div class="np-info">
            <div class="np-label">
              <div class="np-dot"></div>
              Now Playing on Spotify
            </div>
            <div class="np-track">{{ currentlyPlaying.trackName }}</div>
            <div class="np-artist">{{ currentlyPlaying.artistName }}</div>
            <div class="np-progress">
              <div class="np-bar">
                <div class="np-fill" :style="{ width: npProgress + '%' }"></div>
              </div>
              <div class="np-times">
                <span>{{ formatMs(interpolatedProgress) }}</span>
                <span>{{ formatMs(currentlyPlaying.durationMs) }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- MAIN GRID -->
      <section class="main-grid">
        <!-- Left column -->
        <div class="col-left">
          <!-- Recently Played -->
          <div class="liquid-glass content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon"><q-icon name="history" size="18px" /></div>
                <h3>Recently Played</h3>
              </div>
              <q-btn flat round dense icon="refresh" size="sm" @click="fetchRecentlyPlayed" />
            </div>

            <div v-if="loadingRecent" class="q-gutter-sm">
              <q-skeleton v-for="i in 5" :key="i" height="44px" />
            </div>

            <div v-else class="track-list">
              <div v-for="(item, idx) in recentlyPlayed.slice(0, 5)" :key="idx" class="track-row">
                <q-avatar size="36px" class="track-cover">
                  <img v-if="item.track.album.image" :src="item.track.album.image" />
                  <div v-else class="initials small">{{ (item.track.name || '?')[0] }}</div>
                </q-avatar>
                <div class="col min-width-0">
                  <div class="track-name text-ellipsis">{{ item.track.name }}</div>
                  <div class="track-artist text-ellipsis">
                    {{ item.track.artists.map(a => a.name).join(', ') }}
                  </div>
                </div>
                <div class="track-time">{{ formatPlayedAt(item.playedAt) }}</div>
              </div>

              <div v-if="!recentlyPlayed.length" class="empty-state">
                No recent plays found. Start listening on Spotify!
              </div>
            </div>
          </div>

          <!-- Top Artists -->
          <div class="liquid-glass content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon"><q-icon name="stars" size="18px" /></div>
                <h3>Your Top Artists</h3>
              </div>
            </div>

            <div v-if="loadingMe" class="artist-grid">
              <div v-for="i in 9" :key="i" class="artist-cell">
                <q-skeleton type="rect" class="artist-img-skel" />
                <q-skeleton type="text" width="70%" class="q-mt-xs" />
              </div>
            </div>

            <div v-else class="artist-grid">
              <div v-for="(artist, idx) in (user.me?.topArtists || []).slice(0, 9)" :key="artist.id || idx"
                class="artist-cell">
                <div class="artist-img">
                  <img v-if="artist.image" :src="artist.image" />
                  <div v-else class="initials small">{{ (artist.name || '?')[0] }}</div>
                </div>
                <div class="artist-cell-name">{{ artist.name }}</div>
              </div>

              <div v-if="!user.me?.topArtists?.length" class="empty-state" style="grid-column: 1 / -1">
                No top artists yet — sync Spotify to see your vibe.
              </div>
            </div>
          </div>

          <!-- Genres -->
          <div v-if="user.me?.genres?.length" class="liquid-glass content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon"><q-icon name="library_music" size="18px" /></div>
                <h3>Favorite Genres</h3>
              </div>
            </div>
            <div class="chip-wrap">
              <span v-for="g in user.me.genres" :key="g" class="genre-chip">{{ g }}</span>
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="col-right">
          <!-- My Events -->
          <div class="liquid-glass content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon"><q-icon name="event_available" size="18px" /></div>
                <h3>My Events</h3>
              </div>
            </div>
            <div v-if="loadingEvents" class="q-gutter-sm">
              <q-skeleton v-for="i in 3" :key="i" height="64px" />
            </div>
            <div v-else>
              <div v-if="interestedEvents.length" class="event-section">
                <div class="section-label">
                  <q-icon name="star" size="14px" color="pink-6" />
                  <span>Interested ({{ interestedEvents.length }})</span>
                </div>
                <div class="event-list">
                  <div v-for="e in interestedEvents" :key="e.id" class="event-row">
                    <div class="event-date-badge">
                      <div class="month">{{ formatEventMonth(e.date) }}</div>
                      <div class="day">{{ formatEventDay(e.date) }}</div>
                    </div>
                    <div class="col">
                      <div class="event-title">{{ e.title }}</div>
                      <div class="event-meta"><q-icon name="place" size="13px" /> {{ e.city }}</div>
                    </div>
                    <q-btn flat round icon="close" size="sm" @click="events.toggleInterested(e.id)" />
                  </div>
                </div>
              </div>

              <div v-if="goingEvents.length" class="event-section" style="margin-top: 12px">
                <div class="section-label">
                  <q-icon name="check_circle" size="14px" color="purple-6" />
                  <span>Going ({{ goingEvents.length }})</span>
                </div>
                <div class="event-list">
                  <div v-for="e in goingEvents" :key="e.id" class="event-row">
                    <div class="event-date-badge">
                      <div class="month">{{ formatEventMonth(e.date) }}</div>
                      <div class="day">{{ formatEventDay(e.date) }}</div>
                    </div>
                    <div class="col">
                      <div class="event-title">{{ e.title }}</div>
                      <div class="event-meta"><q-icon name="place" size="13px" /> {{ e.city }}</div>
                    </div>
                    <q-btn flat round icon="close" size="sm" @click="events.toggleGoing(e.id)" />
                  </div>
                </div>
              </div>

              <div v-if="!interestedEvents.length && !goingEvents.length" class="empty-state">
                Mark events as interested or going on the map!
              </div>
            </div>
          </div>

          <!-- My Matches -->
          <div class="liquid-glass content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon"><q-icon name="people" size="18px" /></div>
                <h3>My Matches</h3>
              </div>
            </div>

            <div v-if="loadingMatches" class="q-gutter-sm">
              <q-skeleton v-for="i in 3" :key="i" height="64px" />
            </div>

            <div v-else class="match-list">
              <div v-for="m in matches.list" :key="m.id" class="match-row">
                <q-avatar size="44px" class="match-avatar">
                  <img v-if="m.avatarUrl" :src="m.avatarUrl" />
                  <div v-else class="initials small">{{ (m.name || 'M')[0] }}</div>
                </q-avatar>
                <div class="col">
                  <div class="match-top">
                    <div class="match-name">{{ m.name || 'Match' }}</div>
                    <div class="match-score">{{ m.score ?? m.matchScore ?? m.compability ?? 0 }}%</div>
                  </div>
                  <div class="match-detail ellipsis">
                    {{ m.sharedArtists?.join(', ') || 'No shared artists yet' }}
                  </div>
                </div>
                <q-btn :flat="!m.liked" :unelevated="m.liked" round :icon="m.liked ? 'favorite' : 'favorite_border'"
                  :color="m.liked ? 'pink-6' : 'grey-6'" size="sm" :disable="m.liked" @click="matches.like(m.id)" />
              </div>

              <div v-if="!matches.list?.length" class="empty-state">
                No matches yet — go swipe a bit!
              </div>
            </div>
          </div>

          <!-- Nearby Events -->
          <div class="liquid-glass content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon"><q-icon name="confirmation_number" size="18px" /></div>
                <h3>Nearby Events</h3>
              </div>
              <q-btn flat round dense icon="refresh" size="sm" @click="events.fetchNearby()" />
            </div>

            <div v-if="loadingEvents" class="q-gutter-sm">
              <q-skeleton v-for="i in 4" :key="i" height="64px" />
            </div>

            <div v-else class="event-list">
              <div v-for="e in events.list" :key="e.id" class="event-row">
                <div class="event-date-badge">
                  <div class="month">{{ formatEventMonth(e.date) }}</div>
                  <div class="day">{{ formatEventDay(e.date) }}</div>
                </div>
                <div class="col">
                  <div class="event-title">{{ e.title }}</div>
                  <div class="event-meta"><q-icon name="place" size="13px" /> {{ e.city }}</div>
                </div>
                <q-btn flat round icon="arrow_forward" size="sm" />
              </div>

              <div v-if="!events.list?.length" class="empty-state">
                No events nearby right now.
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import { useMatchesStore } from '@/stores/matches';
import { useEventsStore } from '@/stores/events';
import { api } from '@/api';
import axios from 'axios';

const user = useUserStore();
const matches = useMatchesStore();
const events = useEventsStore();

const loadingMe = ref(true);
const loadingMatches = ref(true);
const loadingEvents = ref(true);
const loadingRecent = ref(false);

// Currently playing
const currentlyPlaying = ref(null);
let npInterval = null;
let npTickInterval = null;

const fetchCurrentlyPlaying = async () => {
  if (document.hidden) return;
  try {
    const data = await api.getCurrentlyPlaying();
    if (data) {
      data._fetchedAt = Date.now();
      data._baseProgress = data.progressMs;
      currentlyPlaying.value = data;
    } else {
      currentlyPlaying.value = null;
    }
  } catch {
    currentlyPlaying.value = null;
  }
};

// Client-side interpolation: advance progressMs every second
const tickProgress = () => {
  const np = currentlyPlaying.value;
  if (!np?.isPlaying || !np.durationMs) return;
  const elapsed = Date.now() - (np._fetchedAt || Date.now());
  np.progressMs = Math.min(np.durationMs, (np._baseProgress ?? np.progressMs) + elapsed);
};

const npProgress = computed(() => {
  if (!currentlyPlaying.value?.durationMs) return 0;
  return Math.min(100, (currentlyPlaying.value.progressMs / currentlyPlaying.value.durationMs) * 100);
});

const interpolatedProgress = computed(() => {
  return currentlyPlaying.value?.progressMs ?? 0;
});

const formatMs = (ms) => {
  if (!ms) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

const displayName = computed(() => {
  return (
    user.me?.displayName ||
    user.me?.name ||
    user.me?.firstName ||
    'Guest'
  );
});

const avatarUrl = computed(() => {
  return (
    user.me?.avatarUrl ||
    user.me?.imageUrl ||
    user.me?.images?.[0]?.url ||
    null
  );
});

const initials = computed(() => {
  const n = displayName.value.trim();
  if (!n) return '?';
  const parts = n.split(' ');
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
});

const lastSync = computed(() => {
  const d = user.me?.updatedAt ? new Date(user.me.updatedAt) : null;
  return d ? d.toLocaleString() : 'Just now';
});

const refreshAll = async () => {
  loadingMe.value = true;
  loadingMatches.value = true;
  loadingEvents.value = true;

  await user.fetchMe();
  await matches.fetchMatches();
  await events.fetchNearby();

  loadingMe.value = false;
  loadingMatches.value = false;
  loadingEvents.value = false;
};

const formatEventMonth = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const formatEventDay = (dateString) =>
  new Date(dateString).getDate();

const recentlyPlayed = computed(() => user.me?.recentlyPlayed || []);

const interestedEvents = computed(() => {
  return events.list.filter(e => events.getRsvp(e.id)?.interested);
});

const goingEvents = computed(() => {
  return events.list.filter(e => events.getRsvp(e.id)?.going);
});

const fetchRecentlyPlayed = async () => {
  loadingRecent.value = true;
  await user.fetchMe();
  loadingRecent.value = false;
};

const formatPlayedAt = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

onMounted(async () => {
  if (!user.me) await user.fetchMe();
  if (!matches.list.length) await matches.fetchMatches();
  if (!events.list.length) await events.fetchNearby();

  loadingMe.value = false;
  loadingMatches.value = false;
  loadingEvents.value = false;

  await fetchCurrentlyPlaying();
  npInterval = setInterval(fetchCurrentlyPlaying, 5000);
  npTickInterval = setInterval(tickProgress, 1000);

  document.addEventListener('visibilitychange', onVisChange);
});

const onVisChange = () => {
  if (!document.hidden) fetchCurrentlyPlaying();
};

onUnmounted(() => {
  if (npInterval) clearInterval(npInterval);
  if (npTickInterval) clearInterval(npTickInterval);
  document.removeEventListener('visibilitychange', onVisChange);
});
</script>

<style scoped lang="scss">
/* ─── Foundations ─────────────────────────────────────── */
.home {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e4e4e7;
  position: relative;
  overflow-x: hidden;
}

/* ─── Background mesh ────────────────────────────────── */
.bg-mesh {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(120px);
  opacity: 0.25;
}

.orb-1 {
  width: 500px;
  height: 500px;
  right: -100px;
  top: -120px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
}

.orb-2 {
  width: 400px;
  height: 400px;
  left: -80px;
  bottom: -100px;
  background: linear-gradient(135deg, #ec4899, #ef4444);
}

.orb-3 {
  width: 300px;
  height: 300px;
  left: 45%;
  top: 40%;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
}

.bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* ─── Container ──────────────────────────────────────── */
.home-container {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 20px 40px;
}

/* ─── Liquid Glass system ────────────────────────────── */
.liquid-glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border-radius: 24px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

.liquid-glass-strong {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(32px) saturate(1.5);
  -webkit-backdrop-filter: blur(32px) saturate(1.5);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.08);
}

.liquid-glass-inset {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* ─── Hero ───────────────────────────────────────────── */
.hero-card {
  padding: 32px;
  margin-top: 4px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr;
  gap: 2rem;
  align-items: start;
}

.hero-greeting {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.02em;
}

.hero-name {
  margin: 4px 0 10px;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.75) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 480px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.cta-primary {
  background: linear-gradient(135deg, #8b5cf6, #a855f7 50%, #ec4899) !important;
  color: #fff !important;
  padding: 10px 22px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.88rem;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
}

.cta-secondary {
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

/* ─── Profile card ───────────────────────────────────── */
.profile-card {
  padding: 20px;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-avatar {
  border: 2px solid rgba(139, 92, 246, 0.25);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.12);
}

.initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  background: rgba(139, 92, 246, 0.15);
}

.initials.small {
  font-size: 0.85rem;
}

.profile-info {
  min-width: 0;
}

.profile-name {
  font-weight: 800;
  font-size: 1.15rem;
  color: #fff;
}

.profile-handle {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.45);
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

.dot {
  opacity: 0.4;
}

.profile-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
  margin: 14px 0;
}

.profile-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sync-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.35);
}

.sync-value {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
}

.refresh-btn {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.profile-link {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 8px 14px;
  margin-top: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  width: fit-content;
}

.profile-link:hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.06);
}

/* ─── Stats strip ────────────────────────────────────── */
.stats-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 24px;
}

.stat-pill {
  padding: 14px 16px;
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

/* ─── Now Playing ────────────────────────────────────── */
.np-card {
  padding: 16px 20px;
  margin-top: 16px;
  border-color: rgba(30, 215, 96, 0.15) !important;
  background: rgba(30, 215, 96, 0.04) !important;
}

.np-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.np-cover {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.np-info {
  flex: 1;
  min-width: 0;
}

.np-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #1ed760;
  margin-bottom: 4px;
}

.np-dot {
  width: 6px;
  height: 6px;
  background: #1ed760;
  border-radius: 50%;
}

.np-track {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.np-artist {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.np-progress {
  margin-top: 8px;
}

.np-bar {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.np-fill {
  height: 100%;
  background: #1ed760;
  border-radius: 2px;
  transition: width 1s linear;
}

.np-times {
  display: flex;
  justify-content: space-between;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 3px;
}

/* ─── Main grid ──────────────────────────────────────── */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}

.content-card {
  padding: 24px;
  margin-bottom: 16px;
}

/* ─── Card header ────────────────────────────────────── */
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.head-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.12);
  color: rgba(167, 139, 250, 0.9);
}

.card-head h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: -0.01em;
}

/* ─── Track list ─────────────────────────────────────── */
.track-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.track-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.track-cover {
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.track-name {
  font-weight: 600;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.9);
}

.track-artist {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.4);
}

.track-time {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
  white-space: nowrap;
  flex-shrink: 0;
}

/* ─── Artist grid ────────────────────────────────────── */
.artist-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.artist-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  padding: 8px;
  border-radius: 14px;
}

.artist-cell:hover {
  background: rgba(255, 255, 255, 0.04);
}

.artist-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}

.artist-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.artist-img-skel {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 14px;
}

.artist-cell-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* ─── Genre chips ────────────────────────────────────── */
.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genre-chip {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.18);
}

/* ─── Event list ─────────────────────────────────────── */
.event-section {
  margin-bottom: 8px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.event-date-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25));
  border: 1px solid rgba(6, 182, 212, 0.15);
  flex-shrink: 0;
}

.month {
  font-size: 0.6rem;
  font-weight: 800;
  opacity: 0.8;
  letter-spacing: 0.04em;
}

.day {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1;
  color: #fff;
}

.event-title {
  font-weight: 700;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.9);
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

/* ─── Match list ─────────────────────────────────────── */
.match-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.match-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.match-avatar {
  flex-shrink: 0;
}

.match-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: #fff;
}

.match-score {
  font-size: 0.72rem;
  font-weight: 800;
  color: #fff;
  padding: 3px 8px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ec4899, #a855f7);
}

.match-detail {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

/* ─── Empty state ────────────────────────────────────── */
.empty-state {
  padding: 20px;
  text-align: center;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 14px;
  border: 1px dashed rgba(255, 255, 255, 0.06);
}

/* ─── Responsive ─────────────────────────────────────── */
@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .stats-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .home-container {
    padding: 12px 12px 32px;
  }

  .hero-card {
    padding: 20px;
  }

  .stats-strip {
    grid-template-columns: 1fr 1fr;
  }

  .content-card {
    padding: 18px;
  }
}
</style>
