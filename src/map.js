/**
 * EconHeat - Leaflet Map Controller
 */

// Global reference to Leaflet instances
let map = null;
let eventMarker = null;
let radiusCircle = null;
let heatmapLayer = null;
let poiMarkers = [];

/**
 * Initializes the Leaflet map and event/radius layers.
 */
export function initMap(elementId, center, radius, callbacks) {
  // 1. Create Map Instance
  map = L.map(elementId, {
    zoomControl: false,
    minZoom: 11,
    maxZoom: 18
  }).setView([center.lat, center.lng], 14);

  // 2. Add Zoom Control
  L.control.zoom({
    position: 'bottomright'
  }).addTo(map);

  // 3. Add Dark Matter Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // 4. Custom pulsing Icon for Event
  const pulsingIcon = L.divIcon({
    className: 'pulsing-marker',
    html: '<div class="pulse-ring"></div><div class="pulse-center"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // 5. Place Event Marker
  eventMarker = L.marker([center.lat, center.lng], {
    icon: pulsingIcon,
    draggable: true
  }).addTo(map);

  // 6. Place Search Radius Circle
  radiusCircle = L.circle([center.lat, center.lng], {
    radius: radius,
    color: 'var(--accent-blue)',
    fillColor: 'var(--accent-blue-glow)',
    fillOpacity: 0.08,
    weight: 1.5,
    dashArray: '5, 5'
  }).addTo(map);

  // 7. Initialize Heatmap Layer
  heatmapLayer = L.heatLayer([], {
    radius: 35,
    blur: 25,
    maxZoom: 17,
    gradient: {
      0.2: 'rgba(0, 0, 255, 0.4)',
      0.4: 'rgba(0, 255, 0, 0.6)',
      0.6: 'rgba(255, 255, 0, 0.8)',
      0.8: 'rgba(255, 128, 0, 0.9)',
      1.0: 'rgba(255, 0, 0, 1.0)'
    }
  }).addTo(map);

  // 8. Bind Events
  if (callbacks.onMapClick) {
    map.on('click', callbacks.onMapClick);
  }
  if (callbacks.onMarkerDragEnd) {
    eventMarker.on('dragend', callbacks.onMarkerDragEnd);
  }
}

export function getEventLocation() {
  return eventMarker ? eventMarker.getLatLng() : null;
}

export function setEventLocation(lat, lng) {
  if (eventMarker) eventMarker.setLatLng([lat, lng]);
  if (radiusCircle) radiusCircle.setLatLng([lat, lng]);
}

export function setRadius(radiusMeters) {
  if (radiusCircle) radiusCircle.setRadius(radiusMeters);
}

export function setView(lat, lng, zoom = 14) {
  if (map) map.setView([lat, lng], zoom);
}

export function flyTo(lat, lng, zoom = 16) {
  if (map) map.flyTo([lat, lng], zoom);
}

export function setCursor(cursorStyle) {
  const mapDiv = document.getElementById('map');
  if (mapDiv) mapDiv.style.cursor = cursorStyle;
}

/**
 * Clears old POI markers from the map.
 */
export function clearPoiMarkers() {
  poiMarkers.forEach(marker => {
    if (map) map.removeLayer(marker);
  });
  poiMarkers = [];
}

/**
 * Draws new markers on the map for active POIs.
 * Receives formatters to prevent coupling to UI rendering text values.
 */
export function drawPoiMarkers(activePois, formatCurrency, formatNumber, callbacks) {
  clearPoiMarkers();

  activePois.forEach(poi => {
    let iconName = 'store';
    if (poi.type === 'hotel') iconName = 'hotel';
    if (poi.type === 'metro') iconName = 'subway';
    if (poi.type === 'restaurant') iconName = 'utensils';
    if (poi.type === 'bar') iconName = 'beer';

    const customMarkerIcon = L.divIcon({
      className: `custom-map-poi poi-${poi.type}-marker`,
      html: `<div class="poi-map-marker-pin"><i data-lucide="${iconName}"></i></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    const mapMarker = L.marker([poi.lat, poi.lng], {
      icon: customMarkerIcon,
      title: poi.name
    }).addTo(map);

    poiMarkers.push(mapMarker);

    // Save map marker reference for hover cross-highlighting
    poi.markerInstance = mapMarker;

    // Create Popup content
    let synergyText = '';
    if (poi.type === 'oxxo' && poi.metroSynergy) {
      synergyText = `<div style="margin-top: 4px; font-size: 11px; color: var(--accent-transport); font-weight: 500;">
        <i data-lucide="sparkles" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 2px;"></i>
        Sinergia: +${poi.metroSynergy.boostPct}% por cercanía a ${poi.metroSynergy.stationName} (${poi.metroSynergy.distance}m)
      </div>`;
    }

    const markerColorClass = `popup-${poi.type}-text`;
    const popupContent = `
      <div class="popup-title ${markerColorClass}">
        ${poi.name}
      </div>
      <div class="popup-desc">
        ${poi.type === 'oxxo' ? `Oxxo / Tienda de conveniencia.<br>Ticket estimado: ${formatCurrency(poi.calculatedTicket || 95)} MXN<br>Tasa captación: ${Math.round((poi.calculatedCaptureRate || 0) * 100)}%${synergyText}` : ''}
        ${poi.type === 'hotel' ? `Hotel / Alojamiento.<br>${poi.rooms || 120} habitaciones.<br>Tarifa: ${formatCurrency(poi.calculatedRate || 1600)} MXN<br>Ocupación: ${Math.round((poi.calculatedOccupancy || 0) * 100)}%` : ''}
        ${poi.type === 'metro' ? `Estación de metro.<br>Gasto tránsito: ${formatCurrency(poi.calculatedTicket || 35)} MXN<br>Uso tránsito: ${Math.round((poi.calculatedUsage || 0) * 100)}%` : ''}
        ${poi.type === 'restaurant' ? `Restaurante / Cafetería.<br>Ticket estimado: ${formatCurrency(poi.calculatedTicket || 180)} MXN<br>Tasa captación: ${Math.round((poi.calculatedCaptureRate || 0) * 100)}%` : ''}
        ${poi.type === 'bar' ? `Bar / Cantina / Pub.<br>Ticket estimado: ${formatCurrency(poi.calculatedTicket || 250)} MXN<br>Tasa captación: ${Math.round((poi.calculatedCaptureRate || 0) * 100)}%` : ''}
        <br>Distancia: ${Math.round(poi.distance)}m
      </div>
      <div class="popup-impact">
        Derrama generada: ${formatCurrency(poi.impact)} MXN
      </div>
    `;

    mapMarker.bindPopup(popupContent);

    // Bind hover trigger callbacks
    mapMarker.on('mouseover', () => {
      if (callbacks.onMarkerHover) callbacks.onMarkerHover(poi.id);
    });
    mapMarker.on('mouseout', () => {
      if (callbacks.onMarkerLeave) callbacks.onMarkerLeave(poi.id);
    });
  });

  // Re-render Lucide icons inside custom markers
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Updates the Heatmap layer points.
 */
export function updateHeatmap(allPois, showHeatmap, radiusMeters, excludeEvent = false) {
  if (!heatmapLayer) return;

  if (!showHeatmap) {
    heatmapLayer.setLatLngs([]);
    return;
  }

  const points = [];
  const eventLatLng = getEventLocation();
  if (!eventLatLng) return;

  // 1. Core Event Center (Intensity 1.0) - only add if NOT excluded
  if (!excludeEvent) {
    points.push([eventLatLng.lat, eventLatLng.lng, 1.0]);
  }

  // 2. Add POIs with active impact
  allPois.forEach(poi => {
    if (poi.impact > 0 && poi.distance <= radiusMeters) {
      const maxExpectedImpact = 350000;
      const ratio = Math.min(poi.impact / maxExpectedImpact, 1.0);
      const intensity = 0.2 + (ratio * 0.7);
      
      points.push([poi.lat, poi.lng, intensity]);
    }
  });

  heatmapLayer.setLatLngs(points);
}
