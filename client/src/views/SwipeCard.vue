<template>
  <q-page class="swipe-page">
    <div class="aurora">
      <div class="aurora__orb aurora__orb--1"></div>
      <div class="aurora__orb aurora__orb--2"></div>
      <div class="aurora__orb aurora__orb--3"></div>
    </div>

    <div class="swipe-shell">
      <!-- Header -->
      <header class="topbar">
        <div class="topbar__left">
          <h1 class="topbar__title">Discover</h1>
          <span class="topbar__sub" v-if="cards.length">
            {{ currentCardIndex + 1 }}<span class="topbar__sub-of"> of </span>{{ cards.length }}
          </span>
        </div>
        <div class="progress-dots" v-if="cards.length">
          <span
            v-for="i in Math.min(cards.length, 7)"
            :key="i"
            class="progress-dot"
            :class="{ 'progress-dot--active': (i - 1) === currentCardIndex % 7 }"
          ></span>
        </div>
      </header>

      <!-- Empty state -->
      <transition name="fade-scale">
        <div v-if="currentCardIndex >= cards.length" class="empty-state">
          <div class="empty-ring">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="26" stroke="rgba(124,58,237,0.3)" stroke-width="1.5"/>
              <path d="M18 28l7 7 13-13" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 class="empty-title">You're all caught up</h2>
          <p class="empty-sub">New profiles appear daily.<br>Check back soon.</p>
          <button class="cta-btn" @click="$router.push({ name: 'Home' })">Back to Home</button>
        </div>
      </transition>

      <!-- Card stack -->
      <div v-if="currentCardIndex < cards.length" class="stack-wrap">
        <div class="stack">
          <div
            v-for="(card, index) in visibleCards"
            :key="card.id"
            class="card"
            :class="{
              'card--front': index === 0,
              'card--mid':   index === 1,
              'card--back':  index === 2,
            }"
          >
            <!-- Hero -->
            <div class="card__hero">
              <img :src="card.avatar" :alt="card.name" class="card__img" />
              <div class="card__overlay"></div>

              <!-- Match badge -->
              <div
                class="mbadge"
                :class="scoreTier(card.matchScore)"
                @click.stop="hoveredScoreCardId = hoveredScoreCardId === card.id ? null : card.id"
              >
                <svg class="mbadge__ring" viewBox="0 0 48 48">
                  <circle class="mbadge__bg" cx="24" cy="24" r="19"/>
                  <circle class="mbadge__fill" cx="24" cy="24" r="19"
                    :style="{ strokeDashoffset: 119.4 - (card.matchScore / 100) * 119.4 }"
                  />
                </svg>
                <span class="mbadge__num">{{ card.matchScore }}</span>
                <span class="mbadge__pct">%</span>

                <!-- Breakdown popup -->
                <transition name="pop">
                  <div v-if="hoveredScoreCardId === card.id" class="bdrop" @click.stop>
                    <div class="bdrop__head">
                      <span class="bdrop__title">Match Breakdown</span>
                      <span class="bdrop__total-badge">{{ card.matchScore }}%</span>
                    </div>
                    <div class="bdrop__row">
                      <span class="bdrop__label">Genres</span>
                      <div class="bdrop__bar-wrap">
                        <div class="bdrop__bar bdrop__bar--violet"
                          :style="{ width: ((card.matchBreakdown?.genreScore ?? 0) / 6 * 100) + '%' }">
                        </div>
                      </div>
                      <span class="bdrop__val">{{ card.matchBreakdown?.genreScore ?? 0 }}<small>/6</small></span>
                    </div>
                    <div class="bdrop__tags" v-if="card.matchBreakdown?.sharedGenres?.length">
                      <span v-for="g in card.matchBreakdown.sharedGenres.slice(0, 6)" :key="g" class="bdrop__tag">{{ g }}</span>
                    </div>
                    <div class="bdrop__row">
                      <span class="bdrop__label">Artists</span>
                      <div class="bdrop__bar-wrap">
                        <div class="bdrop__bar bdrop__bar--rose"
                          :style="{ width: ((card.matchBreakdown?.artistScore ?? 0) / 4 * 100) + '%' }">
                        </div>
                      </div>
                      <span class="bdrop__val">{{ card.matchBreakdown?.artistScore ?? 0 }}<small>/4</small></span>
                    </div>
                    <div class="bdrop__detail" v-if="card.matchBreakdown?.sharedArtists">
                      {{ card.matchBreakdown.sharedArtists }} shared artist{{ card.matchBreakdown.sharedArtists !== 1 ? 's' : '' }}
                    </div>
                  </div>
                </transition>
              </div>

              <!-- Identity block -->
              <div class="card__id">
                <!-- Currently playing (live) -->
                <div class="now-playing" v-if="card.currentlyPlaying?.isPlaying">
                  <div class="now-playing__eq">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <span class="now-playing__text">{{ card.currentlyPlaying.trackName }}</span>
                </div>

                <h2 class="card__name">
                  {{ card.name }}<span v-if="card.age != null" class="card__age">, {{ card.age }}</span>
                </h2>

                <div v-if="card.badges?.length" class="music-badge-row">
                  <span
                    v-for="badge in card.badges"
                    :key="badge.id"
                    class="music-badge"
                    :class="`music-badge--${badge.tone}`"
                  >
                    {{ badge.title }}
                  </span>
                </div>

                <!-- Sound wave + cycling recently played -->
                <div class="wave-wrap" v-if="card.recentlyPlayed?.length">
                  <div class="wave-bars">
                    <span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <div class="wave-cycle">
                    <div
                      v-for="(track, ti) in card.recentlyPlayed.slice(0, 3)"
                      :key="ti"
                      class="wave-cycle__item"
                      :style="{ animationDelay: (ti * 4) + 's' }"
                    >
                      <span class="wave-cycle__name">{{ track.name }}</span>
                      <span class="wave-cycle__artist" v-if="track.artist">{{ track.artist }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card body -->
            <div class="card__body">

              <!-- Bio -->
              <p class="card__bio" v-if="card.bio">{{ card.bio }}</p>

              <!-- Two-column: Genres + Artists -->
              <div class="two-col" v-if="card.genres?.length || card.topArtists?.length">
                <div class="col" v-if="card.genres?.length">
                  <span class="col__label">Genres</span>
                  <div class="mini-pills">
                    <span
                      v-for="(g, i) in card.genres.slice(0, 6)"
                      :key="i"
                      class="mini-pill"
                      :class="'mini-pill--' + (i % 4)"
                    >{{ g }}</span>
                  </div>
                </div>
                <div class="col" v-if="card.topArtists?.length">
                  <span class="col__label">Top Artists</span>
                  <div class="mini-artists">
                    <div
                      v-for="(artist, i) in card.topArtists.slice(0, 4)"
                      :key="i"
                      class="mini-artist"
                    >
                      <div class="mini-artist__circle">
                        <span class="mini-artist__letter">{{ artist.name?.[0]?.toUpperCase() }}</span>
                        <img
                          v-if="artist.image"
                          :src="artist.image"
                          :alt="artist.name"
                          class="mini-artist__img"
                          loading="lazy"
                          @error="e => e.target.style.display = 'none'"
                        />
                      </div>
                      <span class="mini-artist__name">{{ artist.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top Tracks (full width, with album art) -->
              <div class="section" v-if="card.topTracks?.length">
                <span class="col__label">Top Tracks</span>
                <div class="track-list">
                  <div
                    v-for="(track, i) in card.topTracks.slice(0, 3)"
                    :key="i"
                    class="track-item"
                  >
                    <img v-if="track.albumImage" :src="track.albumImage" :alt="track.name" class="track-art" loading="lazy" />
                    <div v-else class="track-art track-art--empty"></div>
                    <div class="track-info">
                      <span class="track-name">{{ track.name }}</span>
                      <span class="track-artist" v-if="track.artist">{{ track.artist }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Events (compact badges) -->
              <div class="event-row" v-if="card.eventRsvps?.length">
                <span
                  v-for="(ev, i) in cardEvents(card)"
                  :key="i"
                  class="event-badge"
                  :class="{ 'event-badge--shared': ev.shared }"
                >
                  {{ ev.title }}
                  <span v-if="ev.shared" class="event-badge__you">You too!</span>
                </span>
              </div>

            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="actions">
          <button class="act act--pass" :disabled="isAnimating" @click="swipeLeft" aria-label="Pass">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <button class="act act--like" :disabled="isAnimating" @click="swipeRight" aria-label="Like">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Match modal -->
    <q-dialog v-model="showMatchModal" persistent>
      <div class="match-modal">
        <div class="match-sparks">
          <span v-for="i in 14" :key="i" class="spark" :style="particleStyle(i)"></span>
        </div>
        <div class="match-inner">
          <div class="match-avs">
            <div class="match-av">
              <img :src="userStore.me?.avatarUrl || 'https://i.pravatar.cc/150?img=1'" alt="You" />
            </div>
            <div class="match-heart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div class="match-av">
              <img :src="lastMatchedUser?.avatar" :alt="lastMatchedUser?.name" />
            </div>
          </div>
          <div class="match-eyebrow">It's a Match</div>
          <h2 class="match-title">You & {{ lastMatchedUser?.name }}</h2>
          <p class="match-body">You both liked each other. Start the conversation!</p>
          <div class="match-btns">
            <button class="match-ghost" @click="closeMatchModal">Keep Swiping</button>
            <button class="match-primary" @click="sendMessage">
              Send Message
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
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
import { buildMusicBadges } from "@/services/musicBadges";

const $q = useQuasar();
const userStore = useUserStore();
const router = useRouter();
const matchesStore = useMatchesStore();
const eventsStore = useEventsStore();

const currentCardIndex = ref(0);
const isAnimating = ref(false);
const hoveredScoreCardId = ref(null);

const nowPlayingMap = ref({});
let npPollInterval = null;

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
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const toArtistObjects = (value) =>
  toArray(value)
    .map((a) => typeof a === "string" ? { name: a, image: null } : { name: a?.name || "", image: a?.image || null })
    .filter((a) => a.name);

const toGenres = (value) =>
  toArray(value).map((g) => String(g).trim()).filter(Boolean);

const toTrackItems = (value) =>
  toArray(value)
    .map((t) => typeof t === "string"
      ? { name: t, artist: "", albumImage: null }
      : { name: t?.name || "", artist: t?.artist || t?.artists?.[0]?.name || "", albumImage: t?.albumImage || t?.album?.image || t?.album?.images?.[0]?.url || null })
    .filter((t) => t.name);

const toAudioFeatures = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
};

const particleStyle = (i) => ({
  '--angle': `${(i / 14) * 360}deg`,
  '--delay': `${(i * 0.07).toFixed(2)}s`,
  '--size': `${4 + (i % 3) * 3}px`,
});

const scoreTier = (score) => {
  if (score >= 80) return 'mbadge--gold';
  if (score >= 60) return 'mbadge--violet';
  if (score >= 40) return 'mbadge--blue';
  return 'mbadge--grey';
};

const cards = computed(() =>
  matchesStore.list.map((m, index) => {
    const genres = toGenres(m.genres ?? m.spotifyGenres ?? m.spotify_genres);
    const audioFeatures = toAudioFeatures(m.audioFeatures ?? m.audio_features);

    return {
      id: m.id ?? m.userId ?? `match-${index}`,
      userId: m.userId ?? m.id ?? m.user?.id,
      name: m.displayName ?? m.name ?? "Unknown",
      age: Number.isFinite(Number(m.age ?? m.user?.age)) ? Number(m.age ?? m.user?.age) : null,
      avatar: m.avatar ?? m.avatar_url ?? m.avatarUrl ?? `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
      bio: m.bio ?? null,
      distance: m.distance ?? (m.distanceKm != null ? `${m.distanceKm} km away` : "Nearby"),
      topArtists: toArtistObjects(m.topArtists ?? m.top_artists ?? m.spotifyTopArtists ?? m.spotify_top_artists),
      topTracks: toTrackItems(m.topTracks ?? m.top_tracks ?? m.spotifyTopTracks ?? m.spotify_top_tracks),
      genres,
      audioFeatures,
      badges: buildMusicBadges({ genres, audioFeatures }),
      matchScore: Number(m.matchScore ?? m.score ?? m.compatibility) >= 0 ? Number(m.matchScore ?? m.score ?? m.compatibility) : 0,
      matchBreakdown: m.matchBreakdown ?? null,
      recentlyPlayed: toTrackItems(m.recentlyPlayed ?? []),
      eventRsvps: m.eventRsvps ?? [],
      currentlyPlaying: m.currentlyPlaying ?? nowPlayingMap.value[m.userId ?? m.id] ?? null,
    };
  })
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
  if (!currentCard || !currentCard.userId) { currentCardIndex.value++; isAnimating.value = false; return; }
  try {
    const result = await matchesStore.like(currentCard.userId);
    if (result?.isMatch && result.roomId) {
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

const closeMatchModal = () => { showMatchModal.value = false; lastMatchedUser.value = null; currentRoomId.value = null; };
const sendMessage = () => {
  showMatchModal.value = false;
  if (currentRoomId.value) router.push({ name: "ChatView", params: { roomId: currentRoomId.value } });
};

onMounted(async () => {
  if (!userStore.me) await userStore.fetchMe();
  if (!eventsStore.list.length) eventsStore.fetchNearby();

  // Sync fresh Spotify data before fetching candidates so match scores are current
  try { await api.syncSpotifyData(); } catch (e) { console.warn('Spotify sync failed:', e); }

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
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

/* ─── Base ─────────────────────────────────── */
.swipe-page {
  min-height: 100vh;
  background: #07070f;
  position: relative;
  overflow: hidden;
  color: #ece8ff;
  font-family: 'DM Sans', -apple-system, system-ui, sans-serif;
}

/* ─── Aurora BG ────────────────────────────── */
.aurora {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.aurora__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
}

.aurora__orb--1 {
  width: 560px;
  height: 440px;
  background: radial-gradient(circle, rgba(109,40,217,.18) 0%, transparent 70%);
  top: -180px;
  left: -120px;
  animation: drift1 18s ease-in-out infinite alternate;
}

.aurora__orb--2 {
  width: 460px;
  height: 460px;
  background: radial-gradient(circle, rgba(236,72,153,.11) 0%, transparent 70%);
  bottom: -140px;
  right: -100px;
  animation: drift2 22s ease-in-out infinite alternate;
}

.aurora__orb--3 {
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(6,182,212,.07) 0%, transparent 70%);
  top: 45%;
  left: 50%;
  transform: translateX(-50%);
  animation: drift3 16s ease-in-out infinite alternate;
}

@keyframes drift1 { from { transform: translate(0,0) scale(1); } to { transform: translate(30px, 20px) scale(1.08); } }
@keyframes drift2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-20px, -30px) scale(1.06); } }
@keyframes drift3 { from { transform: translateX(-50%) scale(1); } to { transform: translateX(calc(-50% + 15px)) scale(1.1); } }

/* ─── Shell ────────────────────────────────── */
.swipe-shell {
  position: relative;
  z-index: 1;
  max-width: 420px;
  margin: 0 auto;
  padding: 0 1.1rem;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

/* ─── Topbar ───────────────────────────────── */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 0 0.6rem;
  flex-shrink: 0;
}

.topbar__left {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.topbar__title {
  font-family: 'Syne', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin: 0;
  background: linear-gradient(130deg, #fff 0%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.topbar__sub {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.3);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.topbar__sub-of { color: rgba(255,255,255,0.15); }

.progress-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.1);
  transition: all .3s ease;
}

.progress-dot--active {
  background: #7c3aed;
  transform: scale(1.3);
  box-shadow: 0 0 8px rgba(124,58,237,.6);
}

/* ─── Empty state ──────────────────────────── */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  text-align: center;
  padding: 2rem;
}

.empty-ring {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(124,58,237,.07);
  border-radius: 50%;
  border: 1px solid rgba(124,58,237,.2);
  margin-bottom: 0.4rem;
}

.empty-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #d4cfed;
  margin: 0;
}

.empty-sub {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.3);
  margin: 0;
  line-height: 1.55;
}

.cta-btn {
  margin-top: 0.75rem;
  padding: 12px 30px;
  border-radius: 14px;
  border: 1px solid rgba(124,58,237,.25);
  background: rgba(124,58,237,.1);
  color: #a78bfa;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: -0.01em;
  transition: all .2s ease;
}

.cta-btn:hover {
  background: rgba(124,58,237,.2);
  transform: translateY(-1px);
}

/* ─── Stack ────────────────────────────────── */
.stack-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 0.5rem;
}

.stack {
  flex: 1;
  position: relative;
  min-height: 540px;
}

/* ─── Card ─────────────────────────────────── */
.card {
  position: absolute;
  inset: 0;
  width: 100%;
  background: #0e0c1c;
  border-radius: 24px;
  overflow: hidden;
  pointer-events: none;
  transition: transform .45s cubic-bezier(.22, 1, .36, 1), opacity .45s ease;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.05),
    0 40px 100px -20px rgba(0,0,0,.9),
    0 10px 30px -10px rgba(0,0,0,.6);
}

.card--front {
  z-index: 3;
  transform: scale(1) translateY(0);
  opacity: 1;
  pointer-events: auto;
  box-shadow:
    0 0 0 1px rgba(255,255,255,.07),
    0 -1px 0 0 rgba(124,58,237,.6),
    0 40px 100px -20px rgba(0,0,0,.9);
}

.card--mid {
  z-index: 2;
  transform: scale(.96) translateY(14px);
  opacity: .4;
}

.card--back {
  z-index: 1;
  transform: scale(.92) translateY(28px);
  opacity: .18;
}

/* ─── Hero ─────────────────────────────────── */
.card__hero {
  position: relative;
  height: 260px;
  flex-shrink: 0;
  overflow: hidden;
}

.card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    #0e0c1c 0%,
    rgba(14,12,28,.8) 35%,
    rgba(14,12,28,.1) 70%,
    transparent 100%
  );
}

/* ─── Match Badge ──────────────────────────── */
.mbadge {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 52px;
  height: 52px;
  cursor: pointer;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mbadge__ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.mbadge__bg {
  fill: rgba(10,8,20,.85);
  stroke: rgba(255,255,255,.08);
  stroke-width: 2.5;
}

.mbadge__fill {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 119.4;
  transition: stroke-dashoffset .6s cubic-bezier(.4,0,.2,1);
}

.mbadge--gold   .mbadge__fill { stroke: #f59e0b; }
.mbadge--violet .mbadge__fill { stroke: #7c3aed; }
.mbadge--blue   .mbadge__fill { stroke: #0ea5e9; }
.mbadge--grey   .mbadge__fill { stroke: #4b5563; }

.mbadge__num {
  font-family: 'Syne', sans-serif;
  font-size: 0.8rem;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  position: relative;
  z-index: 1;
  margin-right: -1px;
}

.mbadge__pct {
  font-size: 0.55rem;
  font-weight: 600;
  color: rgba(255,255,255,.5);
  position: relative;
  z-index: 1;
  margin-top: 1px;
}

/* ─── Breakdown popup ──────────────────────── */
.bdrop {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 250px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(8,6,18,.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,.09);
  box-shadow: 0 24px 60px rgba(0,0,0,.8), 0 0 0 1px rgba(124,58,237,.12);
  z-index: 10;
  cursor: default;
}

.bdrop__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.bdrop__title {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #7c3aed;
}

.bdrop__total-badge {
  font-family: 'Syne', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  color: #a78bfa;
  background: rgba(124,58,237,.12);
  padding: 3px 10px;
  border-radius: 8px;
  border: 1px solid rgba(124,58,237,.2);
}

.bdrop__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
}

.bdrop__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255,255,255,.4);
  min-width: 52px;
}

.bdrop__bar-wrap {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,.06);
  border-radius: 3px;
  overflow: hidden;
}

.bdrop__bar {
  height: 100%;
  border-radius: 3px;
  transition: width .5s cubic-bezier(.4,0,.2,1);
}

.bdrop__bar--violet { background: linear-gradient(90deg, #6d28d9, #a78bfa); }
.bdrop__bar--rose   { background: linear-gradient(90deg, #be185d, #f472b6); }

.bdrop__val {
  font-size: 0.8rem;
  font-weight: 700;
  color: #c4b5fd;
  font-variant-numeric: tabular-nums;
  min-width: 38px;
  text-align: right;
}

.bdrop__val small {
  font-weight: 400;
  color: rgba(255,255,255,.2);
}

.bdrop__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 6px 0 6px 62px;
}

.bdrop__tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: #7c3aed;
  background: rgba(124,58,237,.1);
  border: 1px solid rgba(124,58,237,.18);
  padding: 2px 8px;
  border-radius: 6px;
}

.bdrop__detail {
  font-size: 0.75rem;
  color: rgba(255,255,255,.3);
  padding: 4px 0 2px 62px;
}

.pop-enter-active, .pop-leave-active {
  transition: opacity .15s ease, transform .15s ease;
}
.pop-enter-from, .pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.97);
}

/* ─── Identity ─────────────────────────────── */
.card__id {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0 22px 18px;
  z-index: 2;
}

.card__name {
  font-family: 'Syne', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #fff;
  margin: 0;
  line-height: 1.05;
  text-shadow: 0 2px 24px rgba(0,0,0,.6);
}

.card__age {
  font-weight: 300;
  color: rgba(255,255,255,.4);
}

/* ─── Now Playing (live) ──────────────────── */
.music-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
}

.music-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  backdrop-filter: blur(10px);
}

.music-badge--chill {
  background: rgba(6,182,212,.14);
  border-color: rgba(103,232,249,.2);
  color: #67e8f9;
}

.music-badge--beast {
  background: rgba(249,115,22,.14);
  border-color: rgba(251,146,60,.24);
  color: #fdba74;
}

.music-badge--vibe {
  background: rgba(236,72,153,.16);
  border-color: rgba(244,114,182,.2);
  color: #f9a8d4;
}

.now-playing {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(6,182,212,.12);
  border: 1px solid rgba(6,182,212,.22);
  border-radius: 10px;
  padding: 4px 11px 4px 7px;
  margin-bottom: 6px;
}

.now-playing__eq {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}

.now-playing__eq span {
  display: block;
  width: 2.5px;
  background: #06b6d4;
  border-radius: 1px;
  animation: npEq .85s ease-in-out infinite;
}
.now-playing__eq span:nth-child(1) { height: 4px;  animation-delay: 0s; }
.now-playing__eq span:nth-child(2) { height: 10px; animation-delay: .18s; }
.now-playing__eq span:nth-child(3) { height: 6px;  animation-delay: .09s; }
.now-playing__eq span:nth-child(4) { height: 9px;  animation-delay: .27s; }

@keyframes npEq {
  0%,100% { transform: scaleY(1); }
  50% { transform: scaleY(.2); }
}

.now-playing__text {
  font-size: 0.7rem;
  font-weight: 600;
  color: #22d3ee;
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Sound Wave ──────────────────────────── */
.wave-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.wave-bars {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 20px;
  flex-shrink: 0;
}

.wave-bars span {
  display: block;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(to top, #6d28d9, #a78bfa);
  animation: waveAnim 1.2s ease-in-out infinite;
}
.wave-bars span:nth-child(1) { height: 6px;  animation-delay: 0s; }
.wave-bars span:nth-child(2) { height: 14px; animation-delay: .1s; }
.wave-bars span:nth-child(3) { height: 9px;  animation-delay: .2s; }
.wave-bars span:nth-child(4) { height: 18px; animation-delay: .15s; }
.wave-bars span:nth-child(5) { height: 11px; animation-delay: .25s; }
.wave-bars span:nth-child(6) { height: 7px;  animation-delay: .08s; }
.wave-bars span:nth-child(7) { height: 15px; animation-delay: .3s; }
.wave-bars span:nth-child(8) { height: 5px;  animation-delay: .18s; }

@keyframes waveAnim {
  0%,100% { transform: scaleY(1); }
  50% { transform: scaleY(.3); }
}

.wave-cycle {
  position: relative;
  height: 32px;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.wave-cycle__item {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  animation: cycleFade 12s ease-in-out infinite;
}

@keyframes cycleFade {
  0%,5%   { opacity: 0; transform: translateY(6px); }
  10%,28% { opacity: 1; transform: translateY(0); }
  33%,100%{ opacity: 0; transform: translateY(-6px); }
}

.wave-cycle__name {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255,255,255,.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wave-cycle__artist {
  font-size: 0.65rem;
  color: rgba(255,255,255,.25);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Card body ────────────────────────────── */
.card__body {
  padding: 14px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.card__body::-webkit-scrollbar { display: none; }

.card__bio {
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(255,255,255,.4);
  margin: 0;
}

/* ─── Section ──────────────────────────────── */
.section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── Two column layout ──────────────────── */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.col__label {
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgba(124,58,237,.45);
}

/* ─── Mini Pills (genres) ────────────────── */
.mini-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.mini-pill {
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.mini-pill--0 { background: rgba(124,58,237,.1); color: #b794f6; border: 1px solid rgba(124,58,237,.18); }
.mini-pill--1 { background: rgba(236,72,153,.08); color: #f9a8d4; border: 1px solid rgba(236,72,153,.14); }
.mini-pill--2 { background: rgba(6,182,212,.06); color: #67e8f9; border: 1px solid rgba(6,182,212,.12); }
.mini-pill--3 { background: rgba(249,115,22,.07); color: #fdba74; border: 1px solid rgba(249,115,22,.12); }

/* ─── Mini Artists ────────────────────────── */
.mini-artists {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mini-artist {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mini-artist__circle {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1235, #261748);
  box-shadow: 0 0 0 1.5px rgba(124,58,237,.35);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-artist__letter {
  font-family: 'Syne', sans-serif;
  font-size: 0.8rem;
  font-weight: 800;
  color: rgba(124,58,237,.5);
  position: absolute;
  z-index: 0;
}

.mini-artist__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  z-index: 1;
}

.mini-artist__name {
  font-size: 0.62rem;
  font-weight: 600;
  color: rgba(255,255,255,.35);
  text-align: center;
  width: 42px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Track list ───────────────────────────── */
.track-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 10px;
  transition: background .15s ease;
}

.track-item:hover {
  background: rgba(255,255,255,.03);
}

.track-art {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.track-art--empty {
  background: rgba(255,255,255,.04);
}

.track-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.track-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255,255,255,.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.02em;
}

.track-artist {
  font-size: 0.68rem;
  color: rgba(255,255,255,.25);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Event badges ─────────────────────────── */
.event-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255,255,255,.04);
}

.event-badge {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  background: rgba(249,115,22,.06);
  border: 1px solid rgba(249,115,22,.1);
  color: rgba(249,115,22,.55);
  white-space: nowrap;
}

.event-badge--shared {
  background: rgba(236,72,153,.07);
  border-color: rgba(236,72,153,.14);
  color: rgba(236,72,153,.65);
}

.event-badge__you {
  font-size: 0.58rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #ec4899;
  margin-left: 4px;
}

/* ─── Actions ──────────────────────────────── */
.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2.5rem;
  padding: 1rem 0 0.4rem;
  flex-shrink: 0;
}

.act {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
  border-radius: 50%;
}

.act:disabled {
  opacity: .3;
  cursor: not-allowed;
}

.act:active:not(:disabled) {
  transform: scale(.82) !important;
}

.act--pass {
  width: 58px;
  height: 58px;
  background: rgba(239,68,68,.09);
  color: #f87171;
  border: 1.5px solid rgba(239,68,68,.22);
}

.act--pass:hover:not(:disabled) {
  background: rgba(239,68,68,.16);
  border-color: rgba(239,68,68,.38);
  transform: scale(1.08);
  box-shadow: 0 0 28px rgba(239,68,68,.2);
}

.act--like {
  width: 68px;
  height: 68px;
  background: linear-gradient(135deg, #6d28d9, #a855f7);
  color: white;
  border: none;
  box-shadow: 0 8px 28px rgba(109,40,217,.45), 0 0 0 1px rgba(167,139,250,.2);
}

.act--like:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 12px 36px rgba(109,40,217,.6), 0 0 0 1px rgba(167,139,250,.35);
}

/* ─── Match modal ──────────────────────────── */
.match-modal {
  background: #0c0a1a;
  border: 1px solid rgba(255,255,255,.08);
  border-top: 2px solid rgba(124,58,237,.5);
  border-radius: 26px;
  padding: 2.5rem 2rem 2rem;
  max-width: 380px;
  width: 100%;
  position: relative;
  overflow: hidden;
  color: #ece8ff;
}

.match-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  opacity: 0;
  animation: spark-burst 1s var(--delay) ease-out forwards;
}

.spark:nth-child(3n)   { background: #a78bfa; }
.spark:nth-child(3n+1) { background: #f472b6; }
.spark:nth-child(3n+2) { background: #34d399; }

@keyframes spark-burst {
  0%   { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(120px); opacity: 0; }
}

.match-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.match-avs {
  display: flex;
  align-items: center;
  margin-bottom: 1.2rem;
}

.match-av {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  overflow: hidden;
  border: 2.5px solid #0c0a1a;
  box-shadow: 0 0 0 1.5px rgba(124,58,237,.4);
}

.match-av img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.match-av + .match-av { margin-left: -14px; }

.match-heart {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #be185d, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  margin: 0 -11px;
  border: 2.5px solid #0c0a1a;
  box-shadow: 0 4px 20px rgba(236,72,153,.5);
  animation: heart-pop .5s .25s cubic-bezier(.34, 1.56, .64, 1) both;
}

@keyframes heart-pop {
  0%   { transform: scale(0) rotate(-15deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.match-eyebrow {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #7c3aed;
  margin-bottom: 0.3rem;
}

.match-title {
  font-family: 'Syne', sans-serif;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  margin: 0 0 0.4rem;
  background: linear-gradient(135deg, #c4b5fd, #f9a8d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.match-body {
  font-size: 0.9rem;
  color: rgba(255,255,255,.35);
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.match-btns {
  display: flex;
  gap: 0.6rem;
  width: 100%;
}

.match-ghost {
  flex: 1;
  padding: 13px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.4);
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: -0.01em;
  transition: all .18s ease;
}

.match-ghost:hover {
  background: rgba(255,255,255,.08);
  color: #c4b5fd;
}

.match-primary {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 13px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #5b21b6, #7c3aed);
  color: white;
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  letter-spacing: -0.01em;
  box-shadow: 0 6px 24px rgba(91,33,182,.45);
  transition: all .18s ease;
}

.match-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 32px rgba(91,33,182,.6);
}

/* ─── Transitions ──────────────────────────── */
.fade-scale-enter-active, .fade-scale-leave-active {
  transition: opacity .3s ease, transform .3s ease;
}
.fade-scale-enter-from, .fade-scale-leave-to {
  opacity: 0;
  transform: scale(.96) translateY(8px);
}

/* ─── Responsive ───────────────────────────── */
@media (max-width: 420px) {
  .swipe-shell { padding: 0 0.85rem; }
  .card__hero  { height: 230px; }
  .card__name  { font-size: 1.5rem; }
  .card__body  { padding: 12px 14px 14px; }
  .stack       { min-height: 500px; }
  .act--like   { width: 62px; height: 62px; }
  .act--pass   { width: 52px; height: 52px; }
  .mini-artist__circle { width: 34px; height: 34px; }
  .mini-artist__name   { width: 36px; font-size: 0.58rem; }
  .two-col { gap: 10px; }
}

@media (min-height: 800px) {
  .card__hero { height: 280px; }
  .stack      { min-height: 580px; }
}
</style>
