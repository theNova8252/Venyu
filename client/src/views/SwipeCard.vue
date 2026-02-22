<template>
  <q-page class="swipe-page">
    <!-- Subtle background -->
    <div class="bg-mesh"></div>

    <div class="swipe-shell">
      <!-- Topbar -->
      <header class="topbar">
        <span class="topbar__title">Discover</span>
        <span class="topbar__counter" v-if="cards.length">
          {{ currentCardIndex + 1 }} / {{ cards.length }}
        </span>
      </header>

      <!-- Empty state -->
      <transition name="fade-up">
        <div v-if="currentCardIndex >= cards.length" class="empty-state">
          <div class="empty-state__ring">
            <q-icon name="check_circle_outline" size="56px" />
          </div>
          <h2 class="empty-state__title">No more profiles</h2>
          <p class="empty-state__sub">Check back later for new people</p>
          <button class="pill-btn" @click="$router.push({ name: 'Home' })">
            Back to Home
          </button>
        </div>
      </transition>

      <!-- Card stack -->
      <div v-if="currentCardIndex < cards.length" class="stack-wrap">
        <div class="stack">
          <div v-for="(card, index) in visibleCards" :key="card.id" class="card" :class="{
            'card--front': index === 0,
            'card--mid': index === 1,
            'card--back': index === 2,
          }">
            <!-- Image area -->
            <div class="card__hero">
              <img :src="card.avatar" :alt="card.name" class="card__img" />
              <div class="card__scrim"></div>

              <!-- Match score pill -->
              <div class="score-pill">
                <q-icon name="auto_awesome" size="14px" />
                {{ card.matchScore }}%
              </div>

              <!-- Name overlay on image -->
              <div class="card__identity">
                <h2 class="card__name">
                  {{ card.name }}<span v-if="card.age != null" class="card__age">, {{ card.age }}</span>
                </h2>
                <div class="card__loc">
                  <q-icon name="near_me" size="13px" />
                  {{ card.distance }}
                </div>
              </div>
            </div>

            <!-- Info section -->
            <div class="card__body">
              <!-- Bio -->
              <p class="card__bio" v-if="card.bio">{{ card.bio }}</p>

              <!-- Top Artists -->
              <div class="section" v-if="card.topArtists?.length">
                <div class="section__label">
                  <q-icon name="person" size="14px" />
                  Top Artists
                </div>
                <div class="chip-row">
                  <span v-for="(artist, idx) in card.topArtists.slice(0, 4)" :key="'a-' + idx"
                    class="chip chip--artist">{{ artist }}</span>
                </div>
              </div>

              <!-- Top Tracks -->
              <div class="section" v-if="card.topTracks?.length">
                <div class="section__label">
                  <q-icon name="headphones" size="14px" />
                  Top Tracks
                </div>
                <div class="track-list">
                  <div v-for="(track, idx) in card.topTracks.slice(0, 3)" :key="'t-' + idx" class="track-row">
                    <img v-if="track.albumImage" :src="track.albumImage" :alt="track.name" class="track-row__cover" />
                    <div v-else class="track-row__cover track-row__cover--empty">
                      <q-icon name="music_note" size="14px" />
                    </div>
                    <div class="track-row__info">
                      <span class="track-row__name">{{ track.name }}</span>
                      <span class="track-row__artist" v-if="track.artist">{{ track.artist }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Genres -->
              <div class="section" v-if="card.genres?.length">
                <div class="section__label">
                  <q-icon name="tag" size="14px" />
                  Genres
                </div>
                <div class="chip-row">
                  <span v-for="(genre, idx) in card.genres.slice(0, 5)" :key="'g-' + idx" class="chip chip--genre">{{
                    genre }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="actions">
          <button class="action-btn action-btn--pass" :disabled="isAnimating" @click="swipeLeft">
            <q-icon name="close" size="28px" />
          </button>

          <button class="action-btn action-btn--like" :disabled="isAnimating" @click="swipeRight">
            <q-icon name="favorite" size="28px" />
          </button>
        </div>
      </div>
    </div>

    <!-- Match celebration modal -->
    <q-dialog v-model="showMatchModal" persistent>
      <div class="match-modal">
        <!-- Animated particles -->
        <div class="match-particles">
          <span v-for="i in 12" :key="i" class="particle" :style="particleStyle(i)"></span>
        </div>

        <div class="match-modal__content">
          <!-- Avatars -->
          <div class="match-avatars">
            <div class="match-av match-av--me">
              <img :src="userStore.me?.avatarUrl || 'https://i.pravatar.cc/150?img=1'" alt="You" />
            </div>
            <div class="match-heart-ring">
              <q-icon name="favorite" size="24px" />
            </div>
            <div class="match-av match-av--them">
              <img :src="lastMatchedUser?.avatar" :alt="lastMatchedUser?.name" />
            </div>
          </div>

          <h2 class="match-title">It's a Match!</h2>
          <p class="match-sub">
            You and <strong>{{ lastMatchedUser?.name }}</strong> both liked each other
          </p>

          <div class="match-actions">
            <button class="match-btn match-btn--ghost" @click="closeMatchModal">
              Keep Swiping
            </button>
            <button class="match-btn match-btn--primary" @click="sendMessage">
              <q-icon name="chat_bubble" size="18px" />
              Send Message
            </button>
          </div>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

import { useQuasar } from "quasar";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";
import { useMatchesStore } from "@/stores/matches";
import { useChatsStore } from "@/stores/chats";

const $q = useQuasar();
const userStore = useUserStore();
const router = useRouter();
const matchesStore = useMatchesStore();

const currentCardIndex = ref(0);
const isAnimating = ref(false);
const showMatchModal = ref(false);
const lastMatchedUser = ref(null);
const currentRoomId = ref(null); // Chat room for the match

const chatsStore = useChatsStore();

const toArray = (value) => {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const toArtistNames = (value) =>
  toArray(value)
    .map((artist) => (typeof artist === "string" ? artist : artist?.name))
    .filter(Boolean);

const toGenres = (value) =>
  toArray(value)
    .map((genre) => String(genre).trim())
    .filter(Boolean);

const toTrackItems = (value) =>
  toArray(value)
    .map((t) => {
      if (typeof t === "string") return { name: t, artist: "", albumImage: null };
      return {
        name: t?.name || "",
        artist: t?.artist || t?.artists?.[0]?.name || "",
        albumImage: t?.albumImage || t?.album?.image || t?.album?.images?.[0]?.url || null,
      };
    })
    .filter((t) => t.name);

// Generate random particle styles for match celebration
const particleStyle = (i) => {
  const angle = (i / 12) * 360;
  const delay = (i * 0.08).toFixed(2);
  const size = 4 + Math.random() * 6;
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`,
    '--size': `${size}px`,
  };
};

// Cards from matches store
const cards = computed(() =>
  matchesStore.list.map((m, index) => ({
    id: m.id ?? m.userId ?? `match-${index}`,
    userId: m.userId ?? m.id ?? m.user?.id, // needed for Like endpoint
    name: m.displayName ?? m.name ?? "Unknown",
    age: Number.isFinite(Number(m.age ?? m.user?.age))
      ? Number(m.age ?? m.user?.age)
      : null,
    avatar:
      m.avatar ??
      m.avatar_url ??
      m.avatarUrl ??
      `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
    bio: m.bio ?? "Music lover 🎵",
    distance:
      m.distance ??
      (m.distanceKm != null ? `${m.distanceKm} km away` : "Nearby"),
    topArtists: toArtistNames(
      m.topArtists ?? m.top_artists ?? m.spotifyTopArtists ?? m.spotify_top_artists
    ),
    topTracks: toTrackItems(
      m.topTracks ?? m.top_tracks ?? m.spotifyTopTracks ?? m.spotify_top_tracks
    ),
    genres: toGenres(m.genres ?? m.spotifyGenres ?? m.spotify_genres),
    matchScore:
      Number(m.matchScore ?? m.score ?? m.compatibility) > 0
        ? Number(m.matchScore ?? m.score ?? m.compatibility)
        : 80,
  }))
);

const visibleCards = computed(() =>
  cards.value.slice(currentCardIndex.value, currentCardIndex.value + 3)
);

const swipeLeft = () => {
  if (isAnimating.value) return;
  isAnimating.value = true;

  $q.notify({
    message: "Passed",
    color: "red-5",
    icon: "close",
    position: "top",
    timeout: 800,
  });

  setTimeout(() => {
    currentCardIndex.value++;
    isAnimating.value = false;
  }, 250);
};

const swipeRight = async () => {
  if (isAnimating.value) return;
  isAnimating.value = true;

  const currentCard = cards.value[currentCardIndex.value];
  if (!currentCard || !currentCard.userId) {
    currentCardIndex.value++;
    isAnimating.value = false;
    return;
  }

  try {
    // Send like to backend
    const result = await matchesStore.like(currentCard.userId);

    // Expected response format from backend:
    // { isMatch: boolean, roomId?: string }
    const isMatch = !!result?.isMatch;

    if (isMatch && result.roomId) {
      lastMatchedUser.value = currentCard;
      currentRoomId.value = result.roomId;

      // Refresh chat list after match
      await chatsStore.fetchChats();

      showMatchModal.value = true;
    } else {
      $q.notify({
        message: "Liked!",
        color: "green-5",
        icon: "favorite",
        position: "top",
        timeout: 800,
      });
    }
  } catch (err) {
    console.error("Like failed", err);
    $q.notify({
      message: "Like failed",
      color: "red-5",
      icon: "error",
      position: "top",
      timeout: 1500,
    });
  } finally {
    currentCardIndex.value++;
    isAnimating.value = false;
  }
};

const closeMatchModal = () => {
  showMatchModal.value = false;
  lastMatchedUser.value = null;
  currentRoomId.value = null;
};

const sendMessage = () => {
  showMatchModal.value = false;
  if (!currentRoomId.value) return;

  router.push({
    name: "ChatView",
    params: { roomId: currentRoomId.value },
  });
};

onMounted(async () => {
  if (!userStore.me) {
    await userStore.fetchMe();
  }
  // Force refresh to avoid cached data
  await matchesStore.fetchMatches(true);
  matchesStore.connectNowPlayingWS();
});
</script>

<style scoped>
/* ─── Page ────────────────────────────────────────────── */
.swipe-page {
  min-height: 100vh;
  background: #09090b;
  position: relative;
  overflow: hidden;
  color: #e4e4e7;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
}

.bg-mesh {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 20% 0%, rgba(139, 92, 246, .08) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 80% 100%, rgba(236, 72, 153, .06) 0%, transparent 60%);
}

/* ─── Shell ───────────────────────────────────────────── */
.swipe-shell {
  position: relative;
  z-index: 1;
  max-width: 400px;
  margin: 0 auto;
  padding: 0 1rem;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ─── Topbar ──────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0 0.75rem;
  flex-shrink: 0;
}

.topbar__title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #f4f4f5;
}

.topbar__counter {
  font-size: 0.78rem;
  font-weight: 600;
  color: #52525b;
  background: rgba(255, 255, 255, .05);
  padding: 4px 10px;
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
}

/* ─── Empty state ─────────────────────────────────────── */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  padding: 2rem;
}

.empty-state__ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: rgba(34, 197, 94, .08);
  border: 2px solid rgba(34, 197, 94, .15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  margin-bottom: 0.5rem;
}

.empty-state__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #d4d4d8;
  margin: 0;
}

.empty-state__sub {
  font-size: 0.88rem;
  color: #71717a;
  margin: 0;
}

.pill-btn {
  margin-top: 0.5rem;
  padding: 10px 24px;
  border-radius: 12px;
  border: none;
  background: rgba(139, 92, 246, .15);
  color: #a78bfa;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all .2s ease;
}

.pill-btn:hover {
  background: rgba(139, 92, 246, .25);
}

/* ─── Stack ───────────────────────────────────────────── */
.stack-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 1rem;
}

.stack {
  flex: 1;
  position: relative;
  min-height: 580px;
}

/* ─── Card ────────────────────────────────────────────── */
.card {
  position: absolute;
  inset: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 380px;
  background: #18181b;
  border-radius: 22px;
  overflow: hidden;
  pointer-events: none;
  transition: transform .35s cubic-bezier(.4, 0, .2, 1),
    opacity .35s ease;
  will-change: transform, opacity;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, .04) inset,
    0 20px 50px -12px rgba(0, 0, 0, .7);
  border: 1px solid rgba(255, 255, 255, .06);
  display: flex;
  flex-direction: column;
}

.card--front {
  z-index: 3;
  transform: scale(1) translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.card--mid {
  z-index: 2;
  transform: scale(.965) translateY(12px);
  opacity: .45;
}

.card--back {
  z-index: 1;
  transform: scale(.93) translateY(24px);
  opacity: .2;
}

/* ─── Card hero (image area) ─────────────────────────── */
.card__hero {
  position: relative;
  height: 300px;
  flex-shrink: 0;
  overflow: hidden;
}

.card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card__scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top,
      #18181b 0%,
      rgba(24, 24, 27, .85) 30%,
      rgba(24, 24, 27, .2) 60%,
      transparent 100%);
}

/* Score pill */
.score-pill {
  position: absolute;
  top: 14px;
  left: 14px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 10px;
  background: rgba(0, 0, 0, .45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, .08);
  color: #e9d5ff;
  font-size: 0.78rem;
  font-weight: 700;
}

/* Identity on image */
.card__identity {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 1.25rem 1rem;
  z-index: 2;
}

.card__name {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
  margin: 0;
  line-height: 1.15;
  text-shadow: 0 2px 12px rgba(0, 0, 0, .5);
}

.card__age {
  font-weight: 400;
  color: rgba(255, 255, 255, .6);
}

.card__loc {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, .45);
}

/* ─── Card body ──────────────────────────────────────── */
.card__body {
  padding: 1rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.card__body::-webkit-scrollbar {
  width: 0;
}

.card__bio {
  font-size: 0.88rem;
  line-height: 1.45;
  color: #a1a1aa;
  margin: 0;
}

/* ─── Sections (artists / tracks / genres) ───────────── */
.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #52525b;
}

/* Chips */
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.chip--artist {
  background: rgba(139, 92, 246, .1);
  color: #c4b5fd;
  border: 1px solid rgba(139, 92, 246, .15);
}

.chip--genre {
  background: rgba(236, 72, 153, .08);
  color: #f9a8d4;
  border: 1px solid rgba(236, 72, 153, .12);
}

/* Track rows */
.track-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .04);
}

.track-row__cover {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.track-row__cover--empty {
  background: rgba(255, 255, 255, .06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #52525b;
}

.track-row__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.track-row__name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #e4e4e7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-row__artist {
  font-size: 0.72rem;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Action buttons ─────────────────────────────────── */
.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 1.25rem 0 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
}

.action-btn:active:not(:disabled) {
  transform: scale(.92);
}

.action-btn:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.action-btn--pass {
  background: rgba(239, 68, 68, .1);
  color: #f87171;
  border: 2px solid rgba(239, 68, 68, .2);
}

.action-btn--pass:hover:not(:disabled) {
  background: rgba(239, 68, 68, .18);
  border-color: rgba(239, 68, 68, .35);
  transform: scale(1.08);
  box-shadow: 0 0 24px rgba(239, 68, 68, .15);
}

.action-btn--like {
  background: rgba(34, 197, 94, .1);
  color: #4ade80;
  border: 2px solid rgba(34, 197, 94, .2);
}

.action-btn--like:hover:not(:disabled) {
  background: rgba(34, 197, 94, .18);
  border-color: rgba(34, 197, 94, .35);
  transform: scale(1.08);
  box-shadow: 0 0 24px rgba(34, 197, 94, .15);
}

/* ─── Match modal ────────────────────────────────────── */
.match-modal {
  background: #18181b;
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 28px;
  padding: 2.5rem 2rem 2rem;
  max-width: 380px;
  width: 100%;
  position: relative;
  overflow: hidden;
  color: #e4e4e7;
}

/* Particles */
.match-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  opacity: 0;
  animation: burst .9s var(--delay) ease-out forwards;
}

.particle:nth-child(odd) {
  background: #c084fc;
}

.particle:nth-child(even) {
  background: #f472b6;
}

@keyframes burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0);
    opacity: 1;
  }

  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateY(140px);
    opacity: 0;
  }
}

.match-modal__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Avatars */
.match-avatars {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 1.25rem;
}

.match-av {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #18181b;
  position: relative;
}

.match-av img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.match-av--them {
  margin-left: -16px;
}

.match-heart-ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #f43f5e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  z-index: 2;
  margin-left: -12px;
  margin-right: -12px;
  border: 3px solid #18181b;
  box-shadow: 0 4px 16px rgba(236, 72, 153, .4);
  animation: heart-pop .5s .3s ease-out both;
}

@keyframes heart-pop {
  0% {
    transform: scale(0);
  }

  60% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.match-title {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 0.35rem;
  background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.match-sub {
  font-size: 0.88rem;
  color: #71717a;
  margin: 0 0 1.5rem;
  line-height: 1.4;
}

.match-sub strong {
  color: #d4d4d8;
}

.match-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.match-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
  border-radius: 14px;
  border: none;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s ease;
}

.match-btn--ghost {
  background: rgba(255, 255, 255, .06);
  color: #a1a1aa;
}

.match-btn--ghost:hover {
  background: rgba(255, 255, 255, .1);
  color: #f4f4f5;
}

.match-btn--primary {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(124, 58, 237, .3);
}

.match-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, .4);
}

/* ─── Transitions ─────────────────────────────────────── */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity .3s ease, transform .3s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* ─── Responsive ──────────────────────────────────────── */
@media (max-width: 480px) {
  .swipe-shell {
    padding: 0 0.75rem;
  }

  .card__hero {
    height: 260px;
  }

  .card__name {
    font-size: 1.4rem;
  }

  .card__body {
    padding: 0.85rem 1rem 1rem;
  }

  .stack {
    min-height: 520px;
  }

  .action-btn {
    width: 58px;
    height: 58px;
  }

  .match-modal {
    padding: 2rem 1.5rem 1.75rem;
    border-radius: 22px;
  }

  .match-av {
    width: 68px;
    height: 68px;
  }
}

@media (min-height: 800px) {
  .card__hero {
    height: 340px;
  }

  .stack {
    min-height: 640px;
  }
}
</style>
