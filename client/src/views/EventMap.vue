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
        <div class="topbar-badge count">{{ events.list.length }} events</div>
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

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const events = useEventsStore();
const panelOpen = ref(false);
const searchQuery = ref('');
const showSearchResults = ref(false);
const heatmapActive = ref(false);
let map = null;
let activePopup = null;
let userMarker = null;

const sortedEvents = computed(() =>
  [...events.list].sort((a, b) => new Date(a.date) - new Date(b.date))
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
    activePopup = new mapboxgl.Popup({ offset: 18, maxWidth: '320px', closeButton: true, closeOnClick: false })
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
}

function updateMapSource() {
  if (!map) return;
  if (map.getSource('events')) {
    map.getSource('events').setData(buildGeoJSON(events.list));
  }
  if (map.getSource('events-heat')) {
    map.getSource('events-heat').setData(buildHeatGeoJSON(events.list));
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
        ${event.image ? `<div class="popup-img" style="background-image:url('${encodeURI(event.image)}')"></div>` : ''}
        <div class="popup-body">
          <div class="popup-date-chip">${dateStr}</div>
          <div class="popup-title">${safeTitle}</div>
          <div class="popup-venue-row">
            <span class="popup-venue-icon">📍</span>
            <span>${safeVenue} · ${safeCity}</span>
          </div>
          ${event.priceRange ? `<div class="popup-price">From €${event.priceRange.min}</div>` : ''}
          <div class="popup-actions">
            <button class="action-btn ${interested ? 'active interested' : ''}"
              data-action="toggleInterested" data-id="${event.id}">
              ${interested ? '★ Interested' : '☆ Interested'}
            </button>
            <button class="action-btn ${going ? 'active going' : ''}"
              data-action="toggleGoing" data-id="${event.id}">
              ${going ? '✔ Going' : '+ Going'}
            </button>
          </div>
          ${event.url ? `<a class="popup-link" href="${encodeURI(event.url)}" target="_blank" rel="noopener noreferrer">Get Tickets →</a>` : ''}
        </div>
      </div>
      ${eventList.length > 1 ? `
        <div class="popup-nav">
          <button class="nav-btn" data-action="prev">‹</button>
          <div class="nav-counter">${currentIndex + 1} / ${eventList.length}</div>
          <button class="nav-btn" data-action="next">›</button>
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
      data: buildGeoJSON(events.list),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 60,
    });

    // Heatmap GeoJSON source (no clustering)
    map.addSource('events-heat', {
      type: 'geojson',
      data: buildHeatGeoJSON(events.list),
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
      activePopup = new mapboxgl.Popup({ offset: 18, maxWidth: '320px', closeButton: true, closeOnClick: false })
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

    // Keep sources in sync when event list changes
    watch(() => events.list, () => updateMapSource(), { deep: true });
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
}
</style>

<!-- Unscoped for mapbox popup overrides -->
<style>
/* Popup card */
.popup-carousel {
  min-width: 260px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
}
.popup-card {
  overflow: hidden;
}
.popup-img {
  width: 100%;
  height: 120px;
  background-size: cover;
  background-position: center;
  border-radius: 10px;
  margin-bottom: 12px;
}
.popup-body {
  padding: 0 2px;
}
.popup-date-chip {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.1);
  padding: 3px 10px;
  border-radius: 99px;
  margin-bottom: 8px;
}
.popup-title {
  font-weight: 800;
  font-size: 15px;
  color: #1a1a1a;
  line-height: 1.3;
  margin-bottom: 6px;
}
.popup-venue-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6a6a6a;
  margin-bottom: 4px;
}
.popup-venue-icon { font-size: 13px; }
.popup-price {
  font-size: 12px;
  font-weight: 700;
  color: #059669;
  margin-bottom: 10px;
}

.popup-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.action-btn {
  flex: 1;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.03);
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #555;
  white-space: nowrap;
  text-align: center;
}
.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.action-btn.active.interested {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(236, 72, 153, 0.06));
  border-color: rgba(236, 72, 153, 0.35);
  color: #db2777;
}
.action-btn.active.going {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.06));
  border-color: rgba(139, 92, 246, 0.35);
  color: #7c3aed;
}

.popup-link {
  display: block;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  padding: 10px 16px;
  border-radius: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}
.popup-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(168, 85, 247, 0.45);
}

.popup-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.nav-btn {
  background: rgba(139, 92, 246, 0.08);
  border: 1.5px solid rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  padding: 0;
  transition: all 0.15s ease;
}
.nav-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
}
.nav-counter {
  font-size: 12px;
  font-weight: 600;
  color: #888;
  flex: 1;
  text-align: center;
}

/* Mapbox popup overrides */
.mapboxgl-popup-content {
  background: #fff !important;
  padding: 16px !important;
  border-radius: 16px !important;
  box-shadow: 0 12px 48px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04) !important;
}
.mapboxgl-popup-tip {
  border-top-color: #fff !important;
}
.mapboxgl-popup-anchor-top .mapboxgl-popup-tip { border-bottom-color: #fff !important; }
.mapboxgl-popup-anchor-left .mapboxgl-popup-tip { border-right-color: #fff !important; }
.mapboxgl-popup-anchor-right .mapboxgl-popup-tip { border-left-color: #fff !important; }

.mapboxgl-popup-close-button {
  font-size: 20px;
  padding: 6px 10px;
  color: #aaa;
  transition: color 0.15s ease;
}
.mapboxgl-popup-close-button:hover {
  color: #ec4899;
  background: rgba(236, 72, 153, 0.08);
  border-radius: 6px;
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