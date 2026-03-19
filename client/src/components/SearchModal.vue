<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @show="onShow"
    @hide="onHide" class="search-dialog">
    <div class="search-modal" @click.stop>
      <!-- Search Input -->
      <div class="search-input-row">
        <q-icon name="search" size="22px" class="search-input-icon" />
        <input ref="searchInput" v-model="searchStore.query" @input="onInput" @keydown="onKeydown"
          placeholder="Search people, music, events..." class="search-input" />
        <kbd class="search-esc" @click="$emit('update:modelValue', false)">Esc</kbd>
      </div>

      <!-- Tabs -->
      <div class="search-tabs">
        <button v-for="tab in tabs" :key="tab.value" :class="['search-tab', { active: searchStore.activeTab === tab.value }]"
          @click="searchStore.setTab(tab.value)">
          {{ tab.label }}
        </button>
      </div>

      <!-- Results -->
      <div class="search-results" v-if="searchStore.hasResults">
        <!-- People -->
        <template v-if="showCategory('people') && searchStore.results.people.length">
          <div class="search-category-header">People</div>
          <div v-for="(person, i) in searchStore.results.people" :key="'p-' + person.id"
            :class="['search-result-row', { selected: getGlobalIndex('people', i) === searchStore.selectedIndex }]"
            @click="goToPerson(person)" @mouseenter="searchStore.selectedIndex = getGlobalIndex('people', i)">
            <q-avatar size="36px" class="search-result-avatar">
              <img v-if="person.avatarUrl" :src="person.avatarUrl" />
              <q-icon v-else name="person" size="20px" />
            </q-avatar>
            <div class="search-result-info">
              <div class="search-result-name">{{ person.displayName }}</div>
              <div class="search-result-sub">
                {{ person.topGenres.join(', ') }}
                <span v-if="person.mutualArtists > 0"> -- {{ person.mutualArtists }} mutual artist{{ person.mutualArtists > 1 ? 's' : '' }}</span>
              </div>
            </div>
            <q-icon name="chevron_right" size="16px" class="search-result-arrow" />
          </div>
        </template>

        <!-- Music -->
        <template v-if="showCategory('music') && searchStore.results.music.length">
          <div class="search-category-header">Music</div>
          <div v-for="(track, i) in searchStore.results.music" :key="'m-' + i"
            :class="['search-result-row', { selected: getGlobalIndex('music', i) === searchStore.selectedIndex }]"
            @click="goToMusic(track)" @mouseenter="searchStore.selectedIndex = getGlobalIndex('music', i)">
            <img v-if="track.albumImage" :src="track.albumImage" class="search-result-art" />
            <q-icon v-else name="music_note" size="20px" class="search-result-art-icon" />
            <div class="search-result-info">
              <div class="search-result-name">{{ track.name }}</div>
              <div class="search-result-sub">{{ track.artist }} -- {{ track.album }}</div>
            </div>
            <q-icon name="chevron_right" size="16px" class="search-result-arrow" />
          </div>
        </template>

        <!-- Events -->
        <template v-if="showCategory('events') && searchStore.results.events.length">
          <div class="search-category-header">Events</div>
          <div v-for="(event, i) in searchStore.results.events" :key="'e-' + event.id"
            :class="['search-result-row', { selected: getGlobalIndex('events', i) === searchStore.selectedIndex }]"
            @click="goToEvent(event)" @mouseenter="searchStore.selectedIndex = getGlobalIndex('events', i)">
            <q-icon name="event" size="20px" class="search-result-art-icon" />
            <div class="search-result-info">
              <div class="search-result-name">{{ event.name }}</div>
              <div class="search-result-sub">{{ event.date }} -- {{ event.venue }}, {{ event.city }}</div>
            </div>
            <q-icon name="chevron_right" size="16px" class="search-result-arrow" />
          </div>
        </template>
      </div>

      <!-- Loading -->
      <div class="search-loading" v-else-if="searchStore.loading">
        <div v-for="n in 3" :key="n" class="search-skeleton">
          <div class="skeleton-circle"></div>
          <div class="skeleton-lines">
            <div class="skeleton-line long"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div class="search-empty" v-else-if="!searchStore.loading && searchStore.query.trim().length >= 2">
        <q-icon name="search_off" size="32px" />
        <div>No results found</div>
      </div>

      <!-- Error -->
      <div class="search-error" v-else-if="searchStore.error">
        <q-icon name="error_outline" size="24px" />
        <div>Search unavailable</div>
        <button class="search-retry" @click="searchStore.search()">Retry</button>
      </div>

      <!-- Footer -->
      <div class="search-footer">
        <div class="search-hint">
          <kbd>↑</kbd><kbd>↓</kbd> navigate
        </div>
        <div class="search-hint">
          <kbd>↵</kbd> open
        </div>
        <div class="search-hint">
          <kbd>esc</kbd> close
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useSearchStore } from '@/stores/search';

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(['update:modelValue']);

const router = useRouter();
const searchStore = useSearchStore();
const searchInput = ref(null);

let debounceTimer = null;

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'People', value: 'people' },
  { label: 'Music', value: 'music' },
  { label: 'Events', value: 'events' },
];

function showCategory(cat) {
  return searchStore.activeTab === 'all' || searchStore.activeTab === cat;
}

function getGlobalIndex(category, localIndex) {
  const order = ['people', 'music', 'events'];
  let offset = 0;
  for (const cat of order) {
    if (!showCategory(cat)) continue;
    if (cat === category) return offset + localIndex;
    offset += (searchStore.results[cat] || []).length;
  }
  return -1;
}

function onShow() {
  searchStore.reset();
  nextTick(() => {
    searchInput.value?.focus();
  });
}

function onHide() {
  if (debounceTimer) clearTimeout(debounceTimer);
}

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    searchStore.search();
  }, 300);
}

function onKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchStore.moveSelection(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchStore.moveSelection(-1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const item = searchStore.flatResults[searchStore.selectedIndex];
    if (item) navigateTo(item);
  } else if (e.key === 'Escape') {
    emit('update:modelValue', false);
  }
}

function navigateTo(item) {
  if (item._category === 'people') goToPerson(item);
  else if (item._category === 'music') goToMusic(item);
  else if (item._category === 'events') goToEvent(item);
}

function goToPerson(person) {
  emit('update:modelValue', false);
  router.push({ name: 'ProfileView', query: { userId: person.id } });
}

function goToMusic(track) {
  emit('update:modelValue', false);
  if (track.spotifyUri) {
    window.open(track.spotifyUri);
  }
}

function goToEvent(event) {
  emit('update:modelValue', false);
  router.push({ name: 'EventMap', query: { search: event.name } });
}
</script>

<style>
/* Dialog backdrop */
.search-dialog .q-dialog__backdrop {
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(4px);
}

.search-dialog .q-dialog__inner {
  padding-top: 12vh;
  align-items: flex-start !important;
}
</style>

<style scoped>
.search-modal {
  width: 520px;
  max-width: 95vw;
  background: #111119;
  border: 1px solid rgba(139, 92, 246, 0.18);
  border-radius: 16px;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.7),
    0 0 40px rgba(139, 92, 246, 0.06);
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

/* Search Input Row */
.search-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.search-input-icon {
  color: rgba(167, 139, 250, 0.5);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 15px;
  color: #fff;
  font-family: 'Inter', sans-serif;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.search-esc {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
  padding: 3px 8px;
  border-radius: 4px;
  font-family: monospace;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.search-esc:hover {
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.1);
}

/* Tabs */
.search-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.search-tab {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background: none;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: 'Inter', sans-serif;
}

.search-tab:hover {
  color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.04);
}

.search-tab.active {
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.12);
}

/* Results */
.search-results {
  max-height: 340px;
  overflow-y: auto;
  padding: 8px;
}

.search-results::-webkit-scrollbar {
  width: 4px;
}

.search-results::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
}

.search-category-header {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.25);
  padding: 8px 8px 4px;
}

.search-result-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s ease;
}

.search-result-row:hover,
.search-result-row.selected {
  background: rgba(139, 92, 246, 0.06);
}

.search-result-avatar {
  flex-shrink: 0;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.search-result-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.search-result-art {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.search-result-art-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.search-result-info {
  flex: 1;
  min-width: 0;
}

.search-result-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result-sub {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.35);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result-arrow {
  color: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

/* Loading Skeletons */
.search-loading {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-skeleton {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skeleton-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

.skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-line {
  height: 10px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

.skeleton-line.long { width: 70%; }
.skeleton-line.short { width: 45%; }

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Empty / Error */
.search-empty,
.search-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: rgba(255, 255, 255, 0.25);
  font-size: 13px;
}

.search-retry {
  font-size: 11px;
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
}

.search-retry:hover {
  background: rgba(139, 92, 246, 0.18);
}

/* Footer */
.search-footer {
  display: flex;
  gap: 16px;
  justify-content: center;
  padding: 10px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.search-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-hint kbd {
  font-size: 9px;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: monospace;
  border: none;
  color: rgba(255, 255, 255, 0.25);
}
</style>
