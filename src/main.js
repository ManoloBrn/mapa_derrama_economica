/**
 * EconHeat - Main Orchestrator and Application Entry Point
 */

import { PRESETS } from './config.js';
import { state } from './state.js';
import { 
  fetchOSMData, 
  parseOSMData, 
  loadGoogleMapsAPI, 
  fetchGooglePlacesData,
  searchAddressNominatim
} from './api.js';
import { generateSimulatedPOIs } from './simulator.js';
import { calculateEconomicImpact } from './calculator.js';
import { 
  initMap, 
  setView, 
  setEventLocation, 
  setRadius, 
  getEventLocation, 
  drawPoiMarkers, 
  updateHeatmap, 
  flyTo, 
  setCursor 
} from './map.js';
import { 
  registerUIEventListeners, 
  applyPresetToUI, 
  updateCoordsDisplay, 
  updateDashboardUI, 
  updateFormulaValuesInAccordion, 
  renderPOIListHTML, 
  getEventParams, 
  getApiKey, 
  isHeatmapChecked, 
  showToast, 
  toggleLoadingOverlay, 
  updateApiBadge, 
  formatCurrency, 
  formatNumber,
  showSuggestions,
  hideSuggestions,
  isExcludeEventSpendChecked
} from './ui.js';

// Cache for last calculated POIs to share with cross-hover events
let lastCalculatedPois = [];

/**
 * Orchestrates economic calculations and visual updates.
 */
function recalculate() {
  const params = getEventParams();
  const eventLatLng = getEventLocation();
  
  if (!eventLatLng) return;

  const result = calculateEconomicImpact({
    eventLat: eventLatLng.lat,
    eventLng: eventLatLng.lng,
    allPois: state.getAllPois(),
    ...params
  });

  // Store references for lists/marker cross-overs
  lastCalculatedPois = result.pois;

  const excludeEvent = isExcludeEventSpendChecked();

  // 1. Update general stats widgets
  updateDashboardUI(result, excludeEvent);

  // 2. Redraw Leaflet heatmap layer
  updateHeatmap(result.pois, isHeatmapChecked(), params.radiusMeters, excludeEvent);

  // 3. Render list items in sidebar
  renderPOIListHTML(result.pois, {
    onListItemHover: handleListItemHover,
    onListItemLeave: handleListItemLeave,
    onListItemClick: handleListItemClick
  });

  // 4. Draw markers on Leaflet map
  drawPoiMarkers(result.pois, formatCurrency, formatNumber, {
    onMarkerHover: handleMarkerHover,
    onMarkerLeave: handleMarkerLeave
  });

  // 5. Update accordion equation details
  updateFormulaValuesInAccordion(params);
}

/**
 * Coordinates POI fetching from either OSM, GCP, or Offline Fallback.
 */
async function loadAndQueryRealPOIs(lat, lng, radius) {
  const apiKey = getApiKey();
  toggleLoadingOverlay(true);

  try {
    if (apiKey) {
      updateApiBadge("Cargando Google Maps...", "google");
      await loadGoogleMapsAPI(apiKey);
      updateApiBadge("Google Places (GCP)", "google");
      state.pois = await fetchGooglePlacesData(lat, lng, radius);
      showToast("Lugares reales obtenidos de Google Places con éxito.");
    } else {
      updateApiBadge("Consultando OSM...", "osm");
      const osmElements = await fetchOSMData(lat, lng, radius);
      state.pois = parseOSMData(osmElements);
      showToast("Lugares reales obtenidos de OpenStreetMap.");
    }
  } catch (error) {
    console.error("API error, failing back to mock generation:", error);
    updateApiBadge("Simulación Offline (Error)", "error");
    state.pois = generateSimulatedPOIs(lat, lng, radius);
    showToast(`Error de conexión: ${error.message}. Usando simulación offline.`);
  } finally {
    toggleLoadingOverlay(false);
    recalculate();
  }
}

/**
 * Applies a selected preset and pulls surrounding POIs.
 */
async function applyPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;

  state.currentCenter = { ...preset };

  // Set inputs and sliders in UI
  applyPresetToUI(preset);

  // Update Leaflet Event elements
  setEventLocation(preset.lat, preset.lng);
  setRadius(preset.radius);
  setView(preset.lat, preset.lng, 14);

  // Update coordinate values text
  updateCoordsDisplay(preset.lat, preset.lng);

  // Fetch geographic points
  await loadAndQueryRealPOIs(preset.lat, preset.lng, preset.radius);
}

// === HANDLERS FOR MAP & PIN INTERACTIONS ===

async function handleMapClick(e) {
  if (state.isPlacingPoi && state.pendingPoiData) {
    const latlng = e.latlng;
    const newPoi = {
      id: `user-poi-${Date.now()}`,
      lat: latlng.lat,
      lng: latlng.lng,
      ...state.pendingPoiData
    };
    
    state.userPois.push(newPoi);
    cancelPlacingPoiMode();
    
    recalculate();
    showToast(`Punto "${newPoi.name}" agregado con éxito.`);
    return;
  }

  // If not placing POIs, move event center here
  const latlng = e.latlng;
  setEventLocation(latlng.lat, latlng.lng);
  await handleEventLocationChange(latlng);
}

async function handleMarkerDragEnd() {
  const latlng = getEventLocation();
  if (latlng) {
    await handleEventLocationChange(latlng);
  }
}

async function handleEventLocationChange(latlng) {
  updateCoordsDisplay(latlng.lat, latlng.lng);

  // Clear presets active button styling
  document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));

  // Load new POIs
  const params = getEventParams();
  await loadAndQueryRealPOIs(latlng.lat, latlng.lng, params.radiusMeters);
}

// === HANDLERS FOR UI CONTROLS ===

function handlePresetSelected(presetKey) {
  applyPreset(presetKey);
}

function handleParamChanged() {
  recalculate();
}

function handleRadiusSlide(val) {
  setRadius(val);
  recalculate(); // Instant distance recalculation on sliders move
}

async function handleRadiusChanged(val) {
  const latlng = getEventLocation();
  if (latlng) {
    await loadAndQueryRealPOIs(latlng.lat, latlng.lng, val);
  }
}

async function handleApiKeyChanged() {
  const latlng = getEventLocation();
  const params = getEventParams();
  if (latlng) {
    await loadAndQueryRealPOIs(latlng.lat, latlng.lng, params.radiusMeters);
  }
}

function handleHeatmapToggled() {
  recalculate();
}

function handleExcludeEventChanged() {
  recalculate();
}

async function handleRegenerateClicked() {
  const latlng = getEventLocation();
  const params = getEventParams();
  if (latlng) {
    await loadAndQueryRealPOIs(latlng.lat, latlng.lng, params.radiusMeters);
  }
}

async function handleClearClicked() {
  state.resetUserPois();
  const latlng = getEventLocation();
  const params = getEventParams();
  if (latlng) {
    await loadAndQueryRealPOIs(latlng.lat, latlng.lng, params.radiusMeters);
    showToast("Simulación reiniciada. Se eliminaron los puntos manuales.");
  }
}

function handleAddPoiCancelled() {
  cancelPlacingPoiMode();
}

function handleAddPoiConfirmed(customPoiData) {
  state.isPlacingPoi = true;
  state.pendingPoiData = customPoiData;
  setCursor('crosshair');
  showToast("Haz clic en cualquier parte del mapa para ubicar el nuevo comercio.");
}

function cancelPlacingPoiMode() {
  state.isPlacingPoi = false;
  state.pendingPoiData = null;
  setCursor('');
}

// === HANDLERS FOR SEARCH BAR ===

let searchTimeout = null;

function handleSearchInput(value) {
  if (searchTimeout) clearTimeout(searchTimeout);
  
  if (!value || value.trim().length < 3) {
    hideSuggestions();
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const results = await searchAddressNominatim(value);
      showSuggestions(results, handleSuggestionSelected);
    } catch (error) {
      console.error("Geocoding search failed:", error);
    }
  }, 450);
}

function handleSearchCleared() {
  // Clear suggestions and return
  hideSuggestions();
}

async function handleSuggestionSelected(lat, lon) {
  // 1. Set Leaflet Event Marker and view
  setEventLocation(lat, lon);
  updateCoordsDisplay(lat, lon);
  setView(lat, lon, 14);
  
  // 2. Clear presets buttons
  document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
  
  // 3. Load POIs
  const params = getEventParams();
  await loadAndQueryRealPOIs(lat, lon, params.radiusMeters);
}

// === HANDLERS FOR CROSS-HIGHLIGHTS (HOVERING LIST ITEM / MARKERS) ===

function handleListItemHover(poiId) {
  const poi = lastCalculatedPois.find(p => p.id === poiId);
  if (poi && poi.markerInstance) {
    poi.markerInstance.openPopup();
    const el = poi.markerInstance.getElement();
    if (el) {
      el.style.transform += ' scale(1.2) translateY(-4px)';
      el.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
  }
}

function handleListItemLeave(poiId) {
  const poi = lastCalculatedPois.find(p => p.id === poiId);
  if (poi && poi.markerInstance) {
    poi.markerInstance.closePopup();
    const el = poi.markerInstance.getElement();
    if (el) {
      el.style.transform = el.style.transform.replace(' scale(1.2) translateY(-4px)', '');
    }
  }
}

function handleListItemClick(lat, lng) {
  flyTo(lat, lng, 16);
}

function handleMarkerHover(poiId) {
  const listItem = document.getElementById(`poi-list-item-${poiId}`);
  if (listItem) {
    listItem.classList.add('active');
    listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function handleMarkerLeave(poiId) {
  const listItem = document.getElementById(`poi-list-item-${poiId}`);
  if (listItem) {
    listItem.classList.remove('active');
  }
}

// === INITIALIZATION ===
function init() {
  // 1. Initial render of Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
  
  // 2. Initialize Leaflet Map Wrapper
  initMap('map', state.currentCenter, state.currentCenter.radius, {
    onMapClick: handleMapClick,
    onMarkerDragEnd: handleMarkerDragEnd
  });
  
  // 3. Register UI controls listeners
  registerUIEventListeners({
    onPresetSelected: handlePresetSelected,
    onParamChanged: handleParamChanged,
    onRadiusSlide: handleRadiusSlide,
    onRadiusChanged: handleRadiusChanged,
    onApiKeyChanged: handleApiKeyChanged,
    onHeatmapToggled: handleHeatmapToggled,
    onRegenerateClicked: handleRegenerateClicked,
    onClearClicked: handleClearClicked,
    onAddPoiCancelled: handleAddPoiCancelled,
    onAddPoiConfirmed: handleAddPoiConfirmed,
    onSearchInput: handleSearchInput,
    onSearchCleared: handleSearchCleared,
    onExcludeEventChanged: handleExcludeEventChanged
  });
  
  // 4. Run default simulation preset
  applyPreset('azteca');
}

// Run application when script loads
init();
