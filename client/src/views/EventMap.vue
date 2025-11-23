<template>
  <q-page class="q-pa-md">
    <div id="map"></div>
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
    center: [16.3738, 48.2082], // Vienna
    zoom: 4,
  });

  map.on("load", () => {
    // Group events by coordinates
    const groups = {};
    events.list.forEach((e) => {
      const lat = Number(e.lat);
      const lng = Number(e.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    // Create ONE marker per venue with carousel popup
    Object.entries(groups).forEach(([key, group]) => {
      const [latStr, lngStr] = key.split(",");
      const lat = Number(latStr);
      const lng = Number(lngStr);

      // Create custom marker
      const markerEl = document.createElement("div");
      markerEl.className = "venue-marker";
      markerEl.innerHTML = `
        <div class="marker-dot"></div>
        ${group.length > 1 ? `<div class="marker-badge">${group.length}</div>` : ''}
      `;

      // Create popup with carousel
      const popupEl = buildCarouselPopup(group);
      const popup = new mapboxgl.Popup({
        offset: 25,
        maxWidth: '300px',
        className: 'event-popup'
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
#map {
  width: 100%;
  height: calc(100vh - 80px);
  border-radius: 16px;
  overflow: hidden;
}

/* Marker styles */
.venue-marker {
  position: relative;
  width: 20px;
  height: 20px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.venue-marker:hover {
  transform: scale(1.15);
}

.marker-dot {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #ec4899, #a855f7);
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 12px rgba(236, 72, 153, 0.6);
}

.marker-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #8b5cf6;
  color: white;
  font-size: 10px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 999px;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  min-width: 18px;
  text-align: center;
}

/* Popup carousel */
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

/* Navigation controls */
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

/* Override Mapbox popup styles */
:global(.mapbox-gl-popup-content) {
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

:global(.mapbox-gl-popup-tip) {
  border-top-color: white;
}

:global(.mapbox-gl-popup-close-button) {
  font-size: 20px;
  padding: 6px 10px;
  color: #999;
  right: 8px;
  top: 8px;
}

:global(.mapbox-gl-popup-close-button:hover) {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}
</style>