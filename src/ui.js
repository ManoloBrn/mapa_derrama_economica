/**
 * EconHeat - UI and DOM Controller
 */

// Cache DOM elements
const elements = {
  eventName: document.getElementById('event-name'),
  eventAttendance: document.getElementById('event-attendance'),
  attendanceVal: document.getElementById('attendance-val'),
  eventTicketPrice: document.getElementById('event-ticket-price'),
  eventTicketPriceVal: document.getElementById('event-ticket-price-val'),
  eventVenueSpend: document.getElementById('event-venue-spend'),
  eventVenueSpendVal: document.getElementById('event-venue-spend-val'),
  searchRadius: document.getElementById('search-radius'),
  radiusVal: document.getElementById('radius-val'),
  radiusDescVal: document.getElementById('radius-desc-val'),
  
  oxxoTicket: document.getElementById('oxxo-ticket'),
  oxxoTicketVal: document.getElementById('oxxo-ticket-val'),
  oxxoCapture: document.getElementById('oxxo-capture'),
  oxxoCaptureVal: document.getElementById('oxxo-capture-val'),
  
  hotelRate: document.getElementById('hotel-rate'),
  hotelRateVal: document.getElementById('hotel-rate-val'),
  hotelOccupancy: document.getElementById('hotel-occupancy'),
  hotelOccupancyVal: document.getElementById('hotel-occupancy-val'),
  
  metroUsage: document.getElementById('metro-usage'),
  metroUsageVal: document.getElementById('metro-usage-val'),
  metroTicket: document.getElementById('metro-ticket'),
  metroTicketVal: document.getElementById('metro-ticket-val'),

  restaurantTicket: document.getElementById('restaurant-ticket'),
  restaurantTicketVal: document.getElementById('restaurant-ticket-val'),
  restaurantCapture: document.getElementById('restaurant-capture'),
  restaurantCaptureVal: document.getElementById('restaurant-capture-val'),

  barTicket: document.getElementById('bar-ticket'),
  barTicketVal: document.getElementById('bar-ticket-val'),
  barCapture: document.getElementById('bar-capture'),
  barCaptureVal: document.getElementById('bar-capture-val'),
  
  googleApiKey: document.getElementById('google-api-key'),
  apiStatusBadge: document.getElementById('api-status-badge'),
  mapLoadingOverlay: document.getElementById('map-loading-overlay'),
  toggleHeatmap: document.getElementById('toggle-heatmap'),
  
  totalImpactValue: document.getElementById('total-impact-value'),
  breakdownValEvent: document.getElementById('breakdown-val-event'),
  breakdownValOxxo: document.getElementById('breakdown-val-oxxo'),
  breakdownValHotel: document.getElementById('breakdown-val-hotel'),
  breakdownValMetro: document.getElementById('breakdown-val-metro'),
  breakdownValRestaurant: document.getElementById('breakdown-val-restaurant'),
  breakdownValBar: document.getElementById('breakdown-val-bar'),
  
  pctEvent: document.getElementById('pct-event'),
  pctOxxo: document.getElementById('pct-oxxo'),
  pctHotel: document.getElementById('pct-hotel'),
  pctMetro: document.getElementById('pct-metro'),
  pctRestaurant: document.getElementById('pct-restaurant'),
  pctBar: document.getElementById('pct-bar'),
  
  segmentEvent: document.getElementById('segment-event'),
  segmentOxxo: document.getElementById('segment-oxxo'),
  segmentHotel: document.getElementById('segment-hotel'),
  segmentMetro: document.getElementById('segment-metro'),
  segmentRestaurant: document.getElementById('segment-restaurant'),
  segmentBar: document.getElementById('segment-bar'),
  chartCenterPct: document.getElementById('chart-center-pct'),
  
  poisCount: document.getElementById('pois-count'),
  poisListContainer: document.getElementById('pois-list-container'),
  btnRegeneratePois: document.getElementById('btn-regenerate-pois'),
  btnClearMap: document.getElementById('btn-clear-map'),
  
  sidebar: document.getElementById('sidebar'),
  sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
  
  addPoiDialog: document.getElementById('add-poi-dialog'),
  btnAddPoi: document.getElementById('btn-add-poi'),
  btnCloseDialog: document.getElementById('btn-close-dialog'),
  btnCancelPoi: document.getElementById('btn-cancel-poi'),
  btnConfirmPoiPlace: document.getElementById('btn-confirm-poi-place'),
  newPoiType: document.getElementById('new-poi-type'),
  newPoiName: document.getElementById('new-poi-name'),
  newPoiTicket: document.getElementById('new-poi-ticket'),
  newPoiRooms: document.getElementById('new-poi-rooms'),
  newPoiRate: document.getElementById('new-poi-rate'),
  newPoiFlow: document.getElementById('new-poi-flow'),
  
  fieldOxxoGroup: document.getElementById('field-oxxo-group'),
  fieldHotelGroup: document.getElementById('field-hotel-group'),
  fieldMetroGroup: document.getElementById('field-metro-group'),
  
  currentCoordsVal: document.getElementById('current-coords-val'),
  mapToast: document.getElementById('map-toast'),

  addressSearchInput: document.getElementById('address-search-input'),
  btnSearchClear: document.getElementById('btn-search-clear'),
  searchSuggestions: document.getElementById('search-suggestions'),
  excludeEventSpend: document.getElementById('exclude-event-spend')
};

// Formatting helpers
export function formatCurrency(val) {
  return '$' + parseFloat(val).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatCurrencyCompact(val) {
  if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return '$' + (val / 1000).toFixed(1) + 'k';
  return '$' + Math.round(val);
}

export function formatNumber(val) {
  return parseInt(val).toLocaleString('es-MX');
}

/**
 * Returns all slider variables as a structured object.
 */
export function getEventParams() {
  return {
    radiusMeters: parseInt(elements.searchRadius.value),
    attendance: parseInt(elements.eventAttendance.value),
    ticketPrice: parseFloat(elements.eventTicketPrice.value),
    venueSpend: parseFloat(elements.eventVenueSpend.value),
    oxxoTicket: parseFloat(elements.oxxoTicket.value),
    oxxoCaptureRate: parseFloat(elements.oxxoCapture.value) / 100,
    hotelRate: parseFloat(elements.hotelRate.value),
    hotelOccupancy: parseFloat(elements.hotelOccupancy.value) / 100,
    metroUsage: parseFloat(elements.metroUsage.value) / 100,
    metroTicket: parseFloat(elements.metroTicket.value),
    restaurantTicket: parseFloat(elements.restaurantTicket.value),
    restaurantCaptureRate: parseFloat(elements.restaurantCapture.value) / 100,
    barTicket: parseFloat(elements.barTicket.value),
    barCaptureRate: parseFloat(elements.barCapture.value) / 100
  };
}

export function getApiKey() {
  return elements.googleApiKey.value.trim();
}

export function isHeatmapChecked() {
  return elements.toggleHeatmap.checked;
}

/**
 * Sets values inside inputs and badges for a given preset configuration.
 */
export function applyPresetToUI(preset) {
  elements.eventName.value = preset.name;
  
  elements.eventAttendance.value = preset.attendance;
  elements.attendanceVal.textContent = formatNumber(preset.attendance) + ' personas';

  elements.eventTicketPrice.value = preset.ticketPrice || 350;
  elements.eventTicketPriceVal.textContent = formatCurrency(preset.ticketPrice || 350) + ' MXN';

  elements.eventVenueSpend.value = preset.venueSpend || 100;
  elements.eventVenueSpendVal.textContent = formatCurrency(preset.venueSpend || 100) + ' MXN';

  elements.searchRadius.value = preset.radius;
  elements.radiusVal.textContent = formatNumber(preset.radius) + ' m';
  elements.radiusDescVal.textContent = (preset.radius / 1000).toFixed(1);

  clearSearchInput();
}

export function updateCoordsDisplay(lat, lng) {
  elements.currentCoordsVal.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}

export function toggleLoadingOverlay(show) {
  if (show) {
    elements.mapLoadingOverlay.classList.remove('hide');
  } else {
    elements.mapLoadingOverlay.classList.add('hide');
  }
}

export function updateApiBadge(provider, styleClass) {
  elements.apiStatusBadge.textContent = provider;
  if (styleClass === 'google') {
    elements.apiStatusBadge.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
    elements.apiStatusBadge.style.color = "#3b82f6";
    elements.apiStatusBadge.style.borderColor = "rgba(59, 130, 246, 0.3)";
  } else if (styleClass === 'osm') {
    elements.apiStatusBadge.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
    elements.apiStatusBadge.style.color = "var(--accent-oxxo)";
    elements.apiStatusBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
  } else if (styleClass === 'error') {
    elements.apiStatusBadge.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
    elements.apiStatusBadge.style.color = "#ef4444";
    elements.apiStatusBadge.style.borderColor = "rgba(239, 68, 68, 0.3)";
  }
}

export function animateCounter(elementId, targetVal, prefix = '') {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (element.animationFrameId) {
    cancelAnimationFrame(element.animationFrameId);
  }

  const duration = 800; // ms
  const startTime = performance.now();
  
  // Cleanly read or initialize the start value using a property on the element object
  let startVal = element.currentVal;
  if (startVal === undefined) {
    let currentText = (element.textContent || '').replace(/[^0-9.-]/g, '');
    startVal = parseFloat(currentText) || 0;
  }
  
  if (Math.abs(targetVal - startVal) < 1) {
    element.currentVal = targetVal;
    element.textContent = prefix + targetVal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';
    return;
  }

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = progress * (2 - progress);
    const currentVal = startVal + (targetVal - startVal) * easeProgress;
    
    element.currentVal = currentVal;
    element.textContent = prefix + currentVal.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' MXN';

    if (progress < 1) {
      element.animationFrameId = requestAnimationFrame(update);
    }
  }

  element.animationFrameId = requestAnimationFrame(update);
}

/**
 * Displays floating messages/toasts.
 */
export function showToast(message) {
  elements.mapToast.querySelector('span').textContent = message;
  elements.mapToast.classList.add('show');
  
  if (elements.mapToast.timeoutId) clearTimeout(elements.mapToast.timeoutId);
  
  elements.mapToast.timeoutId = setTimeout(() => {
    elements.mapToast.classList.remove('show');
  }, 4500);
}

/**
 * Renders autocomplete suggestions below the address search input.
 */
export function showSuggestions(results, onSuggestionClick) {
  elements.searchSuggestions.innerHTML = '';
  
  if (results.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'suggestion-item-empty';
    emptyDiv.textContent = 'No se encontraron resultados';
    elements.searchSuggestions.appendChild(emptyDiv);
  } else {
    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = res.display_name;
      item.title = res.display_name;
      
      item.addEventListener('click', () => {
        elements.addressSearchInput.value = res.display_name;
        elements.searchSuggestions.classList.add('hide');
        if (onSuggestionClick) onSuggestionClick(res.lat, res.lon);
      });
      
      elements.searchSuggestions.appendChild(item);
    });
  }
  
  elements.searchSuggestions.classList.remove('hide');
}

export function hideSuggestions() {
  elements.searchSuggestions.classList.add('hide');
}

export function clearSearchInput() {
  elements.addressSearchInput.value = '';
  elements.btnSearchClear.classList.add('hide');
  hideSuggestions();
}

/**
 * Renders calculated data to the dashboard widgets and segments.
 */
export function isExcludeEventSpendChecked() {
  return elements.excludeEventSpend.checked;
}

export function updateDashboardUI(data, excludeEvent = false) {
  // 1. Calculate displayed total based on whether event spend is excluded
  const displayTotal = excludeEvent 
    ? (data.oxxo + data.hotel + data.metro + data.restaurant + data.bar) 
    : data.total;

  // Total Economic Impact animated counter
  animateCounter('total-impact-value', displayTotal, '$');

  // 2. Breakdown values
  elements.breakdownValEvent.textContent = formatCurrency(data.event);
  elements.breakdownValOxxo.textContent = formatCurrency(data.oxxo);
  elements.breakdownValHotel.textContent = formatCurrency(data.hotel);
  elements.breakdownValMetro.textContent = formatCurrency(data.metro);
  elements.breakdownValRestaurant.textContent = formatCurrency(data.restaurant);
  elements.breakdownValBar.textContent = formatCurrency(data.bar);

  // Toggle visual line-through style on the direct event breakdown row
  if (excludeEvent) {
    elements.breakdownValEvent.parentElement.classList.add('muted-excluded');
  } else {
    elements.breakdownValEvent.parentElement.classList.remove('muted-excluded');
  }

  // 3. Percentages (Summing to 100% excluding event if checked)
  const total = displayTotal || 1;
  const pctEvent = excludeEvent ? 0 : Math.round((data.event / total) * 100);
  const pctOxxo = Math.round((data.oxxo / total) * 100);
  const pctHotel = Math.round((data.hotel / total) * 100);
  const pctMetro = Math.round((data.metro / total) * 100);
  const pctRestaurant = Math.round((data.restaurant / total) * 100);
  const pctBar = 100 - pctEvent - pctOxxo - pctHotel - pctMetro - pctRestaurant;

  elements.pctEvent.textContent = `${pctEvent}%`;
  elements.pctOxxo.textContent = `${pctOxxo}%`;
  elements.pctHotel.textContent = `${pctHotel}%`;
  elements.pctMetro.textContent = `${pctMetro}%`;
  elements.pctRestaurant.textContent = `${pctRestaurant}%`;
  elements.pctBar.textContent = `${pctBar}%`;

  // Toggle display of Event in chart legend
  const eventLegendItem = document.querySelector('.legend-item[data-segment="event"]');
  if (eventLegendItem) {
    if (excludeEvent) {
      eventLegendItem.classList.add('hide');
    } else {
      eventLegendItem.classList.remove('hide');
    }
  }

  // 4. Donut Chart SVG Segments
  const perimeter = 251.2;
  
  const dashEvent = (pctEvent / 100) * perimeter;
  elements.segmentEvent.style.strokeDasharray = `${dashEvent} ${perimeter}`;
  elements.segmentEvent.style.strokeDashoffset = perimeter - dashEvent;

  const dashOxxo = (pctOxxo / 100) * perimeter;
  const offsetOxxo = (perimeter - dashEvent) - dashOxxo;
  elements.segmentOxxo.style.strokeDasharray = `${dashOxxo} ${perimeter}`;
  elements.segmentOxxo.style.strokeDashoffset = offsetOxxo;

  const dashHotel = (pctHotel / 100) * perimeter;
  const offsetHotel = offsetOxxo - dashHotel;
  elements.segmentHotel.style.strokeDasharray = `${dashHotel} ${perimeter}`;
  elements.segmentHotel.style.strokeDashoffset = offsetHotel;

  const dashMetro = (pctMetro / 100) * perimeter;
  const offsetMetro = offsetHotel - dashMetro;
  elements.segmentMetro.style.strokeDasharray = `${dashMetro} ${perimeter}`;
  elements.segmentMetro.style.strokeDashoffset = offsetMetro;

  const dashRestaurant = (pctRestaurant / 100) * perimeter;
  const offsetRestaurant = offsetMetro - dashRestaurant;
  elements.segmentRestaurant.style.strokeDasharray = `${dashRestaurant} ${perimeter}`;
  elements.segmentRestaurant.style.strokeDashoffset = offsetRestaurant;

  const dashBar = (pctBar / 100) * perimeter;
  const offsetBar = offsetRestaurant - dashBar;
  elements.segmentBar.style.strokeDasharray = `${dashBar} ${perimeter}`;
  elements.segmentBar.style.strokeDashoffset = offsetBar;

  elements.chartCenterPct.textContent = '100%';
}

/**
 * Updates UI representation values inside the Math formulas section.
 */
export function updateFormulaValuesInAccordion(data) {
  document.querySelector('.val-var-a').textContent = formatNumber(data.attendance);
  document.querySelector('.val-var-ticketprice').textContent = formatCurrency(data.ticketPrice) + ' MXN';
  document.querySelector('.val-var-venuespend').textContent = formatCurrency(data.venueSpend) + ' MXN';
  document.querySelector('.val-var-oxxoticket').textContent = formatCurrency(data.oxxoTicket) + ' MXN';
  document.querySelector('.val-var-oxxocapture').textContent = `${Math.round(data.oxxoCaptureRate * 100)}%`;
  document.querySelector('.val-var-hotelocc').textContent = `${Math.round(data.hotelOccupancy * 100)}%`;
  document.querySelector('.val-var-metrouse').textContent = `${Math.round(data.metroUsage * 100)}%`;
  document.querySelector('.val-var-metroticket').textContent = formatCurrency(data.metroTicket) + ' MXN';
  document.querySelector('.val-var-restaurantticket').textContent = formatCurrency(data.restaurantTicket) + ' MXN';
  document.querySelector('.val-var-restaurantcapture').textContent = `${Math.round(data.restaurantCaptureRate * 100)}%`;
  document.querySelector('.val-var-barticket').textContent = formatCurrency(data.barTicket) + ' MXN';
  document.querySelector('.val-var-barcapture').textContent = `${Math.round(data.barCaptureRate * 100)}%`;
  document.querySelectorAll('.val-var-radius').forEach(el => {
    el.textContent = formatNumber(data.radiusMeters) + ' m';
  });
}

/**
 * Renders the HTML items list in the sidebar.
 */
export function renderPOIListHTML(calculatedPois, callbacks) {
  const activePois = calculatedPois.filter(p => p.impact > 0);
  elements.poisCount.textContent = activePois.length;

  if (activePois.length === 0) {
    elements.poisListContainer.innerHTML = '<div class="no-pois-msg">No hay puntos con derrama económica en este radio. Aumenta el radio o agrega puntos en la zona.</div>';
    return;
  }

  // Sort by highest economic impact
  activePois.sort((a, b) => b.impact - a.impact);
  elements.poisListContainer.innerHTML = '';

  activePois.forEach(poi => {
    const div = document.createElement('div');
    div.className = `poi-item poi-${poi.type}`;
    div.id = `poi-list-item-${poi.id}`;
    
    let iconName = 'store';
    if (poi.type === 'hotel') iconName = 'hotel';
    if (poi.type === 'metro') iconName = 'subway';
    if (poi.type === 'restaurant') iconName = 'utensils';
    if (poi.type === 'bar') iconName = 'beer';

    let synergyBadge = '';
    if (poi.type === 'oxxo' && poi.metroSynergy) {
      synergyBadge = `<span class="poi-dist" style="color: var(--accent-transport); font-weight: 600; display: flex; align-items: center; gap: 2px;">
        <i data-lucide="sparkles" style="width: 10px; height: 10px;"></i> +${poi.metroSynergy.boostPct}% (Metro)
      </span>`;
    }

    div.innerHTML = `
      <div class="poi-info">
        <div class="poi-icon">
          <i data-lucide="${iconName}"></i>
        </div>
        <div class="poi-details-text">
          <span class="poi-name">${poi.name}</span>
          <span class="poi-dist">A ${Math.round(poi.distance)} m del evento</span>
          ${synergyBadge}
        </div>
      </div>
      <div class="poi-value-badge">
        ${formatCurrencyCompact(poi.impact)}
      </div>
    `;

    // Hook listeners
    div.addEventListener('mouseenter', () => {
      div.classList.add('active');
      if (callbacks.onListItemHover) callbacks.onListItemHover(poi.id);
    });

    div.addEventListener('mouseleave', () => {
      div.classList.remove('active');
      if (callbacks.onListItemLeave) callbacks.onListItemLeave(poi.id);
    });

    div.addEventListener('click', () => {
      if (callbacks.onListItemClick) callbacks.onListItemClick(poi.lat, poi.lng);
    });

    elements.poisListContainer.appendChild(div);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/**
 * Registers events on sliders, inputs, buttons, and switches.
 */
export function registerUIEventListeners(callbacks) {
  // 0. Search bar events
  elements.btnSearchClear.addEventListener('click', () => {
    clearSearchInput();
    if (callbacks.onSearchCleared) callbacks.onSearchCleared();
  });

  elements.addressSearchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val) {
      elements.btnSearchClear.classList.remove('hide');
    } else {
      elements.btnSearchClear.classList.add('hide');
    }
    if (callbacks.onSearchInput) callbacks.onSearchInput(val);
  });
  
  document.addEventListener('click', (e) => {
    if (elements.searchSuggestions && !elements.searchSuggestions.contains(e.target) && e.target !== elements.addressSearchInput) {
      hideSuggestions();
    }
  });

  // Exclude event spend toggle switch
  elements.excludeEventSpend.addEventListener('change', () => {
    if (callbacks.onExcludeEventChanged) callbacks.onExcludeEventChanged(elements.excludeEventSpend.checked);
  });

  // 1. Presets
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      if (callbacks.onPresetSelected) {
        callbacks.onPresetSelected(e.target.dataset.preset);
      }
    });
  });

  // 2. Generic sliders listener binder
  function setupSliderListener(sliderId, valId, suffix, formatter = null) {
    const slider = document.getElementById(sliderId);
    const badge = document.getElementById(valId);

    const updateVal = () => {
      const val = slider.value;
      badge.textContent = (formatter ? formatter(val) : val) + suffix;
    };

    slider.addEventListener('input', () => {
      updateVal();
      if (callbacks.onParamChanged) callbacks.onParamChanged();
    });

    updateVal(); // Initialize
  }

  setupSliderListener('event-attendance', 'attendance-val', ' personas', formatNumber);
  setupSliderListener('event-ticket-price', 'event-ticket-price-val', ' MXN', formatCurrency);
  setupSliderListener('event-venue-spend', 'event-venue-spend-val', ' MXN', formatCurrency);
  
  // Radius slider
  const radiusSlider = document.getElementById('search-radius');
  radiusSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    elements.radiusVal.textContent = formatNumber(val) + ' m';
    elements.radiusDescVal.textContent = (val / 1000).toFixed(1);
    if (callbacks.onRadiusSlide) callbacks.onRadiusSlide(val);
  });
  
  radiusSlider.addEventListener('change', (e) => {
    const val = parseInt(e.target.value);
    if (callbacks.onRadiusChanged) callbacks.onRadiusChanged(val);
  });

  // Oxxo sliders
  setupSliderListener('oxxo-ticket', 'oxxo-ticket-val', ' MXN', formatCurrency);
  setupSliderListener('oxxo-capture', 'oxxo-capture-val', '%');

  // Hotel sliders
  setupSliderListener('hotel-rate', 'hotel-rate-val', ' MXN', formatCurrency);
  setupSliderListener('hotel-occupancy', 'hotel-occupancy-val', '%');

  // Metro sliders
  setupSliderListener('metro-usage', 'metro-usage-val', '%');
  setupSliderListener('metro-ticket', 'metro-ticket-val', ' MXN', formatCurrency);

  // Restaurant sliders
  setupSliderListener('restaurant-ticket', 'restaurant-ticket-val', ' MXN', formatCurrency);
  setupSliderListener('restaurant-capture', 'restaurant-capture-val', '%');

  // Bar sliders
  setupSliderListener('bar-ticket', 'bar-ticket-val', ' MXN', formatCurrency);
  setupSliderListener('bar-capture', 'bar-capture-val', '%');

  // Google API Key change
  elements.googleApiKey.addEventListener('change', () => {
    if (callbacks.onApiKeyChanged) callbacks.onApiKeyChanged();
  });

  // Heatmap toggler
  elements.toggleHeatmap.addEventListener('change', () => {
    if (callbacks.onHeatmapToggled) callbacks.onHeatmapToggled(elements.toggleHeatmap.checked);
  });

  // Regenerate POIs
  elements.btnRegeneratePois.addEventListener('click', () => {
    if (callbacks.onRegenerateClicked) callbacks.onRegenerateClicked();
  });

  // Clear Map / Reset
  elements.btnClearMap.addEventListener('click', () => {
    if (callbacks.onClearClicked) callbacks.onClearClicked();
  });

  // Mobile sidebar toggle
  elements.sidebarToggleBtn.addEventListener('click', () => {
    elements.sidebar.classList.toggle('open');
    const isOpen = elements.sidebar.classList.contains('open');
    elements.sidebarToggleBtn.querySelector('i').setAttribute('data-lucide', isOpen ? 'x' : 'menu');
    if (window.lucide) window.lucide.createIcons();
  });

  // Modals & Placing Custom POIs
  elements.btnAddPoi.addEventListener('click', () => {
    elements.addPoiDialog.showModal();
  });

  const closeDialogFn = () => {
    elements.addPoiDialog.close();
    if (callbacks.onAddPoiCancelled) callbacks.onAddPoiCancelled();
  };

  elements.btnCloseDialog.addEventListener('click', closeDialogFn);
  elements.btnCancelPoi.addEventListener('click', closeDialogFn);

  elements.newPoiType.addEventListener('change', (e) => {
    const val = e.target.value;
    elements.fieldOxxoGroup.classList.add('hide');
    elements.fieldHotelGroup.classList.add('hide');
    elements.fieldMetroGroup.classList.add('hide');
    
    if (val === 'oxxo' || val === 'restaurant' || val === 'bar') elements.fieldOxxoGroup.classList.remove('hide');
    if (val === 'hotel') elements.fieldHotelGroup.classList.remove('hide');
    if (val === 'metro') elements.fieldMetroGroup.classList.remove('hide');
  });

  elements.btnConfirmPoiPlace.addEventListener('click', () => {
    const type = elements.newPoiType.value;
    const name = elements.newPoiName.value.trim();
    
    if (!name) {
      alert("Por favor introduce un nombre.");
      return;
    }

    const customPoiData = { type, name };

    if (type === 'oxxo' || type === 'restaurant' || type === 'bar') {
      customPoiData.customTicket = parseFloat(elements.newPoiTicket.value);
    } else if (type === 'hotel') {
      customPoiData.rooms = parseInt(elements.newPoiRooms.value);
      customPoiData.rate = parseFloat(elements.newPoiRate.value);
    } else if (type === 'metro') {
      customPoiData.flow = parseInt(elements.newPoiFlow.value);
    }

    elements.addPoiDialog.close();
    if (callbacks.onAddPoiConfirmed) callbacks.onAddPoiConfirmed(customPoiData);
  });
}
