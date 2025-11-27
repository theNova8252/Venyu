<template>
  <q-page class="q-pa-md">
    <div class="map-wrapper">
      <div id="map"></div>
    </div>
  </q-page>
</template>

<script setup>
import "mapbox-gl/dist/mapbox-gl.css";
import { onMounted } from "vue";
import mapboxgl from "mapbox-gl";
import { useEventsStore } from "@/stores/events";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const events = useEventsStore();

function buildCarouselPopup(group) {
  let currentIndex = 0;

  const container = document.createElement("div");
  container.className = "popup-carousel";

  const render = () => {
    const event = group[currentIndex];

    container.innerHTML = `
      <div class="popup-content">
        <div class="popup-title">${event.title}</div>
        <div class="popup-venue">${event.venue || "Venue"}</div>
        <div class="popup-location">${event.city}</div>
        <div class="popup-date">${new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })}</div>
        ${event.url ? `<a class="popup-link" href="${event.url}" target="_blank" rel="noopener">Get Tickets</a>` : ''}
      </div>
      
      ${group.length > 1 ? `
        <div class="popup-nav">
          <button class="nav-btn prev" data-action="prev">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="nav-counter">${currentIndex + 1} / ${group.length}</div>
          <button class="nav-btn next" data-action="next">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      ` : ''}
    `;
  };

  render();

  container.addEventListener("click", (e) => {
    const button = e.target.closest(".nav-btn");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "next") {
      currentIndex = (currentIndex + 1) % group.length;
    } else if (action === "prev") {
      currentIndex = (currentIndex - 1 + group.length) % group.length;
    }

    render();
  });

  return container;
}

onMounted(async () => {
  await events.fetchNearby();
  console.log("EVENTS FROM STORE:", events.list);

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [16.3738, 48.2082],
    zoom: 6.5,
    pitch: 0,
    bearing: 0,
    antialias: true
  });

  map.on("load", () => {
    map.resize();

    const groups = {};
    events.list.forEach((e) => {
      const lat = Number(e.lat);
      const lng = Number(e.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    Object.entries(groups).forEach(([key, group]) => {
      const [latStr, lngStr] = key.split(",");
      const lat = Number(latStr);
      const lng = Number(lngStr);

      const markerEl = document.createElement("div");
      markerEl.className = "venue-marker";
      markerEl.innerHTML = `
        <div class="marker-inner">
          <div class="marker-dot">
            <div class="marker-center"></div>
          </div>
          ${group.length > 1 ? `<div class="marker-badge">${group.length}</div>` : ''}
        </div>
      `;

      const popupEl = buildCarouselPopup(group);
      const popup = new mapboxgl.Popup({
        offset: 25,
        maxWidth: '320px',
        className: 'event-popup',
        closeButton: true,
        closeOnClick: false
      }).setDOMContent(popupEl);

      new mapboxgl.Marker(markerEl)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);
    });
  });
});
</script>

<style>
.map-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 80px);
  transform: none !important;
}

#map {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
}

.q-layout,
.q-page-container,
.q-page {
  transform: none !important;
}

/* Marker styles - CRITICAL: Simple structure for proper positioning */
.venue-marker {
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marker-inner {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.venue-marker:hover .marker-inner {
  transform: scale(1.25);
}

.marker-dot {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #ec4899 0%, #a855f7 100%);
  border: 4px solid white;
  border-radius: 50%;
  box-shadow:
    0 4px 20px rgba(236, 72, 153, 0.6),
    0 0 0 4px rgba(236, 72, 153, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
}

.venue-marker:hover .marker-dot {
  box-shadow:
    0 6px 30px rgba(236, 72, 153, 0.8),
    0 0 0 8px rgba(236, 72, 153, 0.15);
}

.marker-center {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  opacity: 0.9;
}

.marker-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  color: white;
  font-size: 11px;
  font-weight: 900;
  padding: 4px 7px;
  border-radius: 999px;
  border: 3px solid white;
  box-shadow: 0 3px 12px rgba(124, 58, 237, 0.6);
  min-width: 22px;
  text-align: center;
  line-height: 1;
  z-index: 10;
}

/* Popup styles */
.popup-carousel {
  min-width: 240px;
  color: #1a1a1a;
  font-family: system-ui, -apple-system, sans-serif;
}

.popup-content {
  padding: 4px;
}

.popup-title {
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 8px;
  color: #1a1a1a;
  line-height: 1.3;
}

.popup-venue {
  font-size: 13px;
  font-weight: 600;
  color: #4a4a4a;
  margin-bottom: 4px;
}

.popup-location {
  font-size: 12px;
  color: #6a6a6a;
  margin-bottom: 8px;
}

.popup-date {
  font-size: 12px;
  color: #8b5cf6;
  font-weight: 600;
  margin-bottom: 12px;
}

.popup-link {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  padding: 10px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3);
}

.popup-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.5);
}

.popup-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.nav-btn {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.nav-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  transform: scale(1.05);
}

.nav-btn:active {
  transform: scale(0.95);
}

.nav-counter {
  font-size: 12px;
  font-weight: 600;
  color: #6a6a6a;
  flex: 1;
  text-align: center;
}

:global(.mapbox-gl-popup-content) {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(0, 0, 0, 0.05);
}

:global(.mapbox-gl-popup-tip) {
  border-top-color: white !important;
}

:global(.mapbox-gl-popup-close-button) {
  font-size: 22px;
  padding: 8px 12px;
  color: #999;
  right: 10px;
  top: 10px;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

:global(.mapbox-gl-popup-close-button:hover) {
  background: rgba(236, 72, 153, 0.1);
  color: #ec4899;
  transform: scale(1.1);
}

:global(.mapbox-gl-popup-anchor-bottom .mapbox-gl-popup-tip) {
  border-top-color: white !important;
}

:global(.mapbox-gl-popup-anchor-top .mapbox-gl-popup-tip) {
  border-bottom-color: white !important;
}

:global(.mapbox-gl-popup-anchor-left .mapbox-gl-popup-tip) {
  border-right-color: white !important;
}

:global(.mapbox-gl-popup-anchor-right .mapbox-gl-popup-tip) {
  border-left-color: white !important;
}
</style>