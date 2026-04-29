<template>
  <q-page class="chat-page column">
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

        <q-avatar size="48px" class="chat-header__avatar q-ml-sm">
          <img v-if="otherAvatar" :src="otherAvatar" :alt="otherDisplayName" />
          <span v-else>{{ otherInitials }}</span>
        </q-avatar>

        <div class="chat-header__meta q-ml-md">
          <div class="chat-header__title-row">
            <div class="chat-header__name">{{ otherDisplayName }}</div>
            <div ref="musicMenuRef" class="chat-header__music-menu" @click.stop>
            <q-btn
              unelevated
              dense
              no-caps
              icon="music_note"
              label="Gemeinsam hören"
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
                    <div class="music-dialog__title">Gemeinsam Song hoeren</div>
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
                  Beide muessen online sein, um gemeinsam zu hoeren.
                </div>

                <q-input
                  v-model="trackSearchQuery"
                  :disable="!otherIsOnline || !isSocketOpen"
                  dense
                  outlined
                  clearable
                  placeholder="Song auf Spotify suchen"
                  class="music-dialog__search"
                >
                  <template #prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>

                <div v-if="trackSearchQuery.trim().length < 2" class="music-dialog__empty">
                  Gib mindestens 2 Zeichen ein, um Songs zu suchen.
                </div>

                <div v-else-if="trackSearchLoading" class="music-dialog__loading">
                  <q-spinner color="positive" size="24px" />
                  <span>Suche laeuft ...</span>
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
                      label="Auswaehlen"
                      class="music-dialog__select-btn"
                      @click="selectTrack(track)"
                    />
                  </div>
                </div>

                <div v-else class="music-dialog__empty">
                  Keine Songs gefunden.
                </div>
            </div>
            </div>
          </div>

          <div class="chat-header__presence" :class="{ 'is-online': otherIsOnline }">
            {{ otherIsOnline ? "Online" : "Offline" }}
          </div>
          <div v-if="otherTyping" class="chat-header__typing">Tippt ...</div>

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
                    {{ songState.trackName || "Unbekannter Song" }}
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
        Aeltere Nachrichten aus diesem Chat koennen in einem neuen oder Inkognito-Browser
        nicht entschluesselt werden. Neue Nachrichten werden wieder lesbar angezeigt.
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
        placeholder="Nachricht schreiben ..."
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
            <div class="music-dialog__title">Gemeinsam Song hören</div>
          </div>
          <q-btn flat round dense icon="close" class="music-dialog__close" v-close-popup />
        </div>

        <q-input
          v-model="trackSearchQuery"
          dense
          outlined
          clearable
          placeholder="Song auf Spotify suchen"
          class="music-dialog__search"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <div v-if="trackSearchQuery.trim().length < 2" class="music-dialog__empty">
          Gib mindestens 2 Zeichen ein, um Songs zu suchen.
        </div>

        <div v-else-if="trackSearchLoading" class="music-dialog__loading">
          <q-spinner color="positive" size="24px" />
          <span>Suche läuft ...</span>
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
              label="Auswählen"
              class="music-dialog__select-btn"
              @click="selectTrack(track)"
            />
          </div>
        </div>

        <div v-else class="music-dialog__empty">
          Keine Songs gefunden.
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

const PLAYBACK_REQUIRED_MESSAGE = "Spotify Premium oder ein aktives Spotify-Gerät wird benötigt.";

const BOTH_ONLINE_MESSAGE = "Beide muessen online sein, um gemeinsam zu hoeren.";
const LEGACY_MESSAGE_FALLBACK = "Diese Nachricht ist nur auf dem urspruenglichen Browser lesbar.";
const SHARED_PLAYBACK_REQUIRED_MESSAGE = "Spotify Premium und der Venyu-Webplayer im Browser werden benoetigt.";
const UNREADABLE_MESSAGE_FALLBACK = "Nachricht konnte nicht wiederhergestellt werden.";

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
const spotifyPlayerDeviceId = ref("");
const spotifyPlayerReady = ref(false);

const isSocketOpen = computed(() => socketConnected.value);
const hasUnreadableMessages = computed(() =>
  messages.value.some((message) =>
    message?._decrypted === false
    && Boolean(message?.ciphertext)
    && !String(message?.plaintext || "").trim()
  )
);
const songArtistsLabel = computed(() =>
  Array.isArray(songState.value?.artists) && songState.value.artists.length
    ? songState.value.artists.join(", ")
    : "Unbekannter Artist"
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
  if (countdownSeconds.value > 0) return `Startet in ${countdownSeconds.value} ...`;
  if (songState.value.isPlaying) return "Synchronisiert";
  if (readyUserIds.value.length < participantIds.value.length) return "Wartet auf andere Person";
  return "Bereit";
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
let plaintextSyncTimer = null;
const pendingPlaintextUpdates = new Map();

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
  notifyError("Die Chat-Verbindung wird gerade aufgebaut. Bitte versuche es gleich noch einmal.");
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

async function flushPendingPlaintextSync() {
  if (!pendingPlaintextUpdates.size) return;

  const updates = Array.from(pendingPlaintextUpdates.values()).slice(0, 50);
  updates.forEach((item) => pendingPlaintextUpdates.delete(item.id));

  try {
    await api.syncChatMessagePlaintexts(roomId.value, updates);
  } catch {
    updates.forEach((item) => pendingPlaintextUpdates.set(item.id, item));
  } finally {
    if (pendingPlaintextUpdates.size) {
      window.clearTimeout(plaintextSyncTimer);
      plaintextSyncTimer = window.setTimeout(() => {
        void flushPendingPlaintextSync();
      }, 250);
    }
  }
}

function queuePlaintextSync(message) {
  const messageId = typeof message?.id === "string" ? message.id : "";
  const plaintext = typeof message?.text === "string" ? message.text.trim() : "";

  if (!messageId || !plaintext) return;
  if (typeof message.plaintext === "string" && message.plaintext.trim()) return;

  message.plaintext = plaintext;
  pendingPlaintextUpdates.set(messageId, { id: messageId, plaintext });
  window.clearTimeout(plaintextSyncTimer);
  plaintextSyncTimer = window.setTimeout(() => {
    void flushPendingPlaintextSync();
  }, 120);
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
  if (typeof message.plaintext === "string" && message.plaintext.trim()) {
    message.text = message.plaintext;
    message._decrypted = true;
    return;
  }

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

    if (typeof message.plaintext === "string" && message.plaintext.trim()) {
      message.text = message.plaintext;
      message._decrypted = true;
      continue;
    }

    if (message.ciphertext && message.iv && aesKey) {
      if (message._decrypted === true) continue;

      try {
        message.text = await decryptText(aesKey, message.ciphertext, message.iv);
        message._decrypted = true;
        queuePlaintextSync(message);
        continue;
      } catch {
        applyMessageTextFallback(message);
        continue;
      }
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
  if (!currentUserId.value) return;

  if (!myKeyPair) myKeyPair = await getOrCreateIdentity(currentUserId.value);

  const flagKey = `e2ee_pub_uploaded_v1_${currentUserId.value}`;
  if (!localStorage.getItem(flagKey)) {
    try {
      const publicKeyJwk = await exportPublicJwk(myKeyPair);
      await fetch("/api/chat/e2ee/public-key", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKeyJwk }),
      });
      localStorage.setItem(flagKey, "1");
    } catch {
      // ignore
    }
  }

  try {
    const res = await fetch(`/api/chat/rooms/${encodeURIComponent(roomId.value)}/peer-key`, {
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.publicKeyJwk) {
        const theirPublicKey = await importRemotePublicJwk(data.publicKeyJwk);
        aesKey = await deriveAesKey(myKeyPair, theirPublicKey);
        await decryptAllLoadedMessages();
      }
    }
  } catch {
    // ignore
  }
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

        if (typeof message.plaintext === "string" && message.plaintext.trim()) {
          message.text = message.plaintext;
          message._decrypted = true;
        } else if (aesKey && message.ciphertext && message.iv) {
          try {
            message.text = await decryptText(aesKey, message.ciphertext, message.iv);
            message._decrypted = true;
            queuePlaintextSync(message);
          } catch {
            applyMessageTextFallback(message);
          }
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

  let ciphertext = null;
  let iv = null;
  let version = "plaintext-v1";

  if (!aesKey) {
    await ensureE2eeKeyReadyViaRest();
    if (!aesKey) {
      await sendMyPublicKeyWs();
    }
  }

  sending.value = true;
  try {
    if (aesKey) {
      const encrypted = await encryptText(aesKey, text);
      ciphertext = encrypted.ciphertext;
      iv = encrypted.iv;
      version = "aes-gcm-v1";
    }

    sendSocketMessage({
      type: "chat_message",
      ciphertext,
      iv,
      plaintext: text,
      version,
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
    notifyError("Spotify-Suche konnte nicht geladen werden.");
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
    pendingPlaintextUpdates.clear();
    window.clearTimeout(plaintextSyncTimer);
    clearPlaybackTimer();

    await ensureChatMetaLoaded();
    await fetchMessages();
    await ensureE2eeKeyReadyViaRest();
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
  await fetchMessages();
  await ensureE2eeKeyReadyViaRest();
  connectChatWebSocket();
});

onUnmounted(() => {
  clearPlaybackTimer();
  socketConnected.value = false;
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  if (socket) socket.close();
  pendingPlaintextUpdates.clear();
  window.clearTimeout(plaintextSyncTimer);
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

<style scoped>
.chat-page {
  --chat-bg: #f4f7fb;
  --chat-surface: rgba(255, 255, 255, 0.92);
  --chat-surface-strong: #ffffff;
  --chat-surface-soft: rgba(245, 248, 252, 0.92);
  --chat-text: #162033;
  --chat-muted: #6a7388;
  --chat-border: rgba(18, 32, 54, 0.12);
  --chat-shadow: 0 18px 45px rgba(17, 24, 39, 0.08);
  --chat-self-bubble: linear-gradient(135deg, #dcfce7, #bbf7d0);
  --chat-other-bubble: rgba(255, 255, 255, 0.94);
  --chat-accent: #1db954;
  --chat-accent-strong: #15803d;
  --chat-input-bg: rgba(255, 255, 255, 0.98);
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(29, 185, 84, 0.12), transparent 35%),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%);
  color: var(--chat-text);
}

:global(body.body--dark) .chat-page {
  --chat-bg: #0c1018;
  --chat-surface: rgba(16, 22, 34, 0.94);
  --chat-surface-strong: rgba(20, 27, 40, 0.98);
  --chat-surface-soft: rgba(18, 24, 37, 0.96);
  --chat-text: #eef2ff;
  --chat-muted: #98a2b8;
  --chat-border: rgba(148, 163, 184, 0.18);
  --chat-shadow: 0 24px 55px rgba(0, 0, 0, 0.32);
  --chat-self-bubble: linear-gradient(135deg, rgba(29, 185, 84, 0.34), rgba(34, 197, 94, 0.2));
  --chat-other-bubble: rgba(18, 24, 37, 0.94);
  --chat-accent: #34d399;
  --chat-accent-strong: #10b981;
  --chat-input-bg: rgba(17, 24, 39, 0.96);
  background:
    radial-gradient(circle at top right, rgba(52, 211, 153, 0.16), transparent 35%),
    linear-gradient(180deg, #0c1018 0%, #121826 100%);
}

.chat-header {
  background: var(--chat-surface);
  border-bottom: 1px solid var(--chat-border);
  box-shadow: var(--chat-shadow);
  backdrop-filter: blur(16px);
}

.chat-header__top {
  gap: 0.25rem;
  align-items: center;
}

.chat-header__nav-btn {
  color: var(--chat-text);
  background: transparent;
}

.chat-header__avatar {
  background: linear-gradient(135deg, rgba(29, 185, 84, 0.18), rgba(59, 130, 246, 0.18));
  color: var(--chat-text);
  border: 1px solid var(--chat-border);
  font-weight: 700;
}

.chat-header__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, 240px) auto;
  grid-template-rows: auto auto auto;
  gap: 0.08rem 0.55rem;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
  overflow: visible;
}

.chat-header__title-row {
  display: contents;
}

.chat-header__identity {
  min-width: 0;
  flex: 1 1 auto;
}

.chat-header__name {
  grid-column: 1;
  grid-row: 1;
  margin-top: 0.18rem;
  color: var(--chat-text);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
}

.chat-header__presence-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
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
  background: rgba(29, 185, 84, 0.14);
  color: var(--chat-accent-strong);
  border: 1px solid rgba(29, 185, 84, 0.28);
  border-radius: 999px;
  min-height: 34px;
  width: auto;
  height: 34px;
  padding: 0 0.55rem;
  box-shadow: 0 8px 16px rgba(29, 185, 84, 0.14);
}

.chat-header__music-btn :deep(.q-btn__content) {
  gap: 0.35rem;
}

.chat-header__music-btn :deep(.q-btn__content .block) {
  display: inline;
}

.chat-header__presence,
.chat-header__typing {
  color: var(--chat-muted);
  font-size: 0.83rem;
}

.chat-header__presence {
  grid-column: 1;
  grid-row: 2;
}

.chat-header__typing {
  grid-column: 1;
  grid-row: 3;
}

.chat-header__presence.is-online {
  color: var(--chat-accent);
}

.chat-player {
  grid-column: 2;
  grid-row: 1 / span 3;
  justify-self: center;
  align-self: center;
  background: var(--chat-surface-strong);
  border: 1px solid var(--chat-border);
  border-radius: 13px;
  padding: 0.28rem 0.42rem;
  margin-top: 0;
  width: min(100%, 232px);
  max-width: 232px;
}

.chat-player__main {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.35rem;
  align-items: center;
}

.chat-player__cover-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-player__cover {
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: 9px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
}

.chat-player__cover--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(29, 185, 84, 0.16);
  color: var(--chat-accent-strong);
}

.chat-player__body {
  min-width: 0;
}

.chat-player__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.45rem;
}

.chat-player__title {
  color: var(--chat-text);
  font-weight: 700;
  font-size: 0.73rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-player__artists {
  color: var(--chat-muted);
  font-size: 0.65rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-player__status {
  color: var(--chat-accent-strong);
  font-weight: 600;
  font-size: 0.6rem;
  white-space: nowrap;
}

.chat-player__bottomline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  margin-top: 0.08rem;
}

.chat-player__time {
  color: var(--chat-muted);
  font-size: 0.58rem;
  margin-top: 0;
}

.chat-player__slider {
  margin-top: -0.48rem;
  margin-bottom: -0.82rem;
  color: var(--chat-text);
}

.chat-player__actions {
  display: flex;
  align-items: center;
}

.chat-player__action-btn {
  background: var(--chat-accent);
  color: #062b13;
  width: 26px;
  height: 26px;
}

.chat-player__warning {
  display: none;
}

.chat-separator {
  background: var(--chat-border);
}

.chat-messages {
  background: transparent;
}

.chat-system-note {
  margin-bottom: 0.8rem;
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.28);
  background: rgba(245, 158, 11, 0.1);
  color: var(--chat-text);
  font-size: 0.82rem;
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
  max-width: min(75%, 520px);
  padding: 0.8rem 0.95rem;
  border-radius: 18px;
  border: 1px solid var(--chat-border);
  background: var(--chat-other-bubble);
  color: var(--chat-text);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.self-message .bubble {
  background: var(--chat-self-bubble);
}

.chat-message__meta,
.chat-message__loading {
  color: var(--chat-muted);
  font-size: 0.78rem;
}

.chat-message__loading {
  text-align: center;
  padding: 0.8rem 0;
}

.chat-input {
  background: var(--chat-surface);
  border-top: 1px solid var(--chat-border);
  backdrop-filter: blur(14px);
}

.chat-input__field {
  color: var(--chat-text);
}

.chat-input__field :deep(.q-field__control) {
  background: var(--chat-input-bg);
  border-radius: 999px;
  color: var(--chat-text);
  box-shadow: none;
}

.chat-input__field :deep(.q-field__native),
.chat-input__field :deep(.q-field__input) {
  color: var(--chat-text);
}

.chat-input__field :deep(.q-field__native::placeholder),
.chat-input__field :deep(.q-field__input::placeholder) {
  color: var(--chat-muted);
  opacity: 1;
}

.chat-input__field :deep(.q-field__outline) {
  color: var(--chat-border);
}

.chat-input__send-btn {
  background: var(--chat-accent);
  color: #062b13;
  box-shadow: 0 14px 24px rgba(29, 185, 84, 0.24);
}

.music-dialog {
  width: min(420px, calc(100vw - 24px));
  border-radius: 20px;
  background: var(--chat-surface-strong);
  color: var(--chat-text);
  border: 1px solid var(--chat-border);
  box-shadow: var(--chat-shadow);
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
  padding: 0.85rem 0.9rem 0.55rem;
}

.music-dialog__notice {
  margin: 0 0.9rem 0.7rem;
  padding: 0.7rem 0.8rem;
  border-radius: 14px;
  border: 1px solid rgba(245, 158, 11, 0.28);
  background: rgba(245, 158, 11, 0.1);
  color: var(--chat-text);
  font-size: 0.8rem;
}

.music-dialog__eyebrow {
  color: var(--chat-accent-strong);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.music-dialog__title {
  color: var(--chat-text);
  font-size: 1rem;
  font-weight: 700;
}

.music-dialog__close {
  color: var(--chat-text);
}

.music-dialog__search {
  padding: 0 0.9rem;
}

.music-dialog__search :deep(.q-field__control) {
  background: var(--chat-input-bg);
  color: var(--chat-text);
}

.music-dialog__search :deep(.q-field__native),
.music-dialog__search :deep(.q-field__input),
.music-dialog__search :deep(.q-icon) {
  color: var(--chat-text);
}

.music-dialog__search :deep(.q-field__native::placeholder),
.music-dialog__search :deep(.q-field__input::placeholder) {
  color: var(--chat-muted);
  opacity: 1;
}

.music-dialog__results,
.music-dialog__empty,
.music-dialog__loading {
  padding: 0.9rem;
}

.music-dialog__loading,
.music-dialog__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  color: var(--chat-muted);
  min-height: 120px;
  text-align: center;
}

.music-dialog__results {
  display: grid;
  gap: 0.6rem;
  max-height: 46vh;
  overflow-y: auto;
}

.music-dialog__result {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.7rem;
  align-items: center;
  padding: 0.7rem;
  border-radius: 16px;
  border: 1px solid var(--chat-border);
  background: var(--chat-surface-soft);
}

.music-dialog__cover {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 12px;
}

.music-dialog__cover--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(29, 185, 84, 0.14);
  color: var(--chat-accent-strong);
}

.music-dialog__result-body {
  min-width: 0;
}

.music-dialog__result-title {
  color: var(--chat-text);
  font-weight: 700;
  font-size: 0.92rem;
}

.music-dialog__result-artist {
  color: var(--chat-muted);
  font-size: 0.8rem;
}

.music-dialog__select-btn {
  border-radius: 999px;
}

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
    margin-top: 0.35rem;
  }

  .chat-header__music-menu {
    grid-column: 2;
    grid-row: 1 / span 3;
  }

  .chat-player__main {
    grid-template-columns: auto 1fr auto;
  }

  .bubble {
    max-width: 88%;
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
