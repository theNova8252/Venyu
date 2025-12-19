<template>
  <q-page class="home">
    <!-- Background -->
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="noise"></div>
    </div>

    <div class="container q-pa-md q-pa-lg-lg">

      <!-- HERO -->
      <section class="hero glass q-pa-lg q-pa-xl-lg">
        <div class="hero-grid">

          <!-- Left: Greeting + CTA -->
          <div class="hero-left">
            <div class="hero-badge">
              <q-icon name="graphic_eq" size="18px" />
              <span>Venyu</span>
            </div>

            <template v-if="loadingMe">
              <q-skeleton type="text" width="70%" height="48px" />
              <q-skeleton type="text" width="45%" class="q-mt-sm" />
            </template>

            <template v-else>
              <h1 class="hero-title">
                Welcome back,
                <span class="hero-name">{{ displayName }}</span>
              </h1>
              <p class="hero-subtitle">
                Your music taste is your superpower. Let’s find your people.
              </p>
            </template>

            <div class="hero-actions q-mt-md q-mt-lg-lg">
              <q-btn to="/swipe" unelevated no-caps class="cta-primary" icon="swipe" label="Start Swiping" />
              <q-btn to="/events" flat no-caps class="cta-secondary" icon="event" label="Explore Events" />
            </div>

            <!-- Quick stats row -->
            <div class="hero-stats q-mt-lg">
              <div class="stat-pill">
                <div class="stat-value">{{ user.me?.topArtists?.length || 0 }}</div>
                <div class="stat-label">Top Artists</div>
              </div>
              <div class="stat-pill">
                <div class="stat-value">{{ matches.list?.length || 0 }}</div>
                <div class="stat-label">Matches</div>
              </div>
              <div class="stat-pill">
                <div class="stat-value">{{ events.list?.length || 0 }}</div>
                <div class="stat-label">Events</div>
              </div>
              <div class="stat-pill">
                <div class="stat-value">{{ user.me?.genres?.length || 0 }}</div>
                <div class="stat-label">Genres</div>
              </div>
            </div>
          </div>

          <!-- Right: Spotify profile -->
          <div class="hero-right">
            <div class="profile glass-strong q-pa-md q-pa-lg-lg">
              <div class="row items-center no-wrap q-gutter-md">

                <template v-if="loadingMe">
                  <q-skeleton type="QAvatar" size="84px" />
                  <div class="col">
                    <q-skeleton type="text" width="60%" />
                    <q-skeleton type="text" width="40%" />
                  </div>
                </template>

                <template v-else>
                  <q-avatar size="84px" class="profile-avatar">
                    <img v-if="avatarUrl" :src="avatarUrl" />
                    <div v-else class="initials">{{ initials }}</div>
                  </q-avatar>

                  <div class="col">
                    <div class="profile-name">{{ displayName }}</div>
                    <div class="profile-handle" v-if="user.me?.spotifyId">
                      @{{ user.me.spotifyId }}
                    </div>
                    <div class="profile-meta q-mt-xs">
                      <q-icon name="public" size="14px" />
                      <span>{{ user.me?.country || 'World' }}</span>
                      <span class="dot">•</span>
                      <span>{{ user.me?.product || 'Spotify User' }}</span>
                    </div>
                  </div>
                </template>
              </div>

              <q-separator dark class="q-my-md" />

              <div class="row items-center justify-between">
                <div class="mini">
                  <div class="mini-label">Last sync</div>
                  <div class="mini-value">
                    {{ lastSync }}
                  </div>
                </div>
                <q-btn flat dense no-caps icon="sync" label="Refresh" @click="refreshAll" class="refresh-btn" />
              </div>
            </div>

            <!-- Small secondary CTA -->
            <router-link to="/profile" class="profile-link q-mt-md">
              View full profile
              <q-icon name="arrow_forward" size="18px" />
            </router-link>
          </div>

        </div>
      </section>

      <!-- MAIN GRID -->
      <section class="main-grid q-mt-xl">
        <!-- Left -->
        <div class="col-left">
          <!-- Recently Played -->
          <div class="glass q-pa-lg content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon grad-green">
                  <q-icon name="history" size="20px" />
                </div>
                <h3>Recently Played</h3>
              </div>
              <q-btn flat round dense icon="refresh" size="sm" @click="fetchRecentlyPlayed" />
            </div>

            <div v-if="loadingRecent" class="q-gutter-sm">
              <q-skeleton v-for="i in 5" :key="i" height="56px" />
            </div>

            <div v-else class="list">
              <div v-for="(item, idx) in recentlyPlayed" :key="idx" class="list-row track-row">
                <q-avatar size="48px" class="track-cover">
                  <img v-if="item.track.album.image" :src="item.track.album.image" />
                  <div v-else class="initials small">
                    {{ (item.track.name || '?')[0] }}
                  </div>
                </q-avatar>

                <div class="col">
                  <div class="track-name">{{ item.track.name }}</div>
                  <div class="muted">
                    {{item.track.artists.map(a => a.name).join(', ')}}
                  </div>
                </div>
                <div class="track-time muted">
                  {{ formatPlayedAt(item.playedAt) }}
                </div>

                <q-btn flat round icon="play_arrow" size="sm" @click="playTrack(item.track.uri)" />
              </div>

              <div v-if="!recentlyPlayed.length" class="empty">
                No recent plays found. Start listening on Spotify!
              </div>
            </div>
          </div>
          <!-- Top Artists -->
          <div class="glass q-pa-lg content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon grad-purple">
                  <q-icon name="stars" size="20px" />
                </div>
                <h3>Your Top Artists</h3>
              </div>
            </div>

            <div v-if="loadingMe" class="q-gutter-sm">
              <q-skeleton v-for="i in 5" :key="i" height="48px" />
            </div>

            <div v-else class="list">
              <div v-for="(artist, idx) in (user.me.topArtists || [])" :key="artist.id || artist.uri || idx"
                class="list-row">
                <div class="rank">{{ idx + 1 }}</div>

                <q-avatar size="32px" class="artist-avatar">
                  <img v-if="artist.image" :src="artist.image" />
                  <div v-else class="initials small">
                    {{ (artist.name || '?')[0] }}
                  </div>
                </q-avatar>

                <div class="list-text">{{ artist.name }}</div>

                <div class="artist-followers">
                  <q-icon name="groups" size="14px" class="muted" />
                  <span class="muted">{{ formatNumber(artist.followers?.total) }} followers</span>
                </div>



                <q-icon name="verified" size="16px" class="verified" />
              </div>

              <div v-if="!user.me?.topArtists?.length" class="empty">
                No top artists yet — sync Spotify to see your vibe.
              </div>
            </div>
          </div>


          <!-- Genres -->
          <div v-if="user.me?.genres?.length" class="glass q-pa-lg content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon grad-pink">
                  <q-icon name="library_music" size="20px" />
                </div>
                <h3>Favorite Genres</h3>
              </div>
            </div>

            <div class="chip-wrap">
              <q-chip v-for="g in user.me.genres" :key="g" color="pink-6" text-color="white" outline class="genre-chip">
                {{ g }}
              </q-chip>
            </div>
          </div>
        </div>

        <!-- Right -->
        <div class="col-right">
          <!-- Matches -->
          <div class="glass q-pa-lg content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon grad-orange">
                  <q-icon name="event_available" size="20px" />
                </div>
                <h3>My Events</h3>
              </div>
            </div>
            <div v-if="loadingEvents" class="q-gutter-sm">
              <q-skeleton v-for="i in 3" :key="i" height="64px" />
            </div>
            <div v-else>
              <!-- Interested -->
              <div v-if="interestedEvents.length" class="event-section">
                <div class="section-label">
                  <q-icon name="star" size="16px" color="pink-6" />
                  <span>Interested ({{ interestedEvents.length }})</span>
                </div>
                <div class="list">
                  <div v-for="e in interestedEvents" :key="e.id" class="event-row small">
                    <div class="event-date">
                      <div class="month">{{ formatEventMonth(e.date) }}</div>
                      <div class="day">{{ formatEventDay(e.date) }}</div>
                    </div>
                    <div class="col">
                      <div class="event-title">{{ e.title }}</div>
                      <div class="muted">
                        <q-icon name="place" size="14px" />
                        {{ e.city }}
                      </div>
                    </div>
                    <q-btn flat round icon="close" size="sm" @click="events.toggleInterested(e.id)" />
                  </div>
                </div>
              </div>
              <div v-if="goingEvents.length" class="event-section q-mt-md">
                <div class="section-label">
                  <q-icon name="check_circle" size="16px" color="purple-6" />
                  <span>Going ({{ goingEvents.length }})</span>
                </div>
                <div class="list">
                  <div v-for="e in goingEvents" :key="e.id" class="event-row small">
                    <div class="event-date">
                      <div class="month">{{ formatEventMonth(e.date) }}</div>
                      <div class="day">{{ formatEventDay(e.date) }}</div>
                    </div>
                    <div class="col">
                      <div class="event-title">{{ e.title }}</div>
                      <div class="muted">
                        <q-icon name="place" size="14px" />
                        {{ e.city }}
                      </div>
                    </div>
                    <q-btn flat round icon="close" size="sm" @click="events.toggleGoing(e.id)" />
                  </div>
                </div>
              </div>

              <div v-if="!interestedEvents.length && !goingEvents.length" class="empty">
                Mark events as interested or going on the map!
              </div>
            </div>
          </div>
          <div class="glass q-pa-lg content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon grad-pink">
                  <q-icon name="people" size="20px" />
                </div>
                <h3>My Matches</h3>
              </div>
            </div>

            <div v-if="loadingMatches" class="q-gutter-sm">
              <q-skeleton v-for="i in 3" :key="i" height="64px" />
            </div>

            <div v-else class="list">
              <div v-for="m in matches.list" :key="m.id" class="match-row">
                <q-avatar size="48px">
                  <img v-if="m.avatarUrl" :src="m.avatarUrl" />
                  <div v-else class="initials small">
                    {{ (m.name || 'M')[0] }}
                  </div>
                </q-avatar>

                <div class="col">
                  <div class="match-top">
                    <div class="match-name">{{ m.name || 'Match' }}</div>
                    <div class="match-score">{{ m.score ?? m.matchScore ?? m.compability ?? 0 }}% match</div>
                  </div>
                  <div class="muted ellipsis">
                    {{ m.sharedArtists?.join(', ') || 'No shared artists yet' }}
                  </div>
                </div>

                <q-btn :flat="!m.liked" :unelevated="m.liked" round :icon="m.liked ? 'favorite' : 'favorite_border'"
                  :color="m.liked ? 'pink-6' : 'grey-6'" size="sm" :disable="m.liked" @click="matches.like(m.id)" />
              </div>

              <div v-if="!matches.list?.length" class="empty">
                No matches yet — go swipe a bit!
              </div>
            </div>
          </div>

          <!-- Events -->
          <div class="glass q-pa-lg content-card">
            <div class="card-head">
              <div class="head-left">
                <div class="head-icon grad-blue">
                  <q-icon name="confirmation_number" size="20px" />
                </div>
                <h3>Nearby Events</h3>
              </div>

              <q-btn flat round dense icon="refresh" size="sm" @click="events.fetchNearby()" />
            </div>

            <div v-if="loadingEvents" class="q-gutter-sm">
              <q-skeleton v-for="i in 4" :key="i" height="64px" />
            </div>

            <div v-else class="list">
              <div v-for="e in events.list" :key="e.id" class="event-row">
                <div class="event-date">
                  <div class="month">{{ formatEventMonth(e.date) }}</div>
                  <div class="day">{{ formatEventDay(e.date) }}</div>
                </div>

                <div class="col">
                  <div class="event-title">{{ e.title }}</div>
                  <div class="muted">
                    <q-icon name="place" size="14px" />
                    {{ e.city }}
                  </div>
                </div>

                <q-btn flat round icon="arrow_forward" size="sm" />
              </div>

              <div v-if="!events.list?.length" class="empty">
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
import { computed, onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import { useMatchesStore } from '@/stores/matches';
import { useEventsStore } from '@/stores/events';
import axios from 'axios';

const user = useUserStore();
const matches = useMatchesStore();
const events = useEventsStore();

const loadingMe = ref(true);
const loadingMatches = ref(true);
const loadingEvents = ref(true);
const loadingRecent = ref(false);

const displayName = computed(() => {
  return (
    user.me?.displayName ||
    user.me?.name ||
    user.me?.firstName ||
    'Guest'
  );
});

const avatarUrl = computed(() => {
  // support multiple possible shapes
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
const formatNumber = (n) => {
  if (!n && n !== 0) return "—";
  return Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
};
const recentlyPlayed = computed(() => user.me?.recentlyPlayed || []);

const interestedEvents = computed(() => {
  return events.list.filter(e => events.getRsvp(e.id)?.interested);
});

const goingEvents = computed(() => {
  return events.list.filter(e => events.getRsvp(e.id)?.going);
});

const fetchRecentlyPlayed = async () => {
  loadingRecent.value = true;
  await user.fetchMe(); // Refresh user data which includes recently played
  loadingRecent.value = false;
};

const playTrack = async (trackUri) => {
  try {
    await axios.post('/api/spotify/player/play', { trackUri });
  } catch (error) {
    console.error('Error playing track:', error);
  }
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
});
</script>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  background: #07070b;
  color: #fff;
  position: relative;
  overflow-x: hidden;
}

/* Background orbs */
.bg-orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(100px);
  opacity: .35;
  animation: float 18s ease-in-out infinite;
}

.orb-1 {
  width: 520px;
  height: 520px;
  right: -140px;
  top: -140px;
  background: linear-gradient(135deg, #7c5cff, #a855f7);
}

.orb-2 {
  width: 420px;
  height: 420px;
  left: -120px;
  bottom: -120px;
  background: linear-gradient(135deg, #ec4899, #ef4444);
  animation-delay: -6s;
}

.orb-3 {
  width: 360px;
  height: 360px;
  left: 40%;
  top: 35%;
  background: linear-gradient(135deg, #22d3ee, #3b82f6);
  animation-delay: -12s;
}

@keyframes float {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(40px, -30px) scale(1.08);
  }
}

.noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E");
  mix-blend-mode: soft-light;
}

/* Layout container */
.container {
  position: relative;
  z-index: 1;
  max-width: 1300px;
  margin: 0 auto;
}

/* Glass */
.glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(18px);
  border-radius: 22px;
}

.glass-strong {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(22px);
  border-radius: 18px;
}

/* Hero */
.hero {
  margin-top: 6px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.3fr .9fr;
  gap: 2rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .35rem .7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  font-weight: 700;
  letter-spacing: .4px;
  color: rgba(255, 255, 255, 0.85);
}

.hero-title {
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 900;
  margin: .8rem 0 .4rem;
  line-height: 1.1;
}

.hero-name {
  background: linear-gradient(135deg, #fff, #c7d2fe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.65);
  font-size: 1.05rem;
  max-width: 560px;
}

.hero-actions {
  display: flex;
  gap: .7rem;
  flex-wrap: wrap;
}

.cta-primary {
  background: linear-gradient(135deg, #ec4899, #a855f7);
  color: white;
  padding: .9rem 1.2rem;
  border-radius: 14px;
  font-weight: 800;
}

.cta-secondary {
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
}

/* Hero stats */
.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .8rem;
}

.stat-pill {
  padding: .9rem 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 900;
}

.stat-label {
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: rgba(255, 255, 255, 0.55);
}

/* Profile right */
.profile-avatar {
  border: 3px solid rgba(255, 255, 255, 0.18);
}

.initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 1.2rem;
  background: linear-gradient(135deg, #334155, #0f172a);
}

.initials.small {
  font-size: .95rem;
}

.profile-name {
  font-weight: 900;
  font-size: 1.3rem;
}

.profile-handle {
  font-size: .9rem;
  color: rgba(255, 255, 255, 0.6);
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .85rem;
  color: rgba(255, 255, 255, 0.6);
}

.dot {
  margin: 0 .25rem;
}

.profile-link {
  display: inline-flex;
  gap: .35rem;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 700;
  padding: .6rem .8rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: fit-content;
}

.profile-link:hover {
  background: rgba(255, 255, 255, 0.07);
}

/* Main grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
}

.content-card {
  margin-bottom: 1.2rem;
}

/* Card header */
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.head-left {
  display: flex;
  align-items: center;
  gap: .8rem;
}

.head-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grad-purple {
  background: linear-gradient(135deg, #7c5cff, #a855f7);
}
.grad-green {
  background: linear-gradient(135deg, #10b981, #059669);
}
.grad-orange {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.grad-pink {
  background: linear-gradient(135deg, #ec4899, #ef4444);
}

.grad-blue {
  background: linear-gradient(135deg, #22d3ee, #3b82f6);
}

.card-head h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
}
.track-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.track-row:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateX(4px);
}

.track-cover {
  border-radius: 8px;
  overflow: hidden;
}

.track-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.track-time {
  font-size: 0.8rem;
  white-space: nowrap;
}

/* Lists */
.list {
  display: flex;
  flex-direction: column;
  gap: .6rem;
}

.list-row {
  display: flex;
  align-items: center;
  gap: .8rem;
  padding: .8rem 1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.rank {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  background: rgba(255, 255, 255, 0.08);
}

.list-text {
  font-weight: 700;
}

.verified {
  color: #c084fc;
}
.event-section {
  margin-bottom: 1rem;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.event-row.small {
  padding: 0.6rem 0.8rem;
}

.event-row.small .event-date {
  width: 48px;
  height: 48px;
}

.event-row.small .event-title {
  font-size: 0.9rem;
}
.match-row,
.event-row {
  display: flex;
  align-items: center;
  gap: .9rem;
  padding: .8rem 1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.match-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.match-name {
  font-weight: 800;
}

.match-score {
  font-size: .8rem;
  font-weight: 900;
  color: #fff;
  padding: .2rem .5rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #ec4899, #a855f7);
}

.muted {
  color: rgba(255, 255, 255, 0.6);
  font-size: .9rem;
  display: flex;
  align-items: center;
  gap: .3rem;
}

.event-date {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #22d3ee, #3b82f6);
  flex-shrink: 0;
}

.month {
  font-size: .7rem;
  font-weight: 900;
  opacity: .9;
}

.day {
  font-size: 1.4rem;
  font-weight: 900;
  line-height: 1;
}

.chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}

.genre-chip {
  border-radius: 10px;
  font-weight: 700;
}

.empty {
  padding: 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
}

/* Responsive */
@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .hero-stats {
    grid-template-columns: 1fr 1fr;
  }
}
.artist-followers {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: .35rem;
  font-size: .85rem;
  color: rgba(255, 255, 255, 0.65);
}
</style>
