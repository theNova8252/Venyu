,<template>
  <q-page class="eventmap-page">
    <!-- Floating header bar -->
    <div class="map-topbar">
      <div class="topbar-left">
        <q-icon name="event" size="20px" color="white" />
        <span class="topbar-title">Events Near You</span>
      </div>
      <div class="topbar-right">
        <div v-if="events.loading" class="topbar-badge loading">Loading…</div>
        <div class="topbar-badge count">{{ filteredEvents.length }} events</div>
      </div>
    </div>

    <!-- Search bar -->
    <div class="search-container">
      <div class="search-box">
        <q-icon name="search" size="18px" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search events, artists, venues…"
          class="search-input"
          @keydown.enter="runSearch"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">&times;</button>
        <button class="search-btn" @click="runSearch" :disabled="events.searching">
          {{ events.searching ? '…' : 'Go' }}
        </button>
      </div>
      <!-- Search results dropdown -->
      <div v-if="showSearchResults" class="search-results">
        <div v-if="events.searching" class="search-loading">Searching…</div>
        <div v-else-if="events.searchResults.length === 0 && searchQuery" class="search-empty">No events found</div>
        <div
          v-for="ev in events.searchResults"
          :key="ev.id"
          class="search-result-item"
          @click="selectSearchResult(ev)"
        >
          <div class="sr-title">{{ ev.title }}</div>
          <div class="sr-meta">{{ ev.venue }} · {{ ev.city }} · {{ new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}</div>
        </div>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <!-- Date quick-filters -->
      <div class="filter-chips">
        <button
          v-for="opt in dateOptions"
          :key="opt.key"
          class="filter-chip"
          :class="{ active: activeDate === opt.key }"
          @click="setDateFilter(opt.key)"
        >
          <q-icon :name="opt.icon" size="14px" />
          <span>{{ opt.label }}</span>
        </button>
      </div>
      <!-- Genre dropdown -->
      <div class="genre-dropdown-wrapper">
        <button class="genre-toggle" @click="genreDropOpen = !genreDropOpen">
          <q-icon name="music_note" size="14px" />
          <span>{{ activeGenre || 'All Genres' }}</span>
          <q-icon :name="genreDropOpen ? 'expand_less' : 'expand_more'" size="16px" />
        </button>
        <transition name="fade-drop">
          <div v-if="genreDropOpen" class="genre-dropdown">
            <button
              class="genre-option"
              :class="{ active: activeGenre === '' }"
              @click="setGenre('')"
            >All Genres</button>
            <button
              v-for="g in availableGenres"
              :key="g"
              class="genre-option"
              :class="{ active: activeGenre === g }"
              @click="setGenre(g)"
            >{{ g }}</button>
          </div>
        </transition>
      </div>
      <!-- Active filter count -->
      <div v-if="filtersActive" class="filter-count">
        {{ filteredEvents.length }} / {{ events.list.length }}
        <button class="filter-clear" @click="clearFilters" title="Clear filters">
          <q-icon name="close" size="14px" />
        </button>
      </div>
    </div>

    <!-- Map container -->
    <div class="map-wrapper">
      <div id="map"></div>
    </div>

    <!-- Floating event list panel -->
    <transition name="slide-panel">
      <div v-if="panelOpen" class="event-panel">
        <div class="panel-header">
          <span class="panel-heading">Upcoming Events</span>
          <button class="panel-close" @click="panelOpen = false">&times;</button>
        </div>
        <div class="panel-list">
          <div
            v-for="ev in sortedEvents"
            :key="ev.id"
            class="panel-card"
            @click="flyToEvent(ev)"
          >
            <div class="panel-card-date">
              <span class="pcd-month">{{ formatMonth(ev.date) }}</span>
              <span class="pcd-day">{{ formatDay(ev.date) }}</span>
            </div>
            <div class="panel-card-info">
              <div class="pci-title">{{ ev.title }}</div>
              <div class="pci-venue">{{ ev.venue }}</div>
              <div class="pci-city">{{ ev.city }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Panel toggle button -->
    <button class="panel-toggle" @click="panelOpen = !panelOpen">
      <q-icon :name="panelOpen ? 'close' : 'list'" size="20px" />
    </button>

    <!-- My location button -->
    <button class="locate-btn" @click="goToMyLocation" title="Go to my location">
      <q-icon name="my_location" size="20px" />
    </button>

    <!-- Heatmap toggle button -->
    <button
      class="heatmap-toggle"
      :class="{ active: heatmapActive }"
      @click="toggleHeatmap"
      title="Toggle heatmap"
      aria-label="Toggle heatmap view"
      :aria-pressed="heatmapActive"
    >
      <q-icon name="layers" size="20px" />
    </button>
  </q-page>
</template>

<script setup>
import "mapbox-gl/dist/mapbox-gl.css";
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import mapboxgl from "mapbox-gl";
import { useEventsStore } from "@/stores/events";
import ticketmasterLogo from "@/assets/ticketmasterLogo.png";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const events = useEventsStore();
const panelOpen = ref(false);
const searchQuery = ref('');
const showSearchResults = ref(false);
const heatmapActive = ref(false);
const activeDate = ref('all');
const activeGenre = ref('');
const genreDropOpen = ref(false);
let map = null;
let activePopup = null;
let userMarker = null;

// Date filter options
const dateOptions = [
  { key: 'all', label: 'All', icon: 'date_range' },
  { key: 'today', label: 'Today', icon: 'today' },
  { key: 'week', label: 'This Week', icon: 'view_week' },
  { key: 'month', label: 'This Month', icon: 'calendar_month' },
];

// Unique genres derived from current event list
const availableGenres = computed(() => {
  const genres = new Set();
  events.list.forEach((ev) => {
    if (ev.category && ev.category !== 'Undefined' && ev.category !== 'Other') {
      genres.add(ev.category);
    }
  });
  return [...genres].sort();
});

// Filtered events based on active date + genre
const filteredEvents = computed(() => {
  let list = events.list;

  // Genre filter
  if (activeGenre.value) {
    list = list.filter((ev) => ev.category === activeGenre.value);
  }

  // Date filter
  if (activeDate.value !== 'all') {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (activeDate.value === 'today') {
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      list = list.filter((ev) => {
        const d = new Date(ev.date);
        return d >= startOfDay && d < endOfDay;
      });
    } else if (activeDate.value === 'week') {
      const endOfWeek = new Date(startOfDay);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      list = list.filter((ev) => {
        const d = new Date(ev.date);
        return d >= startOfDay && d < endOfWeek;
      });
    } else if (activeDate.value === 'month') {
      const endOfMonth = new Date(startOfDay);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      list = list.filter((ev) => {
        const d = new Date(ev.date);
        return d >= startOfDay && d < endOfMonth;
      });
    }
  }

  return list;
});

const filtersActive = computed(() => activeDate.value !== 'all' || activeGenre.value !== '');

function setDateFilter(key) {
  activeDate.value = key;
}

function setGenre(genre) {
  activeGenre.value = genre;
  genreDropOpen.value = false;
}

function clearFilters() {
  activeDate.value = 'all';
  activeGenre.value = '';
}

const sortedEvents = computed(() =>
  [...filteredEvents.value].sort((a, b) => new Date(a.date) - new Date(b.date))
);

const formatMonth = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const formatDay = (d) => new Date(d).getDate();

function flyToEvent(ev) {
  if (!map) return;
  map.flyTo({ center: [ev.lng, ev.lat], zoom: 14, duration: 1200 });
  panelOpen.value = false;
}

function goToMyLocation() {
  if (!map || events.userLat == null) return;
  map.flyTo({ center: [events.userLng, events.userLat], zoom: 11, duration: 1200 });
}

async function runSearch() {
  if (!searchQuery.value.trim()) return;
  showSearchResults.value = true;
  await events.searchEvents(searchQuery.value);
}

function selectSearchResult(ev) {
  showSearchResults.value = false;
  if (!map) return;

  // Add the event to the map data if not already present
  const exists = events.list.find((e) => e.id === ev.id);
  if (!exists) {
    events.list.push(ev);
    updateMapSource();
  }

  map.flyTo({ center: [ev.lng, ev.lat], zoom: 14, duration: 1200 });

  // Open popup for this event after fly
  setTimeout(() => {
    if (activePopup) activePopup.remove();
    activePopup = new mapboxgl.Popup({ offset: 10, maxWidth: '340px', closeButton: true, closeOnClick: false })
      .setLngLat([ev.lng, ev.lat])
      .setDOMContent(buildEventPopup([ev]))
      .addTo(map);
  }, 1300);
}

function clearSearch() {
  searchQuery.value = '';
  events.searchResults = [];
  showSearchResults.value = false;
}

function toggleHeatmap() {
  if (!map) return;
  heatmapActive.value = !heatmapActive.value;
  const markerVis = heatmapActive.value ? 'none' : 'visible';
  const heatVis = heatmapActive.value ? 'visible' : 'none';

  ['clusters', 'cluster-count', 'unclustered-point', 'unclustered-glow']
    .forEach((id) => map.setLayoutProperty(id, 'visibility', markerVis));
  map.setLayoutProperty('heatmap-layer', 'visibility', heatVis);

  if (heatmapActive.value && activePopup) {
    activePopup.remove();
    activePopup = null;
  }
}

// Close search dropdown when clicking outside
function onDocClick(e) {
  if (!e.target.closest('.search-container')) {
    showSearchResults.value = false;
  }
  if (!e.target.closest('.genre-dropdown-wrapper')) {
    genreDropOpen.value = false;
  }
}

function updateMapSource() {
  if (!map) return;
  const visible = filteredEvents.value;
  if (map.getSource('events')) {
    map.getSource('events').setData(buildGeoJSON(visible));
  }
  if (map.getSource('events-heat')) {
    map.getSource('events-heat').setData(buildHeatGeoJSON(visible));
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function buildEventPopup(eventData) {
  let currentIndex = 0;
  const eventList = Array.isArray(eventData) ? eventData : [eventData];

  const container = document.createElement("div");
  container.className = "popup-carousel";

  const render = () => {
    const event = eventList[currentIndex];
    const { interested, going } = events.getRsvp(event.id);
    const safeTitle = escapeHtml(event.title);
    const safeVenue = escapeHtml(event.venue);
    const safeCity = escapeHtml(event.city);
    const dateStr = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });

    container.innerHTML = `
      <div class="popup-card">
        ${event.image ? `
          <div class="popup-hero">
            <div class="popup-img" style="background-image:url('${encodeURI(event.image)}')"></div>
            <div class="popup-img-fade"></div>
            <span class="popup-date-float">${dateStr}</span>
          </div>
        ` : `<div class="popup-date-chip">${dateStr}</div>`}
        <div class="popup-body">
          <div class="popup-title">${safeTitle}</div>
          <div class="popup-meta">
            <span class="material-icons popup-meta-icon">place</span>
            <span>${safeVenue} &middot; ${safeCity}</span>
          </div>
          ${event.priceRange ? `
            <div class="popup-price">
              <span class="material-icons popup-meta-icon">confirmation_number</span>
              From &euro;${event.priceRange.min}
            </div>
          ` : ''}
          <div class="popup-actions">
            <button class="action-btn ${interested ? 'active interested' : ''}"
              data-action="toggleInterested" data-id="${event.id}">
              <span class="material-icons action-icon">${interested ? 'star' : 'star_outline'}</span>
              Interested
            </button>
            <button class="action-btn ${going ? 'active going' : ''}"
              data-action="toggleGoing" data-id="${event.id}">
              <span class="material-icons action-icon">${going ? 'check_circle' : 'add_circle_outline'}</span>
              Going
            </button>
          </div>
          ${event.url ? `
            <a class="popup-tm-link" href="${encodeURI(event.url)}" target="_blank" rel="noopener noreferrer">
              <img src="${ticketmasterLogo}" alt="Ticketmaster" class="tm-logo" />
              <span class="tm-label">Get Tickets</span>
            </a>
          ` : ''}
        </div>
      </div>
      ${eventList.length > 1 ? `
        <div class="popup-nav">
          <button class="nav-btn" data-action="prev"><span class="material-icons">chevron_left</span></button>
          <div class="nav-dots">${currentIndex + 1} / ${eventList.length}</div>
          <button class="nav-btn" data-action="next"><span class="material-icons">chevron_right</span></button>
        </div>
      ` : ''}
    `;
  };

  render();

  let saving = false;
  container.addEventListener("click", async (e) => {
    const button = e.target.closest("button.nav-btn, button.action-btn");
    if (!button) return;
    const action = button.dataset.action;

    if (action === "next") { currentIndex = (currentIndex + 1) % eventList.length; render(); return; }
    if (action === "prev") { currentIndex = (currentIndex - 1 + eventList.length) % eventList.length; render(); return; }

    if (saving) return;
    saving = true;
    const id = button.dataset.id;
    try {
      if (action === "toggleInterested") await events.toggleInterested(id);
      if (action === "toggleGoing") await events.toggleGoing(id);
    } finally { saving = false; render(); }
  });

  return container;
}

function buildGeoJSON(eventList) {
  return {
    type: 'FeatureCollection',
    features: eventList.map((ev) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [ev.lng, ev.lat] },
      properties: {
        id: ev.id,
        title: ev.title,
        venue: ev.venue,
        city: ev.city,
        date: ev.date,
        image: ev.image || '',
        url: ev.url || '',
        category: ev.category || '',
        priceMin: ev.priceRange?.min ?? '',
        priceMax: ev.priceRange?.max ?? '',
        priceCurrency: ev.priceRange?.currency ?? '',
      },
    })),
  };
}

function buildHeatGeoJSON(eventList) {
  const festivalPattern = /festival|fest\b|open\s*air|multi[-\s]?day/i;
  return {
    type: 'FeatureCollection',
    features: eventList.map((ev) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [ev.lng, ev.lat] },
      properties: {
        weight: festivalPattern.test(ev.title) ? 3 : 1,
      },
    })),
  };
}

onMounted(async () => {
  await events.fetchNearby();

  const centerLng = events.userLng ?? 16.3738;
  const centerLat = events.userLat ?? 48.2082;

  map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [centerLng, centerLat],
    zoom: 10,
    pitch: 0,
    bearing: 0,
    antialias: true,
  });

  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

  map.on("load", () => {
    map.resize();

    // Add clustered GeoJSON source
    map.addSource('events', {
      type: 'geojson',
      data: buildGeoJSON(filteredEvents.value),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 60,
    });

    // Heatmap GeoJSON source (no clustering)
    map.addSource('events-heat', {
      type: 'geojson',
      data: buildHeatGeoJSON(filteredEvents.value),
    });

    // Cluster circle layer
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'events',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#a855f7',   // < 5
          5, '#ec4899', // 5-15
          15, '#f43f5e', // 15+
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          22,   // < 5
          5, 28, // 5-15
          15, 36, // 15+
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': 'rgba(255,255,255,0.25)',
        'circle-opacity': 0.9,
      },
    });

    // Cluster count label
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'events',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 13,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    // Individual event circles (unclustered)
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'events',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#a855f7',
        'circle-radius': 8,
        'circle-stroke-width': 3,
        'circle-stroke-color': 'rgba(255,255,255,0.9)',
      },
    });

    // Outer glow ring for unclustered
    map.addLayer({
      id: 'unclustered-glow',
      type: 'circle',
      source: 'events',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': 'rgba(168, 85, 247, 0.2)',
        'circle-radius': 18,
      },
    });

    // Heatmap density layer (hidden by default)
    map.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'events-heat',
      layout: { visibility: 'none' },
      paint: {
        'heatmap-weight': ['get', 'weight'],
        'heatmap-intensity': [
          'interpolate', ['linear'], ['zoom'],
          0, 1,
          12, 3,
        ],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0, 0, 0, 0)',
          0.2, '#a855f7',
          0.5, '#ec4899',
          0.8, '#f43f5e',
          1.0, '#ff2d55',
        ],
        'heatmap-radius': [
          'interpolate', ['linear'], ['zoom'],
          0, 15,
          6, 30,
          12, 50,
          16, 80,
        ],
        'heatmap-opacity': 0.75,
      },
    });

    // Click on cluster -> zoom in
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (!features.length) return;
      const clusterId = features[0].properties.cluster_id;
      map.getSource('events').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
          duration: 500,
        });
      });
    });

    // Click on individual point -> popup
    map.on('click', 'unclustered-point', (e) => {
      if (!e.features?.length) return;
      const coords = e.features[0].geometry.coordinates.slice();
      const props = e.features[0].properties;

      // Find the full event objects at this location (could be stacked)
      const eventsAtPoint = events.list.filter(
        (ev) => Math.abs(ev.lng - coords[0]) < 0.0001 && Math.abs(ev.lat - coords[1]) < 0.0001
      );
      const popupEvents = eventsAtPoint.length > 0 ? eventsAtPoint : [{
        id: props.id, title: props.title, venue: props.venue,
        city: props.city, date: props.date, image: props.image,
        url: props.url, category: props.category,
        priceRange: props.priceMin ? { min: props.priceMin, max: props.priceMax, currency: props.priceCurrency } : null,
      }];

      if (activePopup) activePopup.remove();
      activePopup = new mapboxgl.Popup({ offset: 10, maxWidth: '340px', closeButton: true, closeOnClick: false })
        .setLngLat(coords)
        .setDOMContent(buildEventPopup(popupEvents))
        .addTo(map);
    });

    // Cursor changes
    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });

    // Add user location marker
    if (events.userLat != null && events.userLng != null) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.innerHTML = '<div class="ulm-dot"></div><div class="ulm-ring"></div>';
      userMarker = new mapboxgl.Marker(el)
        .setLngLat([events.userLng, events.userLat])
        .addTo(map);
    }

    // Keep sources in sync when event list or filters change
    watch(() => events.list, () => updateMapSource(), { deep: true });
    watch(filteredEvents, () => updateMapSource());
  });

  document.addEventListener('click', onDocClick);
});

onUnmounted(() => {
  if (map) { map.remove(); map = null; }
  document.removeEventListener('click', onDocClick);
});
</script>

<style scoped>
.eventmap-page {
  position: relative;
  padding: 0 !important;
  overflow: hidden;
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 52px);
}

#map {
  width: 100%;
  height: 100%;
}

/* ---- Top bar ---- */
.map-topbar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(10, 10, 18, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 8px 18px;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.topbar-title {
  font-weight: 700;
  font-size: 14px;
  color: #fff;
  letter-spacing: -0.01em;
}
.topbar-right {
  display: flex;
  gap: 8px;
}
.topbar-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
  letter-spacing: 0.02em;
}
.topbar-badge.count {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}
.topbar-badge.loading {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.25);
}

/* ---- Search bar ---- */
.search-container {
  position: absolute;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 13;
  width: 380px;
  max-width: calc(100% - 32px);
}
.search-box {
  display: flex;
  align-items: center;
  background: rgba(10, 10, 18, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 0 4px 0 12px;
  height: 40px;
  gap: 6px;
}
.search-icon { color: rgba(255,255,255,0.4); flex-shrink: 0; }
.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  min-width: 0;
}
.search-input::placeholder { color: rgba(255,255,255,0.35); }
.search-clear {
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.search-clear:hover { color: #fff; }
.search-btn {
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border: none;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}
.search-btn:hover { opacity: 0.85; }
.search-btn:disabled { opacity: 0.5; cursor: default; }

/* Search results dropdown */
.search-results {
  margin-top: 4px;
  background: rgba(10, 10, 18, 0.92);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  max-height: 280px;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
.search-results::-webkit-scrollbar { width: 4px; }
.search-results::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
.search-loading, .search-empty {
  padding: 14px 16px;
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  text-align: center;
}
.search-result-item {
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.search-result-item:last-child { border-bottom: none; }
.search-result-item:hover { background: rgba(168, 85, 247, 0.12); }
.sr-title {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sr-meta {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- Filter bar ---- */
.filter-bar {
  position: absolute;
  top: 102px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 12;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 32px);
}
.filter-chips {
  display: flex;
  gap: 4px;
}
.filter-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(10, 10, 18, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: rgba(255,255,255,0.55);
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.filter-chip:hover {
  background: rgba(168, 85, 247, 0.12);
  border-color: rgba(168, 85, 247, 0.25);
  color: rgba(255,255,255,0.8);
}
.filter-chip.active {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.4);
  color: #c084fc;
}

/* Genre dropdown */
.genre-dropdown-wrapper {
  position: relative;
}
.genre-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(10, 10, 18, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: rgba(255,255,255,0.55);
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.genre-toggle:hover {
  background: rgba(168, 85, 247, 0.12);
  border-color: rgba(168, 85, 247, 0.25);
  color: rgba(255,255,255,0.8);
}
.genre-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 160px;
  max-height: 240px;
  overflow-y: auto;
  background: rgba(10, 10, 18, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}
.genre-dropdown::-webkit-scrollbar { width: 4px; }
.genre-dropdown::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
.genre-option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 7px 12px;
  border: none;
  background: none;
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.genre-option:hover {
  background: rgba(168, 85, 247, 0.12);
  color: #fff;
}
.genre-option.active {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}

/* Fade-drop transition for genre dropdown */
.fade-drop-enter-active,
.fade-drop-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-drop-enter-from,
.fade-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Filter count badge */
.filter-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #c084fc;
  padding: 4px 8px 4px 10px;
  border-radius: 10px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.25);
  white-space: nowrap;
}
.filter-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}
.filter-clear:hover {
  color: #fff;
}

/* ---- My location button ---- */
.locate-btn {
  position: absolute;
  bottom: 24px;
  left: 68px;
  z-index: 12;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(10, 10, 18, 0.8);
  backdrop-filter: blur(12px);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.locate-btn:hover {
  background: rgba(56, 189, 248, 0.3);
  border-color: rgba(56, 189, 248, 0.5);
}

/* ---- Panel toggle ---- */
.panel-toggle {
  position: absolute;
  bottom: 24px;
  left: 16px;
  z-index: 12;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(10, 10, 18, 0.8);
  backdrop-filter: blur(12px);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.panel-toggle:hover {
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
}

/* ---- Heatmap toggle ---- */
.heatmap-toggle {
  position: absolute;
  top: 108px;
  right: 16px;
  z-index: 12;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(10, 10, 18, 0.8);
  backdrop-filter: blur(12px);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.heatmap-toggle:hover {
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
}
.heatmap-toggle.active {
  background: rgba(168, 85, 247, 0.3);
  border-color: rgba(168, 85, 247, 0.5);
}

/* ---- Event list panel ---- */
.event-panel {
  position: absolute;
  top: 60px;
  left: 16px;
  bottom: 80px;
  width: 300px;
  z-index: 11;
  background: rgba(10, 10, 18, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5);
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.panel-heading {
  font-weight: 700;
  font-size: 14px;
  color: #fff;
}
.panel-close {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.panel-close:hover { color: #fff; }

.panel-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.panel-list::-webkit-scrollbar { width: 4px; }
.panel-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

.panel-card {
  display: flex;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.panel-card:hover {
  background: rgba(168, 85, 247, 0.1);
}
.panel-card-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 4px;
  border-radius: 10px;
  background: rgba(168, 85, 247, 0.12);
}
.pcd-month {
  font-size: 10px;
  font-weight: 700;
  color: #c084fc;
  letter-spacing: 0.05em;
}
.pcd-day {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
}
.panel-card-info {
  min-width: 0;
  flex: 1;
}
.pci-title {
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.pci-venue {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pci-city {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
}

/* Panel slide transition */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* ---- Responsive ---- */
@media (max-width: 600px) {
  .event-panel { width: calc(100% - 32px); bottom: 24px; }
  .map-topbar { width: calc(100% - 32px); }
  .filter-bar { flex-wrap: wrap; }
  .filter-chips { overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
</style>

<!-- Unscoped for mapbox popup overrides -->
<style>
/* ---- Liquid Glass Popup ---- */
.mapboxgl-popup-content {
  background: rgba(14, 14, 24, 0.78) !important;
  backdrop-filter: blur(20px) saturate(1.6) !important;
  -webkit-backdrop-filter: blur(20px) saturate(1.6) !important;
  padding: 0 !important;
  border-radius: 20px !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  overflow: hidden !important;
}
.mapboxgl-popup-tip {
  display: none !important;
}
.mapboxgl-popup-close-button {
  font-size: 18px !important;
  padding: 8px 10px !important;
  color: rgba(255, 255, 255, 0.5) !important;
  z-index: 5 !important;
  transition: color 0.15s ease !important;
}
.mapboxgl-popup-close-button:hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
}

/* Popup carousel */
.popup-carousel {
  min-width: 280px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
}

/* Hero image section */
.popup-hero {
  position: relative;
  height: 150px;
  overflow: hidden;
}
.popup-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}
.popup-img-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: linear-gradient(to top, rgba(14, 14, 24, 0.95), transparent);
  pointer-events: none;
}
.popup-date-float {
  position: absolute;
  bottom: 10px;
  left: 14px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: rgba(139, 92, 246, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 4px 10px;
  border-radius: 8px;
  letter-spacing: 0.02em;
}

/* Fallback date chip when no image */
.popup-date-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #c084fc;
  background: rgba(139, 92, 246, 0.15);
  padding: 4px 12px;
  border-radius: 8px;
  margin: 14px 14px 0;
}

/* Body */
.popup-body {
  padding: 14px 16px 16px;
}
.popup-title {
  font-weight: 800;
  font-size: 16px;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.popup-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 4px;
}
.popup-meta-icon {
  font-size: 15px !important;
  opacity: 0.6;
}
.popup-price {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: #34d399;
  margin-bottom: 14px;
}
.popup-price .popup-meta-icon {
  color: #34d399;
}

/* RSVP action buttons */
.popup-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  text-align: center;
  font-family: inherit;
}
.action-icon {
  font-size: 16px !important;
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}
.action-btn.active.interested {
  background: rgba(236, 72, 153, 0.15);
  border-color: rgba(236, 72, 153, 0.4);
  color: #f472b6;
}
.action-btn.active.going {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  color: #a78bfa;
}

/* Ticketmaster branded link */
.popup-tm-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  background: #026CDF;
  padding: 10px 16px;
  border-radius: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(2, 108, 223, 0.3);
}
.popup-tm-link:hover {
  background: #0580FF;
  box-shadow: 0 6px 24px rgba(2, 108, 223, 0.45);
  transform: translateY(-1px);
}
.tm-logo {
  height: 18px;
  width: auto;
  object-fit: contain;
  filter: brightness(10);
}
.tm-label {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.01em;
}

/* Carousel navigation */
.popup-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.nav-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.15s ease;
}
.nav-btn .material-icons {
  font-size: 20px !important;
}
.nav-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.nav-dots {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  flex: 1;
  text-align: center;
}

/* Mapbox controls */
.mapboxgl-ctrl-group {
  background: rgba(10, 10, 18, 0.75) !important;
  backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4) !important;
}
.mapboxgl-ctrl-group button {
  width: 36px !important;
  height: 36px !important;
}
.mapboxgl-ctrl-group button + button {
  border-top: 1px solid rgba(255,255,255,0.08) !important;
}
.mapboxgl-ctrl-group button .mapboxgl-ctrl-icon {
  filter: invert(1) !important;
}

/* Override Quasar page transforms that break mapbox */
.q-layout,
.q-page-container,
.q-page {
  transform: none !important;
}

/* User location marker */
.user-location-marker {
  width: 24px;
  height: 24px;
  position: relative;
}
.ulm-dot {
  width: 14px;
  height: 14px;
  background: #38bdf8;
  border: 3px solid #fff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.6);
  z-index: 2;
}
.ulm-ring {
  width: 28px;
  height: 28px;
  background: rgba(56, 189, 248, 0.2);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ulm-pulse 2s ease-out infinite;
  z-index: 1;
}
@keyframes ulm-pulse {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}
</style>