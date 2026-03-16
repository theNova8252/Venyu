<template>
  <q-page class="swipe-page">
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
            <!-- Hero image -->
            <div class="card__hero">
              <img :src="card.avatar" :alt="card.name" class="card__img" />
              <div class="card__scrim"></div>

              <!-- Match score badge -->
              <button class="score-badge" @click.stop="toggleScoreTooltip(card.id)">
                <q-icon name="auto_awesome" size="13px" />
                <span>{{ card.matchScore }}%</span>
              </button>

              <!-- Score tooltip -->
              <transition name="tooltip-pop">
                <div v-if="hoveredScoreCardId === card.id" class="score-tooltip" @click.stop>
                  <div class="st-header">Match Breakdown</div>

                  <div class="st-category">
                    <div class="st-cat-header">
                      <div class="st-cat-left">
                        <q-icon name="library_music" size="14px" class="st-icon st-icon--genre" />
                        <span class="st-cat-name">Genres</span>
                      </div>
                      <span class="st-cat-score">{{ card.matchBreakdown?.genreScore ?? 0 }}<span class="st-cat-max">/50</span></span>
                    </div>
                    <div class="st-bar">
                      <div class="st-bar-fill st-bar-fill--genre" :style="{ width: ((card.matchBreakdown?.genreScore ?? 0) / 50 * 100) + '%' }"></div>
                    </div>
                    <div class="st-shared" v-if="card.matchBreakdown?.sharedGenres?.length">
                      {{ card.matchBreakdown.sharedGenres.slice(0, 6).join(', ') }}
                    </div>
                  </div>

                  <div class="st-category">
                    <div class="st-cat-header">
                      <div class="st-cat-left">
                        <q-icon name="person" size="14px" class="st-icon st-icon--artist" />
                        <span class="st-cat-name">Artists</span>
                      </div>
                      <span class="st-cat-score">{{ card.matchBreakdown?.artistScore ?? 0 }}<span class="st-cat-max">/30</span></span>
                    </div>
                    <div class="st-bar">
                      <div class="st-bar-fill st-bar-fill--artist" :style="{ width: ((card.matchBreakdown?.artistScore ?? 0) / 30 * 100) + '%' }"></div>
                    </div>
                    <div class="st-shared" v-if="card.matchBreakdown?.sharedArtists">
                      {{ card.matchBreakdown.sharedArtists }} shared artist{{ card.matchBreakdown.sharedArtists !== 1 ? 's' : '' }}
                    </div>
                  </div>

                  <div class="st-category">
                    <div class="st-cat-header">
                      <div class="st-cat-left">
                        <q-icon name="event" size="14px" class="st-icon st-icon--event" />
                        <span class="st-cat-name">Events</span>
                      </div>
                      <span class="st-cat-score">{{ card.matchBreakdown?.eventScore ?? 0 }}<span class="st-cat-max">/20</span></span>
                    </div>
                    <div class="st-bar">
                      <div class="st-bar-fill st-bar-fill--event" :style="{ width: ((card.matchBreakdown?.eventScore ?? 0) / 20 * 100) + '%' }"></div>
                    </div>
                    <div class="st-shared" v-if="card.matchBreakdown?.sharedEvents">
                      {{ card.matchBreakdown.sharedEvents }} shared event{{ card.matchBreakdown.sharedEvents !== 1 ? 's' : '' }}
                    </div>
                  </div>

                  <div class="st-total-row">
                    <span class="st-total-label">Total</span>
                    <span class="st-total-val">{{ card.matchScore }}%</span>
                  </div>
                </div>
              </transition>

              <!-- Name + location overlay -->
              <div class="card__identity">
                <h2 class="card__name">
                  {{ card.name }}<span v-if="card.age != null" class="card__age">, {{ card.age }}</span>
                </h2>
                <div class="card__loc" v-if="card.distance">
                  <q-icon name="near_me" size="12px" />
                  {{ card.distance }}
                </div>
              </div>
            </div>

            <!-- Card body -->
            <div class="card__body">
              <!-- Currently Playing -->
              <div class="np-section" v-if="card.currentlyPlaying?.isPlaying">
                <div class="np-header">
                  <div class="np-dot"></div>
                  <span>Listening Now</span>
                </div>
                <div class="np-row">
                  <img v-if="card.currentlyPlaying.albumImage" :src="card.currentlyPlaying.albumImage" class="np-cover" />
                  <div v-else class="np-cover np-cover--empty">
                    <q-icon name="music_note" size="14px" />
                  </div>
                  <div class="np-info">
                    <span class="np-track">{{ card.currentlyPlaying.trackName }}</span>
                    <span class="np-artist">{{ card.currentlyPlaying.artistName }}</span>
                  </div>
                  <div class="np-eq"><span></span><span></span><span></span></div>
                </div>
              </div>

              <!-- Bio -->
              <p class="card__bio" v-if="card.bio">{{ card.bio }}</p>

              <!-- Top Artists -->
              <div class="section" v-if="card.topArtists?.length">
                <div class="section__label">
                  <q-icon name="person" size="13px" />
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
                  <q-icon name="headphones" size="13px" />
                  Top Tracks
                </div>
                <div class="track-list">
                  <div v-for="(track, idx) in card.topTracks.slice(0, 3)" :key="'t-' + idx" class="track-row">
                    <img v-if="track.albumImage" :src="track.albumImage" :alt="track.name" class="track-cover" />
                    <div v-else class="track-cover track-cover--empty">
                      <q-icon name="music_note" size="12px" />
                    </div>
                    <div class="track-info">
                      <span class="track-name">{{ track.name }}</span>
                      <span class="track-artist" v-if="track.artist">{{ track.artist }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Genres -->
              <div class="section" v-if="card.genres?.length">
                <div class="section__label">
                  <q-icon name="tag" size="13px" />
                  Genres
                </div>
                <div class="chip-row">
                  <span v-for="(genre, idx) in card.genres.slice(0, 6)" :key="'g-' + idx"
                    class="chip chip--genre">{{ genre }}</span>
                </div>
              </div>

              <!-- Events -->
              <div class="section" v-if="card.eventRsvps?.length">
                <div class="section__label">
                  <q-icon name="event" size="13px" />
                  Events
                </div>
                <div class="event-list">
                  <div v-for="(ev, idx) in cardEvents(card)" :key="'ev-' + idx" class="event-chip"
                    :class="{ 'event-chip--shared': ev.shared }">
                    <q-icon :name="ev.going ? 'check_circle' : 'star'" size="12px" />
                    <span class="event-chip__title">{{ ev.title }}</span>
                    <span class="event-chip__date" v-if="ev.date">{{ formatEventDate(ev.date) }}</span>
                    <span v-if="ev.shared" class="event-chip__badge">You too!</span>
                  </div>
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
        <div class="match-particles">
          <span v-for="i in 12" :key="i" class="particle" :style="particleStyle(i)"></span>
        </div>
        <div class="match-modal__content">
          <div class="match-avatars">
            <div class="match-av">
              <img :src="userStore.me?.avatarUrl || 'https://i.pravatar.cc/150?img=1'" alt="You" />
            </div>
            <div class="match-heart">
              <q-icon name="favorite" size="22px" />
            </div>
            <div class="match-av">
              <img :src="lastMatchedUser?.avatar" :alt="lastMatchedUser?.name" />
            </div>
          </div>
          <h2 class="match-title">It's a Match!</h2>
          <p class="match-sub">
            You and <strong>{{ lastMatchedUser?.name }}</strong> both liked each other
          </p>
          <div class="match-actions">
            <button class="match-btn match-btn--ghost" @click="closeMatchModal">Keep Swiping</button>
            <button class="match-btn match-btn--primary" @click="sendMessage">
              <q-icon name="chat_bubble" size="16px" />
              Send Message
            </button>
          </div>
        </div>
      </div>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useQuasar } from "quasar";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";
import { useMatchesStore } from "@/stores/matches";
import { useChatsStore } from "@/stores/chats";
import { useEventsStore } from "@/stores/events";
import { api } from "@/api";

const $q = useQuasar();
const userStore = useUserStore();
const router = useRouter();
const matchesStore = useMatchesStore();
const eventsStore = useEventsStore();

const currentCardIndex = ref(0);
const isAnimating = ref(false);
const hoveredScoreCardId = ref(null);

// Currently playing polling
const nowPlayingMap = ref({});
let npPollInterval = null;

const toggleScoreTooltip = (cardId) => {
  hoveredScoreCardId.value = hoveredScoreCardId.value === cardId ? null : cardId;
};

const fetchNowPlayingForVisible = async () => {
  if (document.hidden) return;
  const visible = visibleCards.value;
  if (!visible?.length) return;
  const frontCard = visible[0];
  if (!frontCard?.userId) return;
  try {
    const data = await api.getCurrentlyPlaying(frontCard.userId);
    if (data) {
      nowPlayingMap.value[frontCard.userId] = data;
      const m = matchesStore.list.find((x) => x.id === frontCard.userId || x.userId === frontCard.userId);
      if (m) m.currentlyPlaying = data;
    }
  } catch { /* silent */ }
};

// Event helpers
const cardEvents = (card) => {
  if (!card.eventRsvps?.length) return [];
  return card.eventRsvps.map((rsvp) => {
    const storeEvent = eventsStore.list.find((e) => String(e.id) === String(rsvp.eventId));
    const shared = eventsStore.isInterested(rsvp.eventId) || eventsStore.isGoing(rsvp.eventId);
    return {
      eventId: rsvp.eventId,
      title: storeEvent?.title || storeEvent?.name || `Event`,
      date: storeEvent?.date || null,
      going: rsvp.going,
      interested: rsvp.interested,
      shared,
    };
  });
};

const formatEventDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const showMatchModal = ref(false);
const lastMatchedUser = ref(null);
const currentRoomId = ref(null);
const chatsStore = useChatsStore();

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const toArtistNames = (value) =>
  toArray(value).map((artist) => (typeof artist === "string" ? artist : artist?.name)).filter(Boolean);

const toGenres = (value) =>
  toArray(value).map((genre) => String(genre).trim()).filter(Boolean);

const toTrackItems = (value) =>
  toArray(value).map((t) => {
    if (typeof t === "string") return { name: t, artist: "", albumImage: null };
    return {
      name: t?.name || "",
      artist: t?.artist || t?.artists?.[0]?.name || "",
      albumImage: t?.albumImage || t?.album?.image || t?.album?.images?.[0]?.url || null,
    };
  }).filter((t) => t.name);

const particleStyle = (i) => {
  const angle = (i / 12) * 360;
  const delay = (i * 0.08).toFixed(2);
  const size = 4 + Math.random() * 6;
  return { '--angle': `${angle}deg`, '--delay': `${delay}s`, '--size': `${size}px` };
};

const cards = computed(() =>
  matchesStore.list.map((m, index) => ({
    id: m.id ?? m.userId ?? `match-${index}`,
    userId: m.userId ?? m.id ?? m.user?.id,
    name: m.displayName ?? m.name ?? "Unknown",
    age: Number.isFinite(Number(m.age ?? m.user?.age)) ? Number(m.age ?? m.user?.age) : null,
    avatar: m.avatar ?? m.avatar_url ?? m.avatarUrl ?? `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
    bio: m.bio ?? "Music lover",
    distance: m.distance ?? (m.distanceKm != null ? `${m.distanceKm} km away` : "Nearby"),
    topArtists: toArtistNames(m.topArtists ?? m.top_artists ?? m.spotifyTopArtists ?? m.spotify_top_artists),
    topTracks: toTrackItems(m.topTracks ?? m.top_tracks ?? m.spotifyTopTracks ?? m.spotify_top_tracks),
    genres: toGenres(m.genres ?? m.spotifyGenres ?? m.spotify_genres),
    matchScore: Number(m.matchScore ?? m.score ?? m.compatibility) >= 0 ? Number(m.matchScore ?? m.score ?? m.compatibility) : 0,
    matchBreakdown: m.matchBreakdown ?? null,
    eventRsvps: m.eventRsvps ?? [],
    currentlyPlaying: m.currentlyPlaying ?? nowPlayingMap.value[m.userId ?? m.id] ?? null,
  }))
);

const visibleCards = computed(() =>
  cards.value.slice(currentCardIndex.value, currentCardIndex.value + 3)
);

const swipeLeft = () => {
  if (isAnimating.value) return;
  isAnimating.value = true;
  $q.notify({ message: "Passed", color: "red-5", icon: "close", position: "top", timeout: 800 });
  setTimeout(() => { currentCardIndex.value++; isAnimating.value = false; }, 250);
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
    const result = await matchesStore.like(currentCard.userId);
    const isMatch = !!result?.isMatch;
    if (isMatch && result.roomId) {
      lastMatchedUser.value = currentCard;
      currentRoomId.value = result.roomId;
      await chatsStore.fetchChats();
      showMatchModal.value = true;
    } else {
      $q.notify({ message: "Liked!", color: "green-5", icon: "favorite", position: "top", timeout: 800 });
    }
  } catch (err) {
    console.error("Like failed", err);
    $q.notify({ message: "Like failed", color: "red-5", icon: "error", position: "top", timeout: 1500 });
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
  router.push({ name: "ChatView", params: { roomId: currentRoomId.value } });
};

onMounted(async () => {
  if (!userStore.me) await userStore.fetchMe();
  if (!eventsStore.list.length) eventsStore.fetchNearby();
  await matchesStore.fetchMatches(true);
  await fetchNowPlayingForVisible();
  npPollInterval = setInterval(fetchNowPlayingForVisible, 5000);
  document.addEventListener('visibilitychange', onVisChange);
});

const onVisChange = () => { if (!document.hidden) fetchNowPlayingForVisible(); };

onUnmounted(() => {
  if (npPollInterval) clearInterval(npPollInterval);
  document.removeEventListener('visibilitychange', onVisChange);
});
</script>

<style scoped>
/* ─── Page ─────────────────────────────────────────── */
.swipe-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: #0a0a0c;
  position: relative;
  overflow: hidden;
  color: #e4e4e7;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
}

.bg-mesh {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 60% 40% at 25% 0%, rgba(139, 92, 246, .07) 0%, transparent 60%),
    radial-gradient(ellipse 50% 35% at 75% 100%, rgba(236, 72, 153, .05) 0%, transparent 60%);
}

/* ─── Shell ─────────────────────────────────────────── */
.swipe-shell {
  position: relative;
  z-index: 1;
  max-width: 420px;
  margin: 0 auto;
  padding: 0 16px;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ─── Topbar ────────────────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px;
  flex-shrink: 0;
}

.topbar__title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #f4f4f5;
}

.topbar__counter {
  font-size: 0.75rem;
  font-weight: 600;
  color: #52525b;
  background: rgba(255, 255, 255, .04);
  padding: 4px 10px;
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
}

/* ─── Empty state ───────────────────────────────────── */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
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
  margin-bottom: 8px;
}

.empty-state__title { font-size: 1.25rem; font-weight: 700; color: #d4d4d8; margin: 0; }
.empty-state__sub { font-size: 0.88rem; color: #71717a; margin: 0; }

.pill-btn {
  margin-top: 8px;
  padding: 10px 24px;
  border-radius: 12px;
  border: none;
  background: rgba(139, 92, 246, .12);
  color: #a78bfa;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background .2s;
}
.pill-btn:hover { background: rgba(139, 92, 246, .22); }

/* ─── Stack ─────────────────────────────────────────── */
.stack-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 12px;
}

.stack {
  flex: 1;
  position: relative;
  min-height: 560px;
}

/* ─── Card ──────────────────────────────────────────── */
.card {
  position: absolute;
  inset: 0;
  margin: 0 auto;
  width: 100%;
  max-width: 400px;
  background: #141416;
  border-radius: 24px;
  overflow: hidden;
  pointer-events: none;
  transition: transform .35s cubic-bezier(.4, 0, .2, 1), opacity .35s ease;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, .03) inset,
    0 24px 48px -12px rgba(0, 0, 0, .65);
  border: 1px solid rgba(255, 255, 255, .06);
  display: flex;
  flex-direction: column;
}

.card--front { z-index: 3; transform: scale(1) translateY(0); opacity: 1; pointer-events: auto; }
.card--mid { z-index: 2; transform: scale(.97) translateY(10px); opacity: .4; }
.card--back { z-index: 1; transform: scale(.94) translateY(20px); opacity: .15; }

/* ─── Hero ──────────────────────────────────────────── */
.card__hero {
  position: relative;
  height: 280px;
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
    #141416 0%,
    rgba(20, 20, 22, .9) 25%,
    rgba(20, 20, 22, .3) 55%,
    transparent 100%);
}

/* ─── Score badge ───────────────────────────────────── */
.score-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 12px;
  background: rgba(0, 0, 0, .5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, .1);
  color: #e9d5ff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  z-index: 5;
  transition: all .2s ease;
  font-family: inherit;
}
.score-badge:hover { background: rgba(0, 0, 0, .65); border-color: rgba(139, 92, 246, .3); }

/* ─── Score tooltip ─────────────────────────────────── */
.score-tooltip {
  position: absolute;
  top: 44px;
  left: 14px;
  width: 260px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(20, 20, 22, .96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, .08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, .5);
  z-index: 10;
  cursor: default;
}

.st-header {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #a78bfa;
  margin-bottom: 14px;
}

.st-category {
  margin-bottom: 12px;
}
.st-category:last-of-type { margin-bottom: 14px; }

.st-cat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.st-cat-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.st-icon { opacity: .7; }
.st-icon--genre { color: #f472b6; }
.st-icon--artist { color: #a78bfa; }
.st-icon--event { color: #38bdf8; }

.st-cat-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #d4d4d8;
}

.st-cat-score {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f4f4f5;
  font-variant-numeric: tabular-nums;
}

.st-cat-max {
  font-weight: 500;
  color: #52525b;
  font-size: 0.75rem;
}

.st-bar {
  height: 4px;
  background: rgba(255, 255, 255, .06);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.st-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width .4s cubic-bezier(.4, 0, .2, 1);
}

.st-bar-fill--genre { background: linear-gradient(90deg, #ec4899, #f472b6); }
.st-bar-fill--artist { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.st-bar-fill--event { background: linear-gradient(90deg, #0ea5e9, #38bdf8); }

.st-shared {
  font-size: 0.7rem;
  color: #71717a;
  line-height: 1.3;
}

.st-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, .06);
}

.st-total-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #d4d4d8;
}

.st-total-val {
  font-size: 1rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tooltip-pop-enter-active { transition: opacity .2s ease, transform .2s cubic-bezier(.34, 1.56, .64, 1); }
.tooltip-pop-leave-active { transition: opacity .15s ease, transform .15s ease; }
.tooltip-pop-enter-from, .tooltip-pop-leave-to { opacity: 0; transform: translateY(-6px) scale(.95); }

/* ─── Identity ──────────────────────────────────────── */
.card__identity {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 20px 14px;
  z-index: 2;
}

.card__name {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0;
  line-height: 1.2;
  text-shadow: 0 2px 16px rgba(0, 0, 0, .6);
}

.card__age { font-weight: 400; color: rgba(255, 255, 255, .55); }

.card__loc {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, .4);
}

/* ─── Card body ─────────────────────────────────────── */
.card__body {
  padding: 14px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.card__body::-webkit-scrollbar { width: 0; }

.card__bio {
  font-size: 0.88rem;
  line-height: 1.5;
  color: #a1a1aa;
  margin: 0;
}

/* ─── Sections ──────────────────────────────────────── */
.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #52525b;
}

/* ─── Chips ─────────────────────────────────────────── */
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background .15s;
}

.chip--artist {
  background: rgba(139, 92, 246, .1);
  color: #c4b5fd;
  border: 1px solid rgba(139, 92, 246, .14);
}

.chip--genre {
  background: rgba(236, 72, 153, .08);
  color: #f9a8d4;
  border: 1px solid rgba(236, 72, 153, .12);
}

/* ─── Tracks ────────────────────────────────────────── */
.track-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.track-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .04);
  transition: background .15s;
}

.track-cover {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.track-cover--empty {
  background: rgba(255, 255, 255, .05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3f3f46;
}

.track-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.track-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #e4e4e7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artist {
  font-size: 0.72rem;
  color: #71717a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Now Playing ───────────────────────────────────── */
.np-section {
  background: rgba(30, 215, 96, .06);
  border: 1px solid rgba(30, 215, 96, .14);
  border-radius: 14px;
  padding: 12px;
}

.np-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #1ed760;
  margin-bottom: 10px;
}

.np-dot {
  width: 5px;
  height: 5px;
  background: #1ed760;
  border-radius: 50%;
  animation: np-pulse 1.5s ease-in-out infinite;
}

@keyframes np-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .4; }
}

.np-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.np-cover {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.np-cover--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, .05);
  color: rgba(255, 255, 255, .25);
}

.np-info {
  flex: 1;
  min-width: 0;
}

.np-track {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.np-artist {
  display: block;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, .4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.np-eq {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
  flex-shrink: 0;
}

.np-eq span {
  display: block;
  width: 2.5px;
  background: #1ed760;
  border-radius: 1px;
  animation: eq-bounce .6s ease-in-out infinite alternate;
}

.np-eq span:nth-child(1) { height: 5px; animation-delay: 0s; }
.np-eq span:nth-child(2) { height: 10px; animation-delay: .15s; }
.np-eq span:nth-child(3) { height: 3px; animation-delay: .3s; }

@keyframes eq-bounce {
  0% { transform: scaleY(1); }
  100% { transform: scaleY(.3); }
}

/* ─── Events ────────────────────────────────────────── */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 10px;
  background: rgba(139, 92, 246, .07);
  border: 1px solid rgba(139, 92, 246, .12);
  color: #c4b5fd;
  font-size: 0.78rem;
}

.event-chip--shared {
  background: rgba(236, 72, 153, .08);
  border-color: rgba(236, 72, 153, .2);
  color: #f9a8d4;
}

.event-chip__title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.event-chip__date {
  font-size: 0.68rem;
  color: rgba(255, 255, 255, .3);
  flex-shrink: 0;
}

.event-chip__badge {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #ec4899;
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(236, 72, 153, .12);
}

/* ─── Actions ───────────────────────────────────────── */
.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 16px 0 8px;
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

.action-btn:active:not(:disabled) { transform: scale(.9); }
.action-btn:disabled { opacity: .35; cursor: not-allowed; }

.action-btn--pass {
  background: rgba(239, 68, 68, .08);
  color: #f87171;
  border: 2px solid rgba(239, 68, 68, .15);
}

.action-btn--pass:hover:not(:disabled) {
  background: rgba(239, 68, 68, .15);
  border-color: rgba(239, 68, 68, .3);
  transform: scale(1.08);
  box-shadow: 0 0 28px rgba(239, 68, 68, .12);
}

.action-btn--like {
  background: rgba(34, 197, 94, .08);
  color: #4ade80;
  border: 2px solid rgba(34, 197, 94, .15);
}

.action-btn--like:hover:not(:disabled) {
  background: rgba(34, 197, 94, .15);
  border-color: rgba(34, 197, 94, .3);
  transform: scale(1.08);
  box-shadow: 0 0 28px rgba(34, 197, 94, .12);
}

/* ─── Match modal ───────────────────────────────────── */
.match-modal {
  background: #141416;
  border: 1px solid rgba(255, 255, 255, .06);
  border-radius: 28px;
  padding: 2.5rem 2rem 2rem;
  max-width: 380px;
  width: 100%;
  position: relative;
  overflow: hidden;
  color: #e4e4e7;
}

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

.particle:nth-child(odd) { background: #c084fc; }
.particle:nth-child(even) { background: #f472b6; }

@keyframes burst {
  0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(140px); opacity: 0; }
}

.match-modal__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.match-avatars {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.match-av {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #141416;
  position: relative;
}

.match-av + .match-heart { margin-left: -10px; }
.match-heart + .match-av { margin-left: -10px; }

.match-av img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.match-heart {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ec4899, #f43f5e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  z-index: 2;
  border: 3px solid #141416;
  box-shadow: 0 4px 16px rgba(236, 72, 153, .35);
  animation: heart-pop .5s .3s ease-out both;
}

@keyframes heart-pop {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.match-title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 6px;
  background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.match-sub {
  font-size: 0.88rem;
  color: #71717a;
  margin: 0 0 24px;
  line-height: 1.4;
}

.match-sub strong { color: #d4d4d8; }

.match-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.match-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 13px 0;
  border-radius: 14px;
  border: none;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s ease;
  font-family: inherit;
}

.match-btn--ghost {
  background: rgba(255, 255, 255, .05);
  color: #a1a1aa;
}
.match-btn--ghost:hover { background: rgba(255, 255, 255, .09); color: #f4f4f5; }

.match-btn--primary {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  box-shadow: 0 4px 16px rgba(124, 58, 237, .25);
}
.match-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(124, 58, 237, .35); }

/* ─── Transitions ───────────────────────────────────── */
.fade-up-enter-active, .fade-up-leave-active { transition: opacity .3s ease, transform .3s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(12px); }

/* ─── Responsive ────────────────────────────────────── */
@media (max-width: 480px) {
  .swipe-shell { padding: 0 12px; }
  .card__hero { height: 240px; }
  .card__name { font-size: 1.35rem; }
  .card__body { padding: 12px 16px 16px; }
  .stack { min-height: 500px; }
  .action-btn { width: 58px; height: 58px; }
  .match-modal { padding: 2rem 1.5rem 1.75rem; border-radius: 22px; }
  .match-av { width: 64px; height: 64px; }
  .score-tooltip { width: 230px; padding: 14px; }
}

@media (min-height: 800px) {
  .card__hero { height: 320px; }
  .stack { min-height: 620px; }
}
</style>
