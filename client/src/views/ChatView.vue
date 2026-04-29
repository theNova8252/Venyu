<template>
  <q-page class="chat-page column">
    <div class="bg-mesh">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="bg-noise"></div>
    </div>

    <div class="chat-header q-pa-md">
      <div class="chat-header__top row no-wrap">
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          class="chat-header__nav-btn"
          @click="$router.back()"
        />

        <div class="chat-header__avatar-wrap q-ml-sm">
          <q-avatar size="48px" class="chat-header__avatar">
            <img v-if="otherAvatar" :src="otherAvatar" :alt="otherDisplayName" />
            <span v-else class="chat-header__initials">{{ otherInitials }}</span>
          </q-avatar>
          <div
            class="chat-header__presence-dot"
            :class="otherIsOnline ? 'online' : 'offline'"
          ></div>
        </div>

        <div class="chat-header__meta q-ml-md">
          <div class="chat-header__title-row">
            <div class="chat-header__name">{{ otherDisplayName }}</div>
            <div ref="musicMenuRef" class="chat-header__music-menu" @click.stop>
            <q-btn
              unelevated
              dense
              no-caps
              icon="music_note"
              label="Listen together"
              class="chat-header__music-btn"
              @click.stop="onToggleMusicMenu"
            />
            <div
              v-if="musicDialogOpen"
              class="music-dialog music-dialog--dropdown"
            >
                <div class="music-dialog__head">
                  <div>
                    <div class="music-dialog__eyebrow">Spotify Sync</div>
                    <div class="music-dialog__title">Listen to a song together</div>
                  </div>
                  <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    class="music-dialog__close"
                    @click="musicDialogOpen = false"
                  />
                </div>

                <div v-if="!otherIsOnline" class="music-dialog__notice">
                  Both people need to be online to listen together.
                </div>

                <q-input
                  v-model="trackSearchQuery"
                  :disable="!otherIsOnline || !isSocketOpen"
                  dense
                  outlined
                  clearable
                  placeholder="Search Spotify for a song"
                  class="music-dialog__search"
                >
                  <template #prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>

                <div v-if="trackSearchQuery.trim().length < 2" class="music-dialog__empty">
                  Enter at least 2 characters to search for songs.
                </div>

                <div v-else-if="trackSearchLoading" class="music-dialog__loading">
                  <q-spinner color="positive" size="24px" />
                  <span>Searching ...</span>
                </div>

                <div v-else-if="trackSearchResults.length" class="music-dialog__results">
                  <div
                    v-for="track in trackSearchResults"
                    :key="track.trackId"
                    class="music-dialog__result"
                  >
                    <img
                      v-if="track.albumImage"
                      :src="track.albumImage"
                      :alt="track.name"
                      class="music-dialog__cover"
                    />
                    <div v-else class="music-dialog__cover music-dialog__cover--placeholder">
                      <q-icon name="music_note" size="22px" />
                    </div>

                    <div class="music-dialog__result-body">
                      <div class="music-dialog__result-title">{{ track.name }}</div>
                      <div class="music-dialog__result-artist">
                        {{ Array.isArray(track.artists) ? track.artists.join(", ") : "" }}
                      </div>
                    </div>

                    <q-btn
                      unelevated
                      no-caps
                      color="positive"
                      :disable="!otherIsOnline || !isSocketOpen"
                      label="Select"
                      class="music-dialog__select-btn"
                      @click="selectTrack(track)"
                    />
                  </div>
                </div>

                <div v-else class="music-dialog__empty">
                  No songs found.
                </div>
            </div>
            </div>
          </div>

          <div class="chat-header__presence" :class="{ 'is-online': otherIsOnline }">
            {{ otherIsOnline ? "Online" : "Offline" }}
          </div>
          <div v-if="otherTyping" class="chat-header__typing">Typing ...</div>

          <div v-if="songState?.trackUri" class="chat-player">
            <div class="chat-player__main">
              <div class="chat-player__cover-wrap">
                <img
                  v-if="songState.albumImage"
                  :src="songState.albumImage"
                  :alt="songState.trackName || 'Song cover'"
                  class="chat-player__cover"
                />
                <div v-else class="chat-player__cover chat-player__cover--placeholder">
                  <q-icon name="music_note" size="18px" />
                </div>
              </div>

              <div class="chat-player__body">
                <div class="chat-player__topline">
                  <div class="chat-player__title">
                    {{ songState.trackName || "Unknown song" }}
                  </div>
                  <span class="chat-player__status">{{ songStatusLabel }}</span>
                </div>
                <div class="chat-player__artists">
                  {{ songArtistsLabel }}
                </div>
                <div class="chat-player__time">
                  {{ formatDuration(displaySongPositionMs) }}
                  /
                  {{ formatDuration(songState.durationMs) }}
                </div>
                <q-slider
                  v-if="songState.durationMs > 0"
                  :model-value="displaySongPositionMs"
                  :min="0"
                  :max="songState.durationMs"
                  :step="1000"
                  :disable="!otherIsOnline || !isSocketOpen"
                  color="positive"
                  track-color="grey-4"
                  thumb-color="positive"
                  class="chat-player__slider"
                  @update:model-value="onSeekPreview"
                  @change="onSeekCommit"
                />
              </div>

              <div class="chat-player__actions">
                <q-btn
                  round
                  unelevated
                  size="sm"
                  class="chat-player__action-btn"
                  :icon="songState.isPlaying ? 'pause' : 'play_arrow'"
                  :disable="!isSocketOpen"
                  @click="onToggleSongPlayback"
                />
              </div>
            </div>

            <div v-if="playbackError" class="chat-player__warning">
              {{ playbackError }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-separator class="chat-separator" />

    <div ref="messagesContainer" class="chat-messages col scroll q-pa-md">
      <div v-if="hasUnreadableMessages" class="chat-system-note">
        Older messages from this chat cannot be decrypted in a new or incognito browser.
        New messages will appear normally.
      </div>

      <div
        v-for="m in messages"
        :key="m.id"
        class="chat-message q-mb-sm"
        :class="{ 'self-message': m.isMine, 'other-message': !m.isMine }"
      >
        <div class="bubble">
          <div class="text-body2">{{ m.text }}</div>
          <div class="chat-message__meta q-mt-xs">
            {{ formatTime(m.createdAt) }}
            <span v-if="m.isMine" class="q-ml-sm">
              <span v-if="m.readByOther">✓✓</span>
              <span v-else>✓</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="loading" class="chat-message__loading">Loading ...</div>
    </div>

    <div class="chat-input row items-end q-pa-sm">
      <q-input
        v-model="draft"
        class="chat-input__field col q-mr-sm"
        rounded
        outlined
        dense
        placeholder="Write a message ..."
        :disable="sending"
        @keydown.enter.prevent="onSend"
        @update:model-value="onTyping"
      />

      <q-btn
        round
        unelevated
        icon="send"
        class="chat-input__send-btn"
        :loading="sending"
        :disable="!draft.trim()"
        @click="onSend"
      />
    </div>

    <q-dialog v-if="false" v-model="musicDialogOpen" position="top">
      <q-card class="music-dialog">
        <div class="music-dialog__head">
          <div>
            <div class="music-dialog__eyebrow">Spotify Sync</div>
            <div class="music-dialog__title">Listen to a song together</div>
          </div>
          <q-btn flat round dense icon="close" class="music-dialog__close" v-close-popup />
        </div>

        <q-input
          v-model="trackSearchQuery"
          dense
          outlined
          clearable
          placeholder="Search Spotify for a song"
          class="music-dialog__search"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <div v-if="trackSearchQuery.trim().length < 2" class="music-dialog__empty">
          Enter at least 2 characters to search for songs.
        </div>

        <div v-else-if="trackSearchLoading" class="music-dialog__loading">
          <q-spinner color="positive" size="24px" />
          <span>Searching ...</span>
        </div>

        <div v-else-if="trackSearchResults.length" class="music-dialog__results">
          <div
            v-for="track in trackSearchResults"
            :key="track.trackId"
            class="music-dialog__result"
          >
            <img
              v-if="track.albumImage"
              :src="track.albumImage"
              :alt="track.name"
              class="music-dialog__cover"
            />
            <div v-else class="music-dialog__cover music-dialog__cover--placeholder">
              <q-icon name="music_note" size="22px" />
            </div>

            <div class="music-dialog__result-body">
              <div class="music-dialog__result-title">{{ track.name }}</div>
              <div class="music-dialog__result-artist">
                {{ Array.isArray(track.artists) ? track.artists.join(", ") : "" }}
              </div>
            </div>

            <q-btn
              unelevated
              no-caps
              color="positive"
              label="Select"
              class="music-dialog__select-btn"
              @click="selectTrack(track)"
            />
          </div>
        </div>

        <div v-else class="music-dialog__empty">
          No songs found.
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";
import { useChatsStore } from "@/stores/chats";
import { usePresenceStore } from "@/stores/active";

import {
  decryptText,
  deriveAesKey,
  encryptText,
  exportPublicJwk,
  getOrCreateIdentity,
  importRemotePublicJwk,
} from "@/api/e2ee";

const PLAYBACK_REQUIRED_MESSAGE = "Spotify Premium or an active Spotify device is required.";

const BOTH_ONLINE_MESSAGE = "Both people need to be online to listen together.";
const SHARED_PLAYBACK_REQUIRED_MESSAGE = "Spotify Premium and the Venyu web player in this browser are required.";
const UNREADABLE_MESSAGE_FALLBACK = "Encrypted message unavailable.";

const route = useRoute();
const $q = useQuasar();
const chatStore = useChatStore();
const chatsStore = useChatsStore();
const authStore = useAuthStore();
const presenceStore = usePresenceStore();

const roomId = computed(() => String(route.params.roomId || ""));
const participantIds = computed(() =>
  String(roomId.value)
    .split("__")
    .map((part) => part.trim())
    .filter(Boolean)
);

const messages = computed(() => chatStore.messages(roomId.value));
const loading = computed(() => chatStore.loading);
const currentUserId = computed(() => authStore.user?.id ?? null);

const currentChat = computed(() =>
  chatsStore.list.find((chat) => String(chat.roomId) === String(roomId.value)) || null
);

const otherUserId = computed(() => {
  const me = currentUserId.value ? String(currentUserId.value) : null;
  return participantIds.value.find((id) => id !== me) || null;
});

const otherIsOnline = computed(() =>
  otherUserId.value ? presenceStore.isOnline(otherUserId.value) : false
);

const otherDisplayName = computed(() => currentChat.value?.user?.name || "Chat");
const otherAvatar = computed(() => currentChat.value?.user?.avatar || null);
const otherInitials = computed(() => {
  const source = otherDisplayName.value || "Chat";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
});

const draft = ref("");
const sending = ref(false);
const otherTyping = ref(false);

const musicDialogOpen = ref(false);
const trackSearchQuery = ref("");
const trackSearchResults = ref([]);
const trackSearchLoading = ref(false);
const playbackError = ref("");

const songState = ref(null);
const readyUserIds = ref([]);
const seekPreviewMs = ref(null);
const serverClockOffsetMs = ref(0);
const playerNowMs = ref(Date.now());
const messagesContainer = ref(null);
const musicMenuRef = ref(null);
const socketConnected = ref(false);
const e2eeReady = ref(false);
const spotifyPlayerDeviceId = ref("");
const spotifyPlayerReady = ref(false);

const isSocketOpen = computed(() => socketConnected.value);
const hasUnreadableMessages = computed(() =>
  messages.value.some((message) =>
    message?._decrypted === false
    && Boolean(message?.ciphertext)
  )
);
const songArtistsLabel = computed(() =>
  Array.isArray(songState.value?.artists) && songState.value.artists.length
    ? songState.value.artists.join(", ")
    : "Unknown artist"
);

const countdownSeconds = computed(() => {
  if (!songState.value?.isPlaying || !songState.value?.startedAtServerTime) return 0;
  const adjustedNow = playerNowMs.value + serverClockOffsetMs.value;
  const diff = Number(songState.value.startedAtServerTime) - adjustedNow;
  return diff > 0 ? Math.ceil(diff / 1000) : 0;
});

const currentSongPositionMs = computed(() => getSongPosition(songState.value, playerNowMs.value));
const displaySongPositionMs = computed(() => seekPreviewMs.value ?? currentSongPositionMs.value);
const songProgressRatio = computed(() => {
  const durationMs = Number(songState.value?.durationMs) || 0;
  if (!durationMs) return 0;
  return Math.min(1, displaySongPositionMs.value / durationMs);
});

const songStatusLabel = computed(() => {
  if (!songState.value?.trackUri) return "";
  if (countdownSeconds.value > 0) return `Starting in ${countdownSeconds.value} ...`;
  if (songState.value.isPlaying) return "Synced";
  if (readyUserIds.value.length < participantIds.value.length) return "Waiting for the other person";
  return "Ready";
});

let socket = null;
let myKeyPair = null;
let aesKey = null;
let typingTimer = null;
let playbackTimer = null;
let progressTicker = null;
let searchTimer = null;
let latestSearchToken = 0;
let lastAutoReadyKey = "";
let spotifyPlayer = null;
let spotifySdkPromise = null;
let spotifyPlayerInitPromise = null;
let spotifyPlayerActivated = false;

function getServerAdjustedNow() {
  return Date.now() + serverClockOffsetMs.value;
}

function normalizeSongState(rawState) {
  if (!rawState || typeof rawState !== "object" || !rawState.trackUri) return null;

  return {
    chatId: rawState.chatId || roomId.value,
    trackUri: String(rawState.trackUri),
    trackName: rawState.trackName || "",
    artists: Array.isArray(rawState.artists) ? rawState.artists.filter(Boolean) : [],
    albumImage: rawState.albumImage || null,
    durationMs: Math.max(0, Number(rawState.durationMs) || 0),
    isPlaying: Boolean(rawState.isPlaying),
    startedAtServerTime:
      rawState.startedAtServerTime == null ? null : Number(rawState.startedAtServerTime),
    positionMs: Math.max(0, Number(rawState.positionMs) || 0),
    selectedByUserId: rawState.selectedByUserId ? String(rawState.selectedByUserId) : null,
  };
}

function clampSongPosition(state, positionMs) {
  if (!state) return 0;
  const safe = Math.max(0, Number(positionMs) || 0);
  return state.durationMs > 0 ? Math.min(safe, state.durationMs) : safe;
}

function getSongPosition(state, atClientNow = Date.now()) {
  if (!state) return 0;

  const basePosition = clampSongPosition(state, state.positionMs);
  if (!state.isPlaying || !state.startedAtServerTime) {
    return basePosition;
  }

  const adjustedNow = atClientNow + serverClockOffsetMs.value;
  const deltaMs = Math.max(0, adjustedNow - Number(state.startedAtServerTime));
  return clampSongPosition(state, basePosition + deltaMs);
}

function formatTime(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function scrollToBottom() {
  nextTick(() => {
    const element = messagesContainer.value;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  });
}

function notifyError(message) {
  $q.notify({
    color: "negative",
    textColor: "white",
    message,
    position: "top",
  });
}

function ensureBothOnlineForMusic({ closeMenu = true } = {}) {
  if (otherIsOnline.value) return true;

  if (closeMenu) {
    musicDialogOpen.value = false;
  }

  notifyError(BOTH_ONLINE_MESSAGE);
  return false;
}

function ensureMusicSocketReady() {
  if (isSocketOpen.value) return true;
  notifyError("The chat connection is still being established. Please try again in a moment.");
  return false;
}

async function fetchSpotifyPlayerAccessToken() {
  try {
    const data = await api.getSpotifyPlayerToken();
    return typeof data?.accessToken === "string" ? data.accessToken : "";
  } catch {
    try {
      await api.refreshSpotifyAuth();
      const refreshed = await api.getSpotifyPlayerToken();
      return typeof refreshed?.accessToken === "string" ? refreshed.accessToken : "";
    } catch {
      return "";
    }
  }
}

function loadSpotifyWebPlaybackSdk() {
  if (window.Spotify?.Player) {
    return Promise.resolve(window.Spotify);
  }

  if (spotifySdkPromise) {
    return spotifySdkPromise;
  }

  spotifySdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-spotify-sdk="1"]');

    const onReady = () => {
      if (window.Spotify?.Player) {
        resolve(window.Spotify);
        return;
      }
      reject(new Error("spotify_sdk_unavailable"));
    };

    window.onSpotifyWebPlaybackSDKReady = onReady;

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.dataset.spotifySdk = "1";
    script.onerror = () => reject(new Error("spotify_sdk_load_failed"));
    document.head.appendChild(script);
  });

  return spotifySdkPromise;
}

async function activateSpotifyPlayerElement() {
  if (!spotifyPlayer || spotifyPlayerActivated) return;

  try {
    await spotifyPlayer.activateElement();
    spotifyPlayerActivated = true;
  } catch {
    // user gesture may still be required later
  }
}

async function ensureSpotifyWebPlayerReady() {
  if (spotifyPlayer && spotifyPlayerReady.value && spotifyPlayerDeviceId.value) {
    return true;
  }

  if (spotifyPlayerInitPromise) {
    return spotifyPlayerInitPromise;
  }

  spotifyPlayerInitPromise = (async () => {
    try {
      const initialToken = await fetchSpotifyPlayerAccessToken();
      if (!initialToken) {
        throw new Error(SHARED_PLAYBACK_REQUIRED_MESSAGE);
      }

      await loadSpotifyWebPlaybackSdk();

      if (!spotifyPlayer) {
        spotifyPlayer = new window.Spotify.Player({
          name: "Venyu Shared Listening",
          volume: 0.85,
          getOAuthToken: async (callback) => {
            const token = await fetchSpotifyPlayerAccessToken();
            if (!token) {
              playbackError.value = SHARED_PLAYBACK_REQUIRED_MESSAGE;
              return;
            }
            callback(token);
          },
        });

        spotifyPlayer.addListener("ready", ({ device_id: deviceId }) => {
          spotifyPlayerDeviceId.value = deviceId || "";
          spotifyPlayerReady.value = Boolean(deviceId);
        });

        spotifyPlayer.addListener("not_ready", ({ device_id: deviceId }) => {
          if (!deviceId || spotifyPlayerDeviceId.value === deviceId) {
            spotifyPlayerReady.value = false;
          }
        });

        ["initialization_error", "authentication_error", "account_error", "playback_error"].forEach((eventName) => {
          spotifyPlayer.addListener(eventName, ({ message }) => {
            playbackError.value = message || SHARED_PLAYBACK_REQUIRED_MESSAGE;
          });
        });
      }

      const connected = await spotifyPlayer.connect();
      if (!connected && !spotifyPlayerReady.value) {
        throw new Error(SHARED_PLAYBACK_REQUIRED_MESSAGE);
      }

      await activateSpotifyPlayerElement();

      if (!spotifyPlayerDeviceId.value) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 500);
        });
      }

      if (!spotifyPlayerDeviceId.value) {
        throw new Error(SHARED_PLAYBACK_REQUIRED_MESSAGE);
      }

      playbackError.value = "";
      return true;
    } catch (error) {
      playbackError.value = extractPlaybackErrorMessage(error);
      return false;
    } finally {
      spotifyPlayerInitPromise = null;
    }
  })();

  return spotifyPlayerInitPromise;
}

function onToggleMusicMenu() {
  if (musicDialogOpen.value) {
    musicDialogOpen.value = false;
    return;
  }

  void activateSpotifyPlayerElement();
  musicDialogOpen.value = true;
}

function handleDocumentPointerDown(event) {
  void activateSpotifyPlayerElement();
  if (!musicDialogOpen.value) return;
  const root = musicMenuRef.value;
  if (!root || root.contains(event.target)) return;
  musicDialogOpen.value = false;
}

function extractPlaybackErrorMessage(error) {
  const raw = typeof error?.message === "string" ? error.message : String(error || "");

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.hint) return parsed.hint;
    if (parsed?.message) return parsed.message;
    if (parsed?.error === "no_device_available") return SHARED_PLAYBACK_REQUIRED_MESSAGE;
  } catch {
    // ignore
  }

  if (
    raw.includes("no_device_available")
    || raw.includes("403")
    || raw.includes("Premium")
    || raw.includes("account_error")
  ) {
    return SHARED_PLAYBACK_REQUIRED_MESSAGE;
  }

  return raw || SHARED_PLAYBACK_REQUIRED_MESSAGE;
}

function clearPlaybackTimer() {
  if (playbackTimer) {
    window.clearTimeout(playbackTimer);
    playbackTimer = null;
  }
}

async function pauseLocalPlayback({ silent = false } = {}) {
  clearPlaybackTimer();

  try {
    if (spotifyPlayerDeviceId.value) {
      await api.pauseSpotifyTrack(spotifyPlayerDeviceId.value);
    }
    if (!silent) playbackError.value = "";
  } catch (error) {
    if (silent) return;
    playbackError.value = extractPlaybackErrorMessage(error);
  }
}

async function startLocalPlayback(state) {
  if (!state?.trackUri) return;

  const adjustedNow = getServerAdjustedNow();
  const targetPosition =
    state.startedAtServerTime && Number(state.startedAtServerTime) > adjustedNow
      ? clampSongPosition(state, state.positionMs)
      : getSongPosition(state);

  try {
    const playerReady = await ensureSpotifyWebPlayerReady();
    if (!playerReady || !spotifyPlayerDeviceId.value) {
      throw new Error(SHARED_PLAYBACK_REQUIRED_MESSAGE);
    }

    await api.playSpotifyTrack(state.trackUri, targetPosition, spotifyPlayerDeviceId.value);
    playbackError.value = "";
  } catch (error) {
    playbackError.value = extractPlaybackErrorMessage(error);
  }
}

function schedulePlaybackFromState(state) {
  clearPlaybackTimer();
  if (!state?.trackUri || !state.isPlaying || !state.startedAtServerTime) return;

  const adjustedNow = getServerAdjustedNow();
  const delayMs = Math.max(0, Number(state.startedAtServerTime) - adjustedNow);
  const expectedTrackUri = state.trackUri;
  const expectedStart = Number(state.startedAtServerTime);

  playbackTimer = window.setTimeout(async () => {
    const currentState = songState.value;
    if (
      !currentState
      || currentState.trackUri !== expectedTrackUri
      || Number(currentState.startedAtServerTime) !== expectedStart
      || !currentState.isPlaying
    ) {
      return;
    }

    await startLocalPlayback(currentState);
  }, delayMs);
}

function sendSocketMessage(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(payload));
  return true;
}

function updateServerClockOffset(serverNow) {
  const numericServerNow = Number(serverNow);
  if (!Number.isFinite(numericServerNow)) return;
  serverClockOffsetMs.value = numericServerNow - Date.now();
}

function maybeAutoReady(nextState) {
  if (
    !nextState?.trackUri
    || !otherIsOnline.value
    || nextState.isPlaying
    || nextState.startedAtServerTime
    || Number(nextState.positionMs) !== 0
    || readyUserIds.value.includes(String(currentUserId.value))
    || readyUserIds.value.length >= participantIds.value.length
  ) {
    return;
  }

  const autoReadyKey = [roomId.value, nextState.trackUri, nextState.selectedByUserId, nextState.positionMs].join(":");
  if (lastAutoReadyKey === autoReadyKey) return;

  lastAutoReadyKey = autoReadyKey;
  window.setTimeout(async () => {
    const playerReady = await ensureSpotifyWebPlayerReady();
    if (!playerReady) return;

    sendSocketMessage({
      type: "song:ready",
      trackUri: nextState.trackUri,
    });
  }, 120);
}

async function applySongPayload(data) {
  updateServerClockOffset(data.serverNow);

  const previousState = songState.value;
  const nextState = normalizeSongState(data.state);

  readyUserIds.value = Array.isArray(data.readyUserIds)
    ? data.readyUserIds.map((userId) => String(userId))
    : [];
  seekPreviewMs.value = null;
  songState.value = nextState;

  if (!nextState) {
    clearPlaybackTimer();
    return;
  }

  if (data.type === "song:select") {
    await pauseLocalPlayback({ silent: true });
  } else if (data.type === "song:pause") {
    await pauseLocalPlayback();
  } else if (data.type === "song:sync" && previousState?.isPlaying && !nextState.isPlaying) {
    await pauseLocalPlayback({ silent: true });
  }

  if (nextState.isPlaying) {
    schedulePlaybackFromState(nextState);
  } else {
    clearPlaybackTimer();
  }

  maybeAutoReady(nextState);
}

function applyMessageTextFallback(message, fallback = UNREADABLE_MESSAGE_FALLBACK) {
  if (!message) return;
  if (typeof message.text === "string" && message.text.trim()) {
    message._decrypted = true;
    return;
  }

  message.text = fallback;
  message._decrypted = false;
}

async function decryptAllLoadedMessages() {
  const loadedMessages = chatStore.messages(roomId.value);
  for (const message of loadedMessages) {
    message.isMine = String(message.senderId) === String(currentUserId.value);

    if (message.isMine) {
      message.readByOther = !!message.readAt;
    }

    if (message.ciphertext && message.iv && aesKey) {
      if (message._decrypted === true) continue;

      try {
        message.text = await decryptText(aesKey, message.ciphertext, message.iv);
        message._decrypted = true;
        continue;
      } catch {
        applyMessageTextFallback(message);
        continue;
      }
    }

    if (message.ciphertext && message.iv && !e2eeReady.value) {
      message.text = "";
      message._decrypted = null;
      continue;
    }

    applyMessageTextFallback(message);
  }
}

async function fetchMessages() {
  await chatStore.fetchMessages(roomId.value, currentUserId.value);
  await decryptAllLoadedMessages();
  sendReadUpToLastForeignMessage();
  scrollToBottom();
}

async function ensureChatMetaLoaded() {
  if (chatsStore.list.length && currentChat.value) return;

  try {
    await chatsStore.fetchChats();
  } catch {
    // ignore
  }
}

async function ensureE2eeKeyReadyViaRest() {
  if (!currentUserId.value) return false;

  if (!myKeyPair) myKeyPair = await getOrCreateIdentity(currentUserId.value);

  try {
    const publicKeyJwk = await exportPublicJwk(myKeyPair);
    await api.upsertMyPublicKey(publicKeyJwk);
  } catch {
    // Keep going: the peer key may still be available, and websocket key exchange can recover.
  }

  try {
    const data = await api.getPeerPublicKey(roomId.value);
    if (data?.publicKeyJwk) {
      const theirPublicKey = await importRemotePublicJwk(data.publicKeyJwk);
      aesKey = await deriveAesKey(myKeyPair, theirPublicKey);
      e2eeReady.value = true;
      await decryptAllLoadedMessages();
      return true;
    }
  } catch {
    // ignore
  }

  e2eeReady.value = Boolean(aesKey);
  return e2eeReady.value;
}

async function sendMyPublicKeyWs() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  if (!myKeyPair) myKeyPair = await getOrCreateIdentity(currentUserId.value);

  const publicKeyJwk = await exportPublicJwk(myKeyPair);
  socket.send(JSON.stringify({ type: "key_exchange", publicKeyJwk }));
}

function connectChatWebSocket() {
  socketConnected.value = false;
  if (socket) socket.close();

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const host = import.meta.env.DEV ? "127.0.0.1:5000" : window.location.host;
  socket = new WebSocket(`${protocol}://${host}/ws/chat?roomId=${encodeURIComponent(roomId.value)}`);

  socket.onopen = async () => {
    socketConnected.value = true;
    if (!myKeyPair) myKeyPair = await getOrCreateIdentity(currentUserId.value);
    await sendMyPublicKeyWs();
    sendReadUpToLastForeignMessage();
    sendSocketMessage({ type: "song:sync" });
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "song:error") {
        await applySongPayload({ ...data, type: "song:sync" });
        if (typeof data.message === "string" && data.message.trim()) {
          notifyError(data.message);
        }
        return;
      }

      if (typeof data.type === "string" && data.type.startsWith("song:")) {
        await applySongPayload(data);
        return;
      }

      if (data.type === "key_exchange") {
        const theirPublicKey = await importRemotePublicJwk(data.publicKeyJwk);
        aesKey = await deriveAesKey(myKeyPair, theirPublicKey);
        e2eeReady.value = true;
        await decryptAllLoadedMessages();
        return;
      }

      if (data.type === "typing") {
        if (String(data.fromUserId) === String(otherUserId.value)) {
          otherTyping.value = !!data.isTyping;
        }
        return;
      }

      if (data.type === "read") {
        chatStore.markReadUpTo(roomId.value, data.lastReadMessageId, currentUserId.value);
        return;
      }

      if (data.type === "chat_message") {
        const message = data.message;

        message.isMine = String(message.senderId) === String(currentUserId.value);
        message.readByOther = message.isMine ? !!message.readAt : false;

        if (aesKey && message.ciphertext && message.iv) {
          try {
            message.text = await decryptText(aesKey, message.ciphertext, message.iv);
            message._decrypted = true;
          } catch {
            applyMessageTextFallback(message);
          }
        } else if (message.ciphertext && message.iv && !e2eeReady.value) {
          message.text = "";
          message._decrypted = null;
        } else {
          applyMessageTextFallback(message);
        }

        chatStore.addMessage(roomId.value, message, currentUserId.value);
        scrollToBottom();

        if (!message.isMine) {
          sendRead(message.id);
        }
      }
    } catch (error) {
      console.error("WS parse error", error);
    }
  };

  socket.onclose = () => {
    socketConnected.value = false;
    console.log("WS closed");
  };

  socket.onerror = (error) => {
    socketConnected.value = false;
    console.error("WS error", error);
  };
}

function sendRead(messageId) {
  if (!messageId) return;
  sendSocketMessage({ type: "read", lastReadMessageId: String(messageId) });
}

function sendReadUpToLastForeignMessage() {
  const loadedMessages = chatStore.messages(roomId.value);
  if (!loadedMessages?.length) return;

  const lastForeignMessage = [...loadedMessages]
    .reverse()
    .find((message) => String(message.senderId) !== String(currentUserId.value));

  if (!lastForeignMessage) return;
  sendRead(lastForeignMessage.id);
}

function onTyping() {
  if (!isSocketOpen.value) return;

  sendSocketMessage({ type: "typing", isTyping: true });
  window.clearTimeout(typingTimer);
  typingTimer = window.setTimeout(() => {
    sendSocketMessage({ type: "typing", isTyping: false });
  }, 700);
}

async function onSend() {
  if (sending.value) return;

  const text = draft.value.trim();
  if (!text || !isSocketOpen.value) return;

  if (!aesKey) {
    await ensureE2eeKeyReadyViaRest();
    if (!aesKey) {
      await sendMyPublicKeyWs();
    }
  }

  if (!aesKey) {
    notifyError("Secure chat is still being prepared. Please try again in a moment.");
    return;
  }

  sending.value = true;
  try {
    const encrypted = await encryptText(aesKey, text);

    sendSocketMessage({
      type: "chat_message",
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      version: "aes-gcm-v1",
    });
    draft.value = "";
    sendSocketMessage({ type: "typing", isTyping: false });
  } finally {
    sending.value = false;
  }
}

function onSeekPreview(value) {
  seekPreviewMs.value = Math.max(0, Number(value) || 0);
}

async function onSeekCommit(value) {
  const targetPositionMs = Math.max(0, Number(value) || 0);
  seekPreviewMs.value = null;

  if (!songState.value?.trackUri) return;
  if (!ensureMusicSocketReady()) return;
  if (!ensureBothOnlineForMusic({ closeMenu: false })) return;
  if (!(await ensureSpotifyWebPlayerReady())) return;

  sendSocketMessage({
    type: "song:seek",
    positionMs: targetPositionMs,
    isPlaying: Boolean(songState.value.isPlaying),
  });
}

async function onToggleSongPlayback() {
  if (!songState.value?.trackUri) return;
  if (!ensureMusicSocketReady()) return;

  if (songState.value.isPlaying) {
    sendSocketMessage({
      type: "song:pause",
      positionMs: currentSongPositionMs.value,
    });
    return;
  }

  if (!ensureBothOnlineForMusic({ closeMenu: false })) return;

  if (!(await ensureSpotifyWebPlayerReady())) return;

  if (
    Number(songState.value.positionMs) === 0
    && !songState.value.startedAtServerTime
    && readyUserIds.value.length < participantIds.value.length
  ) {
    sendSocketMessage({
      type: "song:ready",
      trackUri: songState.value.trackUri,
    });
    return;
  }

  sendSocketMessage({
    type: "song:resume",
    positionMs: currentSongPositionMs.value,
  });
}

async function runTrackSearch(query) {
  const searchToken = ++latestSearchToken;
  trackSearchLoading.value = true;

  try {
    const results = await api.searchSpotifyTracks(query, 8);
    if (searchToken !== latestSearchToken) return;
    trackSearchResults.value = Array.isArray(results) ? results : [];
  } catch (error) {
    if (searchToken !== latestSearchToken) return;
    trackSearchResults.value = [];
    notifyError("Spotify search could not be loaded.");
  } finally {
    if (searchToken === latestSearchToken) {
      trackSearchLoading.value = false;
    }
  }
}

async function selectTrack(track) {
  if (!ensureMusicSocketReady()) return;
  if (!ensureBothOnlineForMusic({ closeMenu: true })) return;
  if (!(await ensureSpotifyWebPlayerReady())) return;
  playbackError.value = "";
  musicDialogOpen.value = false;
  sendSocketMessage({
    type: "song:select",
    trackUri: track.uri,
    trackName: track.name,
    artists: Array.isArray(track.artists) ? track.artists : [],
    albumImage: track.albumImage || null,
    durationMs: Number(track.durationMs) || 0,
  });
}

watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  }
);

watch(
  trackSearchQuery,
  (value) => {
    window.clearTimeout(searchTimer);
    latestSearchToken += 1;

    const normalized = String(value || "").trim();
    if (normalized.length < 2) {
      trackSearchResults.value = [];
      trackSearchLoading.value = false;
      return;
    }

    searchTimer = window.setTimeout(() => {
      void runTrackSearch(normalized);
    }, 250);
  }
);

watch(otherIsOnline, (isOnline, wasOnline) => {
  if (isOnline || wasOnline == null) return;
  musicDialogOpen.value = false;
});

watch(
  roomId,
  async () => {
    draft.value = "";
    otherTyping.value = false;
    musicDialogOpen.value = false;
    trackSearchQuery.value = "";
    trackSearchResults.value = [];
    playbackError.value = "";
    songState.value = null;
    readyUserIds.value = [];
    seekPreviewMs.value = null;
    lastAutoReadyKey = "";
    socketConnected.value = false;
    aesKey = null;
    e2eeReady.value = false;
    clearPlaybackTimer();

    await ensureChatMetaLoaded();
    await ensureE2eeKeyReadyViaRest();
    await fetchMessages();
    connectChatWebSocket();
  }
);

onMounted(async () => {
  await authStore.fetchMe();
  presenceStore.connect();
  document.addEventListener("pointerdown", handleDocumentPointerDown);

  progressTicker = window.setInterval(() => {
    playerNowMs.value = Date.now();
  }, 250);

  await ensureChatMetaLoaded();
  await ensureE2eeKeyReadyViaRest();
  await fetchMessages();
  connectChatWebSocket();
});

onUnmounted(() => {
  clearPlaybackTimer();
  socketConnected.value = false;
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  if (socket) socket.close();
  if (spotifyPlayer) {
    try {
      spotifyPlayer.disconnect();
    } catch {
      // ignore
    }
    spotifyPlayer = null;
  }
  spotifyPlayerReady.value = false;
  spotifyPlayerDeviceId.value = "";
  window.clearTimeout(typingTimer);
  window.clearTimeout(searchTimer);
  if (progressTicker) {
    window.clearInterval(progressTicker);
    progressTicker = null;
  }
});
</script>

<style scoped lang="scss">
/* ─── Foundations ─────────────────────────────────────── */
.chat-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e4e4e7;
  position: relative;
  overflow-x: hidden;
}

/* ─── Background mesh ─────────────────────────────────── */
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
  opacity: 0.22;
}

.orb-1 {
  width: 460px;
  height: 460px;
  right: -90px;
  top: -100px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
}

.orb-2 {
  width: 380px;
  height: 380px;
  left: -70px;
  bottom: -80px;
  background: linear-gradient(135deg, #ec4899, #f43f5e);
}

.bg-noise {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* ─── Liquid glass ────────────────────────────────────── */
%liquid-glass {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
}

/* ─── Header ──────────────────────────────────────────── */
.chat-header {
  position: relative;
  z-index: 2;
  background: rgba(10, 10, 15, 0.55);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(28px) saturate(1.3);
  -webkit-backdrop-filter: blur(28px) saturate(1.3);
}

.chat-header__top {
  gap: 0.25rem;
  align-items: center;
}

.chat-header__nav-btn {
  color: rgba(255, 255, 255, 0.75);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  transition: background 0.18s ease, color 0.18s ease;
}

.chat-header__nav-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.chat-header__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.chat-header__avatar {
  border: 2px solid rgba(139, 92, 246, 0.28);
  box-shadow: 0 0 18px rgba(139, 92, 246, 0.18);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(236, 72, 153, 0.18));
}

.chat-header__initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
}

.chat-header__presence-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #0a0a0f;

  &.online {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.55);
  }

  &.offline {
    background: rgba(255, 255, 255, 0.22);
  }
}

.chat-header__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(200px, 260px) auto;
  grid-template-rows: auto auto auto;
  gap: 0.08rem 0.6rem;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
  overflow: visible;
}

.chat-header__title-row {
  display: contents;
}

.chat-header__name {
  grid-column: 1;
  grid-row: 1;
  margin-top: 0.18rem;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.2;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.78) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chat-header__music-menu {
  grid-column: 3;
  grid-row: 1 / span 3;
  flex: 0 0 auto;
  position: relative;
  justify-self: end;
  align-self: center;
}

.chat-header__music-btn {
  background: rgba(30, 215, 96, 0.12);
  color: #4ade80;
  border: 1px solid rgba(30, 215, 96, 0.28);
  border-radius: 999px;
  min-height: 36px;
  height: 36px;
  padding: 0 0.85rem;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 22px rgba(30, 215, 96, 0.16);
  transition: background 0.18s ease, transform 0.18s ease;
}

.chat-header__music-btn:hover {
  background: rgba(30, 215, 96, 0.18);
  transform: translateY(-1px);
}

.chat-header__music-btn :deep(.q-btn__content) {
  gap: 0.35rem;
}

.chat-header__presence,
.chat-header__typing {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.78rem;
  font-weight: 600;
}

.chat-header__presence {
  grid-column: 1;
  grid-row: 2;
}

.chat-header__typing {
  grid-column: 1;
  grid-row: 3;
  color: rgba(167, 139, 250, 0.85);
  font-style: italic;
}

.chat-header__presence.is-online {
  color: #22c55e;
}

/* ─── Inline player ───────────────────────────────────── */
.chat-player {
  grid-column: 2;
  grid-row: 1 / span 3;
  justify-self: center;
  align-self: center;
  @extend %liquid-glass;
  border-radius: 14px;
  padding: 0.4rem 0.55rem;
  width: min(100%, 250px);
  max-width: 250px;
  border-color: rgba(30, 215, 96, 0.18);
  background:
    linear-gradient(135deg, rgba(30, 215, 96, 0.06), rgba(255, 255, 255, 0.03));
}

.chat-player__main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.45rem;
  align-items: center;
}

.chat-player__cover {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border-radius: 9px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
}

.chat-player__cover--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 215, 96, 0.16);
  color: #4ade80;
}

.chat-player__body {
  min-width: 0;
}

.chat-player__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.chat-player__title {
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-player__artists {
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-player__status {
  color: #4ade80;
  font-weight: 700;
  font-size: 0.58rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.chat-player__time {
  color: rgba(255, 255, 255, 0.35);
  font-size: 0.6rem;
}

.chat-player__slider {
  margin-top: -0.4rem;
  margin-bottom: -0.7rem;
  color: #fff;
}

.chat-player__action-btn {
  background: linear-gradient(135deg, #1ed760, #16a34a);
  color: #052e16;
  width: 28px;
  height: 28px;
  box-shadow: 0 6px 18px rgba(30, 215, 96, 0.32);
}

.chat-player__warning {
  display: none;
}

.chat-separator {
  display: none;
}

/* ─── Messages area ───────────────────────────────────── */
.chat-messages {
  position: relative;
  z-index: 1;
  background: transparent;
}

.chat-system-note {
  margin-bottom: 0.8rem;
  padding: 0.75rem 0.95rem;
  border-radius: 14px;
  border: 1px solid rgba(251, 191, 36, 0.22);
  background: rgba(251, 191, 36, 0.06);
  color: rgba(254, 215, 170, 0.92);
  font-size: 0.78rem;
  backdrop-filter: blur(10px);
}

.chat-message {
  display: flex;
}

.self-message {
  justify-content: flex-end;
}

.other-message {
  justify-content: flex-start;
}

.bubble {
  position: relative;
  max-width: min(75%, 520px);
  padding: 0.7rem 0.95rem;
  border-radius: 18px;
  font-size: 0.88rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px) saturate(1.3);
  -webkit-backdrop-filter: blur(16px) saturate(1.3);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.other-message .bubble {
  border-bottom-left-radius: 6px;
}

.self-message .bubble {
  color: #fff;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom-right-radius: 6px;
  box-shadow:
    0 10px 28px rgba(139, 92, 246, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.bubble .text-body2 {
  font-size: 0.9rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-message__meta {
  margin-top: 0.35rem;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.45);
}

.self-message .chat-message__meta {
  color: rgba(255, 255, 255, 0.78);
  text-align: right;
}

.chat-message__loading {
  text-align: center;
  padding: 0.8rem 0;
  font-size: 0.76rem;
  color: rgba(255, 255, 255, 0.4);
}

/* ─── Input ───────────────────────────────────────────── */
.chat-input {
  position: relative;
  z-index: 2;
  background: rgba(10, 10, 15, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(28px) saturate(1.3);
  -webkit-backdrop-filter: blur(28px) saturate(1.3);
}

.chat-input__field :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 999px;
  color: #fff;
  box-shadow: none;
  min-height: 44px;
  padding: 0 18px;
}

.chat-input__field :deep(.q-field__control::before) {
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 999px !important;
}

.chat-input__field :deep(.q-field__control:hover::before),
.chat-input__field :deep(.q-field--focused .q-field__control::before) {
  border-color: rgba(139, 92, 246, 0.45) !important;
}

.chat-input__field :deep(.q-field__native),
.chat-input__field :deep(.q-field__input) {
  color: #fff;
  font-size: 0.9rem;
}

.chat-input__field :deep(.q-field__native::placeholder),
.chat-input__field :deep(.q-field__input::placeholder) {
  color: rgba(255, 255, 255, 0.35);
  opacity: 1;
}

.chat-input__send-btn {
  background: linear-gradient(135deg, #8b5cf6, #a855f7 50%, #ec4899);
  color: #fff;
  width: 44px;
  height: 44px;
  box-shadow: 0 8px 22px rgba(139, 92, 246, 0.38);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.chat-input__send-btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(139, 92, 246, 0.5);
}

.chat-input__send-btn:disabled {
  opacity: 0.45;
}

/* ─── Music dialog ────────────────────────────────────── */
.music-dialog {
  width: min(420px, calc(100vw - 24px));
  border-radius: 20px;
  background: rgba(15, 15, 22, 0.92);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(28px) saturate(1.5);
  -webkit-backdrop-filter: blur(28px) saturate(1.5);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.music-dialog--dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 40;
}

.music-dialog__head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.95rem 1rem 0.65rem;
}

.music-dialog__notice {
  margin: 0 1rem 0.7rem;
  padding: 0.7rem 0.85rem;
  border-radius: 14px;
  border: 1px solid rgba(251, 191, 36, 0.22);
  background: rgba(251, 191, 36, 0.06);
  color: rgba(254, 215, 170, 0.92);
  font-size: 0.78rem;
}

.music-dialog__eyebrow {
  color: #4ade80;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.music-dialog__title {
  margin-top: 2px;
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.music-dialog__close {
  color: rgba(255, 255, 255, 0.6);
}

.music-dialog__close:hover {
  color: #fff;
}

.music-dialog__search {
  padding: 0 1rem;
}

.music-dialog__search :deep(.q-field__control) {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border-radius: 12px;
}

.music-dialog__search :deep(.q-field__control::before) {
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 12px !important;
}

.music-dialog__search :deep(.q-field--focused .q-field__control::before) {
  border-color: rgba(139, 92, 246, 0.45) !important;
}

.music-dialog__search :deep(.q-field__native),
.music-dialog__search :deep(.q-field__input),
.music-dialog__search :deep(.q-icon) {
  color: #fff;
}

.music-dialog__search :deep(.q-field__native::placeholder),
.music-dialog__search :deep(.q-field__input::placeholder) {
  color: rgba(255, 255, 255, 0.35);
  opacity: 1;
}

.music-dialog__results,
.music-dialog__empty,
.music-dialog__loading {
  padding: 0.95rem 1rem;
}

.music-dialog__loading,
.music-dialog__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.82rem;
  min-height: 120px;
  text-align: center;
}

.music-dialog__results {
  display: grid;
  gap: 0.55rem;
  max-height: 46vh;
  overflow-y: auto;
}

.music-dialog__results::-webkit-scrollbar {
  width: 6px;
}

.music-dialog__results::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.music-dialog__result {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.7rem;
  align-items: center;
  padding: 0.65rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  transition: background 0.18s ease, border-color 0.18s ease;
}

.music-dialog__result:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(139, 92, 246, 0.22);
}

.music-dialog__cover {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.music-dialog__cover--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(30, 215, 96, 0.14);
  color: #4ade80;
}

.music-dialog__result-body {
  min-width: 0;
}

.music-dialog__result-title {
  color: #fff;
  font-weight: 700;
  font-size: 0.86rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-dialog__result-artist {
  margin-top: 1px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.74rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-dialog__select-btn {
  border-radius: 999px;
  background: linear-gradient(135deg, #1ed760, #16a34a) !important;
  color: #052e16 !important;
  font-weight: 700;
  font-size: 0.74rem;
  padding: 0 14px;
  min-height: 30px;
  box-shadow: 0 6px 16px rgba(30, 215, 96, 0.3);
}

/* ─── Responsive ──────────────────────────────────────── */
@media (max-width: 700px) {
  .chat-header__meta {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto auto auto;
  }

  .chat-player {
    grid-column: 1 / -1;
    grid-row: 4;
    justify-self: stretch;
    max-width: none;
    width: 100%;
    margin-top: 0.4rem;
  }

  .chat-header__music-menu {
    grid-column: 2;
    grid-row: 1 / span 3;
  }

  .chat-header__music-btn :deep(.q-btn__content .block) {
    display: none;
  }

  .chat-header__music-btn {
    padding: 0 0.55rem;
  }

  .bubble {
    max-width: 86%;
  }

  .music-dialog {
    width: min(100vw - 16px, 380px);
  }

  .music-dialog__result {
    grid-template-columns: auto 1fr;
  }

  .music-dialog__select-btn {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
