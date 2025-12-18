<template>
  <q-page class="swipe-page">
    <!-- Animated Background -->
    <div class="background-gradient">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <div class="swipe-container">
      <!-- Header -->
      <div class="swipe-header">
        <div class="header-content">
          <div class="logo-section">
            <q-icon name="music_note" size="32px" color="purple-5" />
            <h1 class="page-title">Discover</h1>
          </div>
        </div>
      </div>

      <!-- No More Cards Message -->
      <transition name="fade">
        <div v-if="currentCardIndex >= cards.length" class="no-cards-container">
          <div class="no-cards-content">
            <q-icon name="check_circle" size="80px" color="green-5" />
            <h2 class="no-cards-title">You're all caught up!</h2>
            <p class="no-cards-subtitle">Check back later for more matches</p>
            <q-btn
              unelevated
              color="purple-5"
              label="Back to Home"
              @click="$router.push({ name: 'Home' })"
              no-caps
              class="home-btn"
            />
          </div>
        </div>
      </transition>

      <!-- Cards Stack -->
      <div v-if="currentCardIndex < cards.length" class="cards-stack">
        <!-- Background cards for depth -->
        <div
          v-for="(card, index) in visibleCards"
          :key="card.id"
          class="profile-card"
          :class="{
            'card-active': index === 0,
            'card-next': index === 1,
            'card-behind': index === 2,
          }"
          :style="getCardStyle(index)"
        >
          <!-- Card Content -->
          <div class="card-image-container">
            <img :src="card.avatar" :alt="card.name" class="card-image" />
            <div class="card-gradient-overlay"></div>

            <!-- Match Score Badge -->
            <div class="match-badge">
              <q-icon name="auto_awesome" size="18px" />
              <span>{{ card.matchScore }}% Match</span>
            </div>
          </div>

          <!-- Card Info -->
          <div class="card-info">
            <div class="card-header">
              <div class="name-age">
                <h2 class="card-name">{{ card.name }}</h2>
                <span class="card-age">{{ card.age }}</span>
              </div>
              <div class="location">
                <q-icon name="place" size="18px" />
                <span>{{ card.distance }}</span>
              </div>
            </div>

            <div class="card-bio">
              <p>{{ card.bio }}</p>
            </div>

            <!-- Music Info -->
            <div class="music-section">
              <div class="music-header">
                <q-icon name="music_note" size="20px" color="purple-5" />
                <span class="music-title">Top Artists</span>
              </div>
              <div class="artists-chips">
                <div
                  v-for="artist in card.topArtists.slice(0, 3)"
                  :key="artist"
                  class="artist-chip-small"
                >
                  {{ artist }}
                </div>
              </div>
            </div>

            <div class="music-section">
              <div class="music-header">
                <q-icon name="category" size="20px" color="pink-5" />
                <span class="music-title">Genres</span>
              </div>
              <div class="genres-chips">
                <div
                  v-for="genre in card.genres.slice(0, 4)"
                  :key="genre"
                  class="genre-chip-small"
                >
                  {{ genre }}
                </div>
              </div>

              <!--currently playing-->

              <div
                v-if="card.currentlyPlaying?.isPlaying"
                class="music-section now-playing"
              >
                <div class="music-header">
                  <q-icon name="headphones" size="20px" color="green-5" />
                  <span class="music-title">Currently Playing</span>
                </div>

                <div class="now-playing-row">
                  <img
                    v-if="card.currentlyPlaying.track?.albumImage"
                    :src="card.currentlyPlaying.track.albumImage"
                    class="now-playing-cover"
                  />

                  <div class="now-playing-info">
                    <div class="track">
                      {{ card.currentlyPlaying.track.name }}
                    </div>
                    <div class="artist">
                      {{ card.currentlyPlaying.track.artists.join(" · ") }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div v-if="currentCardIndex < cards.length" class="action-buttons">
        <q-btn
          round
          size="xl"
          icon="close"
          color="red-5"
          class="action-btn dislike-btn"
          @click="swipeLeft"
          :disable="isAnimating"
        >
          <q-tooltip>Dislike</q-tooltip>
        </q-btn>

        <q-btn
          round
          size="xl"
          icon="favorite"
          color="green-5"
          class="action-btn like-btn"
          @click="swipeRight"
          :disable="isAnimating"
        >
          <q-tooltip>Like</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Match Modal -->
    <q-dialog v-model="showMatchModal" persistent>
      <q-card class="match-modal">
        <div class="match-animation">
          <div class="match-hearts">
            <q-icon name="favorite" class="heart heart-1" />
            <q-icon name="favorite" class="heart heart-2" />
            <q-icon name="favorite" class="heart heart-3" />
          </div>
          <h2 class="match-title">It's a Match! 🎉</h2>
          <p class="match-subtitle">
            You and {{ lastMatchedUser?.name }} both liked each other
          </p>

          <div class="match-avatars">
            <img
              :src="
                userStore.me?.avatarUrl || 'https://i.pravatar.cc/150?img=1'
              "
              class="match-avatar"
            />

            <div class="heart-connector">
              <q-icon name="favorite" size="40px" color="pink-5" />
            </div>
            <img :src="lastMatchedUser.avatar" class="match-avatar" />
          </div>

          <div class="match-actions">
            <q-btn
              outline
              color="grey-7"
              label="Keep Swiping"
              @click="closeMatchModal"
              no-caps
              class="match-btn"
            />
            <q-btn
              unelevated
              color="purple-5"
              label="Send Message"
              @click="sendMessage"
              no-caps
              class="match-btn"
            />
          </div>
        </div>
      </q-card>
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
import { currentlyPlaying } from "../../../backend/src/controller/spotifyController";

const $q = useQuasar();
const userStore = useUserStore();
const router = useRouter();
const matchesStore = useMatchesStore();

const currentCardIndex = ref(0);
const isAnimating = ref(false);
const showMatchModal = ref(false);
const lastMatchedUser = ref(null);
const currentRoomId = ref(null); // Chat-Room für das Match

const chatsStore = useChatsStore();

// Karten direkt aus den Matches
const cards = computed(() =>
  matchesStore.list.map((m, index) => ({
    id: m.id ?? m.userId ?? `match-${index}`,
    userId: m.id ?? m.userId, // wichtig für Like-Endpoint
    name: m.displayName ?? m.name ?? "Unknown",
    age: m.age ?? m.user?.age ?? 0,
    avatar:
      m.avatar ??
      m.avatar_url ??
      m.avatarUrl ??
      `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
    bio: m.bio ?? "Music lover 🎵",
    distance:
      m.distance ??
      (m.distanceKm != null ? `${m.distanceKm} km away` : "Nearby"),
    topArtists: m.topArtists ?? m.spotifyTopArtists ?? [],
    genres: m.genres ?? m.spotifyGenres ?? [],
    matchScore: m.matchScore ?? m.compatibility ?? 90,
    currentlyPlaying: m.currentlyPlaying ?? null,
  }))
);

const visibleCards = computed(() =>
  cards.value.slice(currentCardIndex.value, currentCardIndex.value + 3)
);

const getCardStyle = () => ({});

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
    // 👉 Like ans Backend schicken
    const result = await matchesStore.like(currentCard.userId);

    // Erwartetes Response-Format vom Backend:
    // { isMatch: boolean, roomId?: string }
    const isMatch = !!result?.isMatch;

    if (isMatch && result.roomId) {
      lastMatchedUser.value = currentCard;
      currentRoomId.value = result.roomId;

      // 🟣 NEU: Chat-Liste aktualisieren
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

// currentlyPlaying

onMounted(async () => {
  if (!userStore.me) {
    await userStore.fetchMe();
  }
  await matchesStore.fetchMatches();
  matchesStore.connectNowPlayingWS();
});
</script>

<style scoped lang="scss">
.swipe-page {
  min-height: 100vh;
  background: #0a0a0f;
  position: relative;
  overflow: hidden;
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

.swipe-container {
  position: relative;
  z-index: 1;
  max-width: 420px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.swipe-header {
  padding: 0.5rem 0;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin: 0;
}

.cards-stack {
  flex: 0 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 560px;
}

.profile-card {
  position: absolute;
  width: 100%;
  max-width: 380px;
  background: rgba(20, 20, 30, 0.98);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);

  &.card-active {
    z-index: 3;
    transform: scale(1) translateY(0);
    opacity: 1;
  }

  &.card-next {
    z-index: 2;
    transform: scale(0.95) translateY(10px);
    opacity: 0.5;
  }

  &.card-behind {
    z-index: 1;
    transform: scale(0.9) translateY(20px);
    opacity: 0.3;
  }
}

.card-image-container {
  position: relative;
  height: 360px;
  overflow: hidden;
  border-radius: 20px 20px 0 0;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-gradient-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(
    to top,
    rgba(20, 20, 30, 1) 0%,
    rgba(20, 20, 30, 0.6) 50%,
    transparent 100%
  );
}

.match-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
}

.swipe-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 3rem;
  font-weight: 900;
  letter-spacing: 8px;
  z-index: 10;

  &.like-overlay {
    background: rgba(34, 197, 94, 0.3);
    color: #22c55e;
    border: 4px solid #22c55e;
  }

  &.nope-overlay {
    background: rgba(239, 68, 68, 0.3);
    color: #ef4444;
    border: 4px solid #ef4444;
  }
}

.card-info {
  padding: 1.1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
}

.name-age {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.card-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1;
}

.card-age {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.location {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
}

.card-bio {
  margin-bottom: 0.9rem;

  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    line-height: 1.4;
    margin: 0;
  }
}

.music-section {
  margin-bottom: 0.9rem;

  &:last-child {
    margin-bottom: 0.5rem;
  }
}

.music-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.music-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.artists-chips,
.genres-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.artist-chip-small,
.genre-chip-small {
  padding: 0.4rem 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.75rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
  padding: 0;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.action-btn {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  width: 72px;
  height: 72px;

  &:hover:not(:disabled) {
    transform: scale(1.1);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &.dislike-btn {
    background: #ef4444 !important;

    &:hover:not(:disabled) {
      background: #dc2626 !important;
    }
  }

  &.like-btn {
    background: #22c55e !important;

    &:hover:not(:disabled) {
      background: #16a34a !important;
    }
  }
}

@media (max-width: 600px) {
  .swipe-container {
    padding: 0.75rem;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .swipe-header {
    margin-bottom: 1rem;
  }

  .cards-stack {
    height: 520px;
  }

  .profile-card {
    max-width: 100%;
    border-radius: 18px;
  }

  .card-image-container {
    height: 320px;
    border-radius: 18px 18px 0 0;
  }

  .card-info {
    padding: 1rem;
  }

  .card-name {
    font-size: 1.35rem;
  }

  .card-age {
    font-size: 1.1rem;
  }

  .location {
    font-size: 0.8rem;
  }

  .card-bio p {
    font-size: 0.85rem;
  }

  .music-title {
    font-size: 0.65rem;
  }

  .artist-chip-small,
  .genre-chip-small {
    font-size: 0.7rem;
    padding: 0.35rem 0.65rem;
  }

  .action-buttons {
    gap: 2.5rem;
  }

  .action-btn {
    width: 68px;
    height: 68px;
  }

  .match-modal {
    padding: 2rem 1.5rem;
  }

  .match-title {
    font-size: 2rem;
  }

  .match-avatar {
    width: 100px;
    height: 100px;
  }

  // currently playing
.now-playing {
  margin-top: 0.6rem;
}

.now-playing-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.now-playing-cover {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  object-fit: cover;
}

.now-playing-info .track {
  font-weight: 700;
  font-size: 0.85rem;
  color: white;
}

.now-playing-info .artist {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

}
</style>
