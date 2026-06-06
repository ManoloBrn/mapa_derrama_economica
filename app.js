/**
 * EconHeat - Core Logic
 * Real-time Economic Impact Heatmap Simulator
 */

// Execute initialization directly since the script is loaded as an ES module (deferred by default)
  // === CONFIGURACIONES Y VARIABLES GLOBALES ===
  let map = null;
  let eventMarker = null;
  let radiusCircle = null;
  let heatmapLayer = null;
  
  // Listas de datos
  let pois = [];
  let userPois = []; // Guarda puntos creados manualmente por el usuario
  
  // Estado de colocación de POI manual
  let isPlacingPoi = false;
  let pendingPoiData = null;
  let tempPoiMarker = null;

  // Variables de integración de APIs reales
  let googleMapsLoaded = false;
  let googlePlacesService = null;

  // Presets de ubicaciones
  const presets = {
    azteca: {
      name: "Estadio Azteca",
      lat: 19.3029,
      lng: -99.1505,
      attendance: 75000,
      radius: 1200,
      ticketPrice: 650,
      venueSpend: 180
    },
    auditorio: {
      name: "Auditorio Nacional",
      lat: 19.4361,
      lng: -99.1998,
      attendance: 10000,
      radius: 800,
      ticketPrice: 950,
      venueSpend: 150
    },
    monterrey: {
      name: "Estadio BBVA (MTY)",
      lat: 25.6691,
      lng: -100.2443,
      attendance: 51000,
      radius: 1000,
      ticketPrice: 800,
      venueSpend: 200
    },
    guadalajara: {
      name: "Estadio Akron (GDL)",
      lat: 20.6811,
      lng: -103.4628,
      attendance: 46000,
      radius: 1100,
      ticketPrice: 550,
      venueSpend: 160
    }
  };

  let currentCenter = presets.azteca; // Preset inicial por defecto

  // Diccionario de nombres típicos para simulación realista (Contexto México)
  const simulatedNames = {
    oxxo: ["Oxxo Tlalpan", "Oxxo Santa Úrsula", "Oxxo Estadio", "Oxxo Imán", "Oxxo Acoxpa", "Oxxo Huipulco", "Oxxo Insurgentes", "Oxxo Del Valle", "Oxxo Bosques", "Oxxo Chapultepec", "Oxxo Reforma", "Oxxo Polanco", "Oxxo Juárez", "Oxxo Patria", "Oxxo Vallarta", "Oxxo Américas", "Oxxo Gonzalitos", "Oxxo Garza Sada", "Oxxo San Jerónimo"],
    hotel: ["Hotel Fiesta Inn", "City Express Plus", "Holiday Inn", "Camino Real", "NH Collection", "Hampton by Hilton", "Barceló", "Marriott Executive", "Hotel Krystal", "One Hoteles", "Real Inn", "Hotel Sheraton"],
    metro: ["Estación Tasqueña", "Estación General Anaya", "Estación Huipulco", "Estación Auditorio", "Estación Constituyentes", "Estación Polanco", "Estación Universidad", "Estación Copilco", "Estación Exposición", "Estación Y Griega", "Estación Estadio", "Estación Periférico"]
  };

  // === INITIALIZATION ===
  function init() {
    // 1. Inicializar Lucide Icons
    lucide.createIcons();
    
    // 2. Inicializar Mapa
    initMap();
    
    // 3. Registrar Event Listeners de la Interfaz
    registerEventListeners();
    
    // 4. Ejecutar la primera simulación
    applyPreset('azteca');
  }

  function initMap() {
    // Inicializar mapa centrado en el Estadio Azteca
    map = L.map('map', {
      zoomControl: false, // Lo moveremos de posición
      minZoom: 11,
      maxZoom: 18
    }).setView([currentCenter.lat, currentCenter.lng], 14);

    // Añadir control de zoom en una posición más discreta
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Capa de Mapa Oscuro (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Icono animado personalizado para el Evento (Pulsing)
    const pulsingIcon = L.divIcon({
      className: 'pulsing-marker',
      html: '<div class="pulse-ring"></div><div class="pulse-center"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Marcador del Evento
    eventMarker = L.marker([currentCenter.lat, currentCenter.lng], {
      icon: pulsingIcon,
      draggable: true
    }).addTo(map);

    // Círculo del Radio
    radiusCircle = L.circle([currentCenter.lat, currentCenter.lng], {
      radius: getRadiusInputValue(),
      color: 'var(--accent-blue)',
      fillColor: 'var(--accent-blue-glow)',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '5, 5'
    }).addTo(map);

    // Inicializar capa del mapa de calor vacía
    heatmapLayer = L.heatLayer([], {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: {
        0.2: 'rgba(0, 0, 255, 0.4)',  // Azul para baja derrama
        0.4: 'rgba(0, 255, 0, 0.6)',  // Verde media-baja
        0.6: 'rgba(255, 255, 0, 0.8)', // Amarillo media-alta
        0.8: 'rgba(255, 128, 0, 0.9)', // Naranja alta
        1.0: 'rgba(255, 0, 0, 1.0)'    // Rojo máxima
      }
    }).addTo(map);

    // Eventos del mapa
    map.on('click', onMapClick);
    eventMarker.on('dragend', onEventMarkerDragEnd);
  }

  // === REAL GEOGRAPHIC API DATA FETCHERS ===

  // 1. OpenStreetMap Overpass API
  async function fetchOSMData(lat, lng, radius) {
    // Consulta QL: nwr busca nodes, ways y relations en el radio y devuelve sus centros
    const query = `[out:json][timeout:25];
(
  nwr["brand"~"Oxxo",i](around:${radius},${lat},${lng});
  nwr["name"~"Oxxo",i](around:${radius},${lat},${lng});
  nwr["tourism"~"hotel|hostel|motel",i](around:${radius},${lat},${lng});
  nwr["railway"="station"](around:${radius},${lat},${lng});
);
out center;`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    
    if (!response.ok) throw new Error('Servidor de OpenStreetMap ocupado o sin conexión.');
    const data = await response.json();
    return data.elements || [];
  }

  function parseOSMData(elements) {
    return elements.map(el => {
      const tags = el.tags || {};
      const lat = el.lat || (el.center ? el.center.lat : null);
      const lng = el.lon || (el.center ? el.center.lng : null);
      
      if (!lat || !lng) return null;

      let type = 'oxxo';
      let name = tags.name || 'Comercio Local';
      
      // Clasificación del POI
      if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'motel' || tags.tourism === 'guest_house') {
        type = 'hotel';
        name = tags.name || 'Hotel Alojamiento';
      } else if (tags.railway === 'station' || tags.station === 'subway' || tags.subway === 'yes' || tags.railway === 'halt') {
        type = 'metro';
        name = tags.name || 'Estación de Metro';
      } else {
        // Por marca o nombre es Oxxo
        const brandName = (tags.brand || tags.name || '').toLowerCase();
        if (brandName.includes('oxxo')) {
          type = 'oxxo';
          name = tags.name || 'Oxxo';
        } else {
          // Si es otra tienda, la catalogamos como oxxo por defecto para retail
          type = 'oxxo';
        }
      }

      const poi = {
        id: `osm-${el.type}-${el.id}`,
        type: type,
        name: name,
        lat: lat,
        lng: lng,
        distance: 0
      };

      applyOperationalMetrics(poi);
      return poi;
    }).filter(p => p !== null);
  }

  // 2. Google Maps / Places API loader
  function loadGoogleMapsAPI(key) {
    return new Promise((resolve, reject) => {
      if (googleMapsLoaded) {
        resolve();
        return;
      }
      
      const oldScript = document.getElementById('google-maps-sdk');
      if (oldScript) oldScript.remove();

      window.initGoogleMapsCallback = () => {
        googleMapsLoaded = true;
        const dummyDiv = document.createElement('div');
        googlePlacesService = new google.maps.places.PlacesService(dummyDiv);
        resolve();
      };

      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        reject(new Error('API Key inválida de Google Maps o error de conexión.'));
      };
      document.head.appendChild(script);
    });
  }

  function searchGooglePlacesNearby(lat, lng, radius, options) {
    return new Promise((resolve, reject) => {
      if (!googlePlacesService) {
        reject(new Error('Google Places service no inicializado.'));
        return;
      }
      
      const request = {
        location: new google.maps.LatLng(lat, lng),
        radius: radius,
        ...options
      };
      
      googlePlacesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK || status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve(results || []);
        } else {
          reject(new Error(`Places Search falló con status: ${status}`));
        }
      });
    });
  }

  async function fetchGooglePlacesData(lat, lng, radius) {
    const [oxxos, hotels, metros] = await Promise.all([
      searchGooglePlacesNearby(lat, lng, radius, { keyword: 'Oxxo' }),
      searchGooglePlacesNearby(lat, lng, radius, { type: 'lodging' }),
      searchGooglePlacesNearby(lat, lng, radius, { type: 'transit_station' })
    ]);

    const list = [];
    
    // Oxxos
    oxxos.forEach(item => {
      list.push({
        id: `gcp-oxxo-${item.place_id}`,
        type: 'oxxo',
        name: item.name,
        lat: item.geometry.location.lat(),
        lng: item.geometry.location.lng(),
        distance: 0
      });
    });

    // Hoteles
    hotels.forEach(item => {
      list.push({
        id: `gcp-hotel-${item.place_id}`,
        type: 'hotel',
        name: item.name,
        lat: item.geometry.location.lat(),
        lng: item.geometry.location.lng(),
        distance: 0
      });
    });

    // Estaciones de Metro
    metros.forEach(item => {
      const name = item.name.toLowerCase();
      // Filtrar para conseguir estaciones de metro y tren y evitar paradas de camiones simples
      if (name.includes('metro') || name.includes('estacion') || name.includes('estación') || name.includes('subway') || name.includes('cablebus') || name.includes('macrobús')) {
        list.push({
          id: `gcp-metro-${item.place_id}`,
          type: 'metro',
          name: item.name,
          lat: item.geometry.location.lat(),
          lng: item.geometry.location.lng(),
          distance: 0
        });
      }
    });

    list.forEach(applyOperationalMetrics);
    return list;
  }

  // 3. Simulador de Métricas Operativas (para complementar datos reales de APIs)
  function applyOperationalMetrics(poi) {
    if (poi.type === 'hotel') {
      const nameLower = poi.name.toLowerCase();
      let rooms = 100;
      if (nameLower.includes('grand') || nameLower.includes('sheraton') || nameLower.includes('marriott') || nameLower.includes('hilton') || nameLower.includes('camino real')) {
        rooms = Math.round(180 + Math.random() * 120); // Grande
      } else if (nameLower.includes('fiesta inn') || nameLower.includes('city express') || nameLower.includes('holiday inn') || nameLower.includes('hampton')) {
        rooms = Math.round(100 + Math.random() * 60); // Mediano
      } else {
        rooms = Math.round(30 + Math.random() * 50); // Chico
      }
      poi.rooms = rooms;
      
      // Tarifa simulada
      poi.rate = Math.round(8 + Math.random() * 22) * 100;
    } 
    else if (poi.type === 'metro') {
      const nameLower = poi.name.toLowerCase();
      let flow = 35000;
      if (nameLower.includes('tasqueña') || nameLower.includes('hidalgo') || nameLower.includes('bellas artes') || nameLower.includes('pino suárez') || nameLower.includes('balderas') || nameLower.includes('chabacano') || nameLower.includes('pantitlán')) {
        flow = Math.round(90 + Math.random() * 70) * 1000; // Alta transferencia
      } else {
        flow = Math.round(15 + Math.random() * 35) * 1000; // Estación estándar
      }
      poi.flow = flow;
    }
  }

  // 4. Coordinador General de Carga de POIs Reales
  async function loadAndQueryRealPOIs(lat, lng, radius) {
    const loadingOverlay = document.getElementById('map-loading-overlay');
    const statusBadge = document.getElementById('api-status-badge');
    const apiKey = document.getElementById('google-api-key').value.trim();

    // Mostrar loading
    loadingOverlay.classList.remove('hide');

    try {
      if (apiKey) {
        // Proveedor: Google Places
        statusBadge.textContent = "Cargando Google Maps...";
        statusBadge.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
        statusBadge.style.color = "#3b82f6";
        statusBadge.style.borderColor = "rgba(59, 130, 246, 0.3)";

        await loadGoogleMapsAPI(apiKey);

        statusBadge.textContent = "Google Places (GCP)";
        pois = await fetchGooglePlacesData(lat, lng, radius);
        showToast("Lugares reales obtenidos de Google Places con éxito.");
      } else {
        // Proveedor: OpenStreetMap Overpass
        statusBadge.textContent = "Consultando OSM...";
        statusBadge.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
        statusBadge.style.color = "var(--accent-oxxo)";
        statusBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";

        const osmElements = await fetchOSMData(lat, lng, radius);
        pois = parseOSMData(osmElements);
        showToast("Lugares reales obtenidos de OpenStreetMap.");
      }
    } catch (error) {
      console.error(error);
      
      // Fallback a Simulación Offline
      statusBadge.textContent = "Simulación Offline (Error)";
      statusBadge.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
      statusBadge.style.color = "#ef4444";
      statusBadge.style.borderColor = "rgba(239, 68, 68, 0.3)";

      pois = generateSimulatedPOIs(lat, lng, radius);
      showToast(`Error de conexión: ${error.message}. Usando simulación offline.`);
    } finally {
      // Ocultar loading y recalcular
      loadingOverlay.classList.add('hide');
      recalculateEconomicImpact();
    }
  }

  // === SIMULATION ENGINE (GENERATION OF MOCK DATA) ===
  function generateSimulatedPOIs(centerLat, centerLng, radiusMeters) {
    const list = [];
    
    // Omitimos la generación si el radio es ridículamente pequeño
    if (radiusMeters < 50) return list;

    // Número de puntos a generar según el tamaño del radio
    const numOxxos = Math.max(4, Math.min(12, Math.round(radiusMeters / 120)));
    const numHoteles = Math.max(2, Math.min(6, Math.round(radiusMeters / 220)));
    const numMetros = Math.max(1, Math.min(3, Math.round(radiusMeters / 450)));

    const radiusInDegreesLat = radiusMeters / 111300;
    const radiusInDegreesLng = radiusMeters / (111300 * Math.cos(centerLat * Math.PI / 180));

    // Generador auxiliar de coordenadas polares aleatorias dentro del radio
    function getRandomLocation(minDistPct = 0.05, maxDistPct = 0.95) {
      const angle = Math.random() * Math.PI * 2;
      const distanceFactor = minDistPct + Math.random() * (maxDistPct - minDistPct);
      // Distribución cuadrática para concentrar más comercios (como Oxxos) más cerca
      const radialDistance = distanceFactor;
      
      const latOffset = Math.sin(angle) * radialDistance * radiusInDegreesLat;
      const lngOffset = Math.cos(angle) * radialDistance * radiusInDegreesLng;
      
      return {
        lat: centerLat + latOffset,
        lng: centerLng + lngOffset,
        distance: radialDistance * radiusMeters
      };
    }

    // 1. Generar Oxxos
    const oxxoNames = shuffleArray([...simulatedNames.oxxo]);
    for (let i = 0; i < numOxxos; i++) {
      const loc = getRandomLocation(0.05, 0.95);
      list.push({
        id: `sim-oxxo-${i}`,
        type: 'oxxo',
        name: oxxoNames[i % oxxoNames.length] || `Oxxo Sucursal ${i+1}`,
        lat: loc.lat,
        lng: loc.lng,
        distance: loc.distance,
        baseValue: 95 // Ticket promedio por defecto
      });
    }

    // 2. Generar Hoteles
    const hotelNames = shuffleArray([...simulatedNames.hotel]);
    for (let i = 0; i < numHoteles; i++) {
      const loc = getRandomLocation(0.2, 0.95); // Hoteles un poco más esparcidos
      // Habitaciones aleatorias entre 45 y 220
      const rooms = Math.round(45 + Math.random() * 175);
      // Tarifa entre 900 y 3200
      const rate = Math.round(9 + Math.random() * 23) * 100;
      
      list.push({
        id: `sim-hotel-${i}`,
        type: 'hotel',
        name: hotelNames[i % hotelNames.length] || `Hotel Inn ${i+1}`,
        lat: loc.lat,
        lng: loc.lng,
        distance: loc.distance,
        rooms: rooms,
        rate: rate
      });
    }

    // 3. Generar Metros
    const metroNames = shuffleArray([...simulatedNames.metro]);
    for (let i = 0; i < numMetros; i++) {
      const loc = getRandomLocation(0.15, 0.9);
      // Flujo diario entre 25k y 95k pasajeros
      const flow = Math.round(25 + Math.random() * 70) * 1000;
      
      list.push({
        id: `sim-metro-${i}`,
        type: 'metro',
        name: metroNames[i % metroNames.length] || `Metro Estación ${i+1}`,
        lat: loc.lat,
        lng: loc.lng,
        distance: loc.distance,
        flow: flow
      });
    }

    return list;
  }

  // === ALGORITHMIC CALCULATOR ===
  function recalculateEconomicImpact() {
    const radiusMeters = getRadiusInputValue();
    const attendance = getAttendanceInputValue();
    
    // Obtener variables de control de la UI
    const ticketPrice = getTicketPriceInputValue();
    const venueSpend = getVenueSpendInputValue();
    
    const oxxoTicket = getOxxoTicketValue();
    const oxxoCaptureRate = getOxxoCaptureRateValue() / 100;
    
    const hotelRate = getHotelRateValue();
    const hotelOccupancy = getHotelOccupancyValue() / 100;
    
    const metroUsage = getMetroUsageValue() / 100;
    const metroTicket = getMetroTicketValue();

    // 1. Direct Event Revenue (entrada promedio + consumo interno promedio por asistente)
    const impactEvent = attendance * (ticketPrice + venueSpend);

    let impactOxxos = 0;
    let impactHoteles = 0;
    let impactMetro = 0;

    // Actualizar distancias y calcular impacto para todos los POIs (simulados + usuario)
    const allPois = [...pois, ...userPois];
    const eventLatLng = eventMarker.getLatLng();

    allPois.forEach(poi => {
      // Calcular distancia real en metros al evento
      const poiLatLng = L.latLng(poi.lat, poi.lng);
      poi.distance = eventLatLng.distanceTo(poiLatLng);

      if (poi.distance > radiusMeters) {
        poi.impact = 0;
        return;
      }

      // Proporción de cercanía (1 = en el centro del evento, 0 = en el borde del radio)
      const proximity = 1 - (poi.distance / radiusMeters);

      if (poi.type === 'oxxo') {
        // Impacto Oxxo: Fuerte decaimiento cuadrático (la gente compra muy cerca)
        const ticket = poi.customTicket || oxxoTicket;
        let baseImpact = attendance * ticket * oxxoCaptureRate * Math.pow(proximity, 2);
        
        // Multiplicador por cercanía a estaciones de metro (sinergia de tránsito)
        let metroMultiplier = 1;
        let nearestMetro = null;
        let minMetroDist = Infinity;
        
        // Buscar la estación de metro más cercana
        allPois.forEach(other => {
          if (other.type === 'metro') {
            const oxxoLatLng = L.latLng(poi.lat, poi.lng);
            const metroLatLng = L.latLng(other.lat, other.lng);
            const distToMetro = oxxoLatLng.distanceTo(metroLatLng);
            if (distToMetro < minMetroDist) {
              minMetroDist = distToMetro;
              nearestMetro = other;
            }
          }
        });
        
        // Si hay una estación a menos de 300 metros, aplicar multiplicador de hasta 1.5x (50% de incremento)
        if (nearestMetro && minMetroDist < 300) {
          const metroProximity = 1 - (minMetroDist / 300);
          metroMultiplier = 1 + 0.5 * metroProximity;
          poi.metroSynergy = {
            stationName: nearestMetro.name,
            boostPct: Math.round((metroMultiplier - 1) * 100),
            distance: Math.round(minMetroDist)
          };
        } else {
          poi.metroSynergy = null;
        }
        
        poi.impact = baseImpact * metroMultiplier;
        impactOxxos += poi.impact;
      } 
      else if (poi.type === 'hotel') {
        // Impacto Hotel: Alojamiento derivado del evento
        // Asumiendo promedio de 1.5 noches de estadía y ocupación atribuible
        const rooms = poi.rooms || 120;
        const rate = poi.rate || hotelRate;
        poi.impact = rooms * hotelOccupancy * rate * 1.5;
        impactHoteles += poi.impact;
      } 
      else if (poi.type === 'metro') {
        // Impacto Transporte: Tránsito peatonal extra y consumo de locales internos
        // Decaimiento lineal basado en la distancia
        poi.impact = attendance * metroUsage * metroTicket * proximity;
        impactMetro += poi.impact;
      }
    });

    const totalImpact = impactEvent + impactOxxos + impactHoteles + impactMetro;

    // Actualizar UI con los resultados calculados
    updateDashboardUI({
      total: totalImpact,
      event: impactEvent,
      oxxo: impactOxxos,
      hotel: impactHoteles,
      metro: impactMetro
    });

    // Actualizar el mapa de calor
    updateHeatmap(allPois, totalImpact);
    
    // Volver a renderizar la lista interactiva
    renderPOIList(allPois);

    // Actualizar valores en el acordeón de fórmulas
    updateFormulaValuesInAccordion({
      attendance,
      ticketPrice,
      venueSpend,
      oxxoTicket,
      oxxoCaptureRate,
      hotelOccupancy,
      metroUsage,
      metroTicket,
      radiusMeters
    });
  }

  // === HEATMAP RENDERER ===
  function updateHeatmap(allPois, totalImpact) {
    if (!document.getElementById('toggle-heatmap').checked) {
      heatmapLayer.setLatLngs([]);
      return;
    }

    const points = [];
    const eventLatLng = eventMarker.getLatLng();
    const radiusMeters = getRadiusInputValue();

    // 1. Agregar el punto del evento (foco principal de calor)
    // El evento en sí concentra gran parte del calor económico
    points.push([eventLatLng.lat, eventLatLng.lng, 1.0]);

    // 2. Agregar puntos de calor para los POIs dentro del radio que tengan impacto > 0
    allPois.forEach(poi => {
      if (poi.impact > 0 && poi.distance <= radiusMeters) {
        // Calcular intensidad relativa. Usamos una escala logarítmica/raíz cuadrada
        // para que puntos con impacto medio no queden invisibilizados ante picos masivos.
        // Mapeamos de 0.15 a 0.85 para visualización idónea en el gradiente.
        const maxExpectedImpact = 350000; // Cota de referencia para normalizar
        const ratio = Math.min(poi.impact / maxExpectedImpact, 1.0);
        const intensity = 0.2 + (ratio * 0.7);
        
        points.push([poi.lat, poi.lng, intensity]);
      }
    });

    heatmapLayer.setLatLngs(points);
  }

  // === UI UPDATING LOGIC ===
  function updateDashboardUI(data) {
    // 1. Efecto contador animado en el número de impacto total
    animateCounter('total-impact-value', data.total, '$');

    // 2. Desglose numérico plano
    document.getElementById('breakdown-val-event').textContent = formatCurrency(data.event);
    document.getElementById('breakdown-val-oxxo').textContent = formatCurrency(data.oxxo);
    document.getElementById('breakdown-val-hotel').textContent = formatCurrency(data.hotel);
    document.getElementById('breakdown-val-metro').textContent = formatCurrency(data.metro);

    // 3. Porcentajes
    const total = data.total || 1; // Evitar división por cero
    const pctEvent = Math.round((data.event / total) * 100);
    const pctOxxo = Math.round((data.oxxo / total) * 100);
    const pctHotel = Math.round((data.hotel / total) * 100);
    const pctMetro = 100 - pctEvent - pctOxxo - pctHotel; // Ajustar para sumar 100% exacto

    document.getElementById('pct-event').textContent = `${pctEvent}%`;
    document.getElementById('pct-oxxo').textContent = `${pctOxxo}%`;
    document.getElementById('pct-hotel').textContent = `${pctHotel}%`;
    document.getElementById('pct-metro').textContent = `${pctMetro}%`;

    // 4. Actualizar Donut Chart (Segmentos SVG)
    // El perímetro es 251.2
    const perimeter = 251.2;
    
    // Segmento Event (Azul)
    const dashEvent = (pctEvent / 100) * perimeter;
    const offsetEvent = perimeter - dashEvent;
    const segEvent = document.getElementById('segment-event');
    segEvent.style.strokeDasharray = `${dashEvent} ${perimeter}`;
    segEvent.style.strokeDashoffset = offsetEvent;

    // Segmento Oxxo (Verde) - rota desde donde termina el Event
    const dashOxxo = (pctOxxo / 100) * perimeter;
    const offsetOxxo = offsetEvent - dashOxxo;
    const segOxxo = document.getElementById('segment-oxxo');
    segOxxo.style.strokeDasharray = `${dashOxxo} ${perimeter}`;
    segOxxo.style.strokeDashoffset = offsetOxxo;

    // Segmento Hotel (Naranja)
    const dashHotel = (pctHotel / 100) * perimeter;
    const offsetHotel = offsetOxxo - dashHotel;
    const segHotel = document.getElementById('segment-hotel');
    segHotel.style.strokeDasharray = `${dashHotel} ${perimeter}`;
    segHotel.style.strokeDashoffset = offsetHotel;

    // Segmento Metro (Morado)
    const dashMetro = (pctMetro / 100) * perimeter;
    const offsetMetro = offsetHotel - dashMetro;
    const segMetro = document.getElementById('segment-metro');
    segMetro.style.strokeDasharray = `${dashMetro} ${perimeter}`;
    segMetro.style.strokeDashoffset = offsetMetro;

    document.getElementById('chart-center-pct').textContent = '100%';
  }

  function renderPOIList(allPois) {
    const container = document.getElementById('pois-list-container');
    const activePois = allPois.filter(p => p.impact > 0);
    
    // Actualizar contador
    document.getElementById('pois-count').textContent = activePois.length;

    if (activePois.length === 0) {
      container.innerHTML = '<div class="no-pois-msg">No hay puntos con derrama económica en este radio. Aumenta el radio o agrega puntos en la zona.</div>';
      return;
    }

    // Ordenar de mayor a menor impacto
    activePois.sort((a, b) => b.impact - a.impact);

    container.innerHTML = '';
    
    // Limpiar marcadores de POIs anteriores en el mapa
    // Para simplificar, limpiaremos y redibujaremos markers de POIs de mapa
    // guardando referencias de capas no-core del mapa.
    clearMapPoiLayers();

    activePois.forEach(poi => {
      // 1. Crear el elemento de lista
      const div = document.createElement('div');
      div.className = `poi-item poi-${poi.type}`;
      div.id = `poi-list-item-${poi.id}`;
      
      let iconName = 'store';
      if (poi.type === 'hotel') iconName = 'hotel';
      if (poi.type === 'metro') iconName = 'subway';

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

      // 2. Crear el marcador correspondiente en el mapa
      const markerColorClass = `popup-${poi.type}-text`;
      let markerIconSvg = `<i data-lucide="${iconName}"></i>`;
      
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

      // Guardar referencia en el objeto para control cruzado
      poi.markerLayer = mapMarker;

      // Popup
      let synergyText = '';
      if (poi.type === 'oxxo' && poi.metroSynergy) {
        synergyText = `<div style="margin-top: 4px; font-size: 11px; color: var(--accent-transport); font-weight: 500;">
          <i data-lucide="sparkles" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle; margin-right: 2px;"></i>
          Sinergia: +${poi.metroSynergy.boostPct}% por cercanía a ${poi.metroSynergy.stationName} (${poi.metroSynergy.distance}m)
        </div>`;
      }

      const popupContent = `
        <div class="popup-title ${markerColorClass}">
          ${poi.name}
        </div>
        <div class="popup-desc">
          ${poi.type === 'oxxo' ? `Oxxo / Tienda de conveniencia.<br>Ticket estimado: ${formatCurrency(poi.customTicket || getOxxoTicketValue())} MXN${synergyText}` : ''}
          ${poi.type === 'hotel' ? `Hotel / Alojamiento.<br>${poi.rooms || 120} habitaciones.` : ''}
          ${poi.type === 'metro' ? `Estación de metro.<br>Flujo diario: ${formatNumber(poi.flow || 45000)} pasajeros.` : ''}
          <br>Distancia: ${Math.round(poi.distance)}m
        </div>
        <div class="popup-impact">
          Derrama generada: ${formatCurrency(poi.impact)} MXN
        </div>
      `;
      mapMarker.bindPopup(popupContent);

      // Eventos Cruzados (Hover en lista -> Destacar en mapa)
      div.addEventListener('mouseenter', () => {
        div.classList.add('active');
        mapMarker.openPopup();
        // Animación de pulso visual temporal
        mapMarker.getElement().style.transform += ' scale(1.2) translateY(-4px)';
        mapMarker.getElement().style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      });

      div.addEventListener('mouseleave', () => {
        div.classList.remove('active');
        mapMarker.closePopup();
        if (mapMarker.getElement()) {
          mapMarker.getElement().style.transform = mapMarker.getElement().style.transform.replace(' scale(1.2) translateY(-4px)', '');
        }
      });

      div.addEventListener('click', () => {
        map.flyTo([poi.lat, poi.lng], 16);
      });

      container.appendChild(div);
    });

    // Re-iniciar lucide icons para los nuevos elementos agregados
    lucide.createIcons();
  }

  function clearMapPoiLayers() {
    // Recorremos los POIs viejos y quitamos sus marcadores del mapa
    [...pois, ...userPois].forEach(poi => {
      if (poi.markerLayer) {
        map.removeLayer(poi.markerLayer);
        poi.markerLayer = null;
      }
    });
  }

  function updateFormulaValuesInAccordion(data) {
    document.querySelector('.val-var-a').textContent = formatNumber(data.attendance);
    document.querySelector('.val-var-ticketprice').textContent = formatCurrency(data.ticketPrice) + ' MXN';
    document.querySelector('.val-var-venuespend').textContent = formatCurrency(data.venueSpend) + ' MXN';
    document.querySelector('.val-var-oxxoticket').textContent = formatCurrency(data.oxxoTicket) + ' MXN';
    document.querySelector('.val-var-oxxocapture').textContent = `${Math.round(data.oxxoCaptureRate * 100)}%`;
    document.querySelector('.val-var-hotelocc').textContent = `${Math.round(data.hotelOccupancy * 100)}%`;
    document.querySelector('.val-var-metrouse').textContent = `${Math.round(data.metroUsage * 100)}%`;
    document.querySelector('.val-var-metroticket').textContent = formatCurrency(data.metroTicket) + ' MXN';
    document.querySelector('.val-var-radius').textContent = formatNumber(data.radiusMeters) + ' m';
  }

  // === EVENT LISTENERS & UI CONTROLS ===
  function registerEventListeners() {
    // 1. Presets
    document.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        await applyPreset(e.target.dataset.preset);
      });
    });

    // 2. Sliders
    setupSliderListener('event-attendance', 'attendance-val', ' personas', formatNumber, recalculateEconomicImpact);
    setupSliderListener('event-ticket-price', 'event-ticket-price-val', ' MXN', formatCurrency, recalculateEconomicImpact);
    setupSliderListener('event-venue-spend', 'event-venue-spend-val', ' MXN', formatCurrency, recalculateEconomicImpact);
    
    // Slider de Radio: Ajuste visual inmediato y recálculo local de los puntos actuales (input),
    // pero consulta las APIs de nuevo solo al soltar el slider (change) para evitar spameo.
    const radiusSlider = document.getElementById('search-radius');
    setupSliderListener('search-radius', 'radius-val', ' m', formatNumber, (val) => {
      radiusCircle.setRadius(val);
      document.getElementById('radius-desc-val').textContent = (val / 1000).toFixed(1);
      recalculateEconomicImpact();
    });
    
    radiusSlider.addEventListener('change', async (e) => {
      const val = parseInt(e.target.value);
      const latlng = eventMarker.getLatLng();
      await loadAndQueryRealPOIs(latlng.lat, latlng.lng, val);
    });

    // Oxxo Sliders
    setupSliderListener('oxxo-ticket', 'oxxo-ticket-val', ' MXN', formatCurrency, recalculateEconomicImpact);
    setupSliderListener('oxxo-capture', 'oxxo-capture-val', '%', null, recalculateEconomicImpact);

    // Hotel Sliders
    setupSliderListener('hotel-rate', 'hotel-rate-val', ' MXN', formatCurrency, recalculateEconomicImpact);
    setupSliderListener('hotel-occupancy', 'hotel-occupancy-val', '%', null, recalculateEconomicImpact);

    // Metro Sliders
    setupSliderListener('metro-usage', 'metro-usage-val', '%', null, recalculateEconomicImpact);
    setupSliderListener('metro-ticket', 'metro-ticket-val', ' MXN', formatCurrency, recalculateEconomicImpact);

    // Listener de Google API Key
    const apiKeyInput = document.getElementById('google-api-key');
    apiKeyInput.addEventListener('change', async () => {
      const latlng = eventMarker.getLatLng();
      const radius = getRadiusInputValue();
      await loadAndQueryRealPOIs(latlng.lat, latlng.lng, radius);
    });

    // 3. Switch de Mapa de Calor
    document.getElementById('toggle-heatmap').addEventListener('change', () => {
      recalculateEconomicImpact();
    });

    // 4. Regenerar POIs (volver a consultar APIs)
    document.getElementById('btn-regenerate-pois').addEventListener('click', async () => {
      const latlng = eventMarker.getLatLng();
      await loadAndQueryRealPOIs(latlng.lat, latlng.lng, getRadiusInputValue());
    });

    // 5. Reiniciar Simulación
    document.getElementById('btn-clear-map').addEventListener('click', async () => {
      userPois = []; // Eliminar manuales
      const latlng = eventMarker.getLatLng();
      await loadAndQueryRealPOIs(latlng.lat, latlng.lng, getRadiusInputValue());
      showToast("Simulación reiniciada. Se eliminaron los puntos manuales.");
    });

    // 6. Sidebar Móvil Toggle
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      const isOpen = sidebar.classList.contains('open');
      toggleBtn.querySelector('i').setAttribute('data-lucide', isOpen ? 'x' : 'menu');
      lucide.createIcons();
    });

    // 7. Modales y Agregar POIs
    const dialog = document.getElementById('add-poi-dialog');
    const btnAdd = document.getElementById('btn-add-poi');
    const btnCloseDialog = document.getElementById('btn-close-dialog');
    const btnCancelPoi = document.getElementById('btn-cancel-poi');
    const btnConfirmPoiPlace = document.getElementById('btn-confirm-poi-place');
    const formPoiType = document.getElementById('new-poi-type');

    btnAdd.addEventListener('click', () => {
      dialog.showModal();
    });

    const closeDialogFn = () => {
      dialog.close();
      cancelPlacingPoiMode();
    };

    btnCloseDialog.addEventListener('click', closeDialogFn);
    btnCancelPoi.addEventListener('click', closeDialogFn);

    // Cambio de campos condicionales en el Modal
    formPoiType.addEventListener('change', (e) => {
      const val = e.target.value;
      document.getElementById('field-oxxo-group').classList.add('hide');
      document.getElementById('field-hotel-group').classList.add('hide');
      document.getElementById('field-metro-group').classList.add('hide');
      
      if (val === 'oxxo') document.getElementById('field-oxxo-group').classList.remove('hide');
      if (val === 'hotel') document.getElementById('field-hotel-group').classList.remove('hide');
      if (val === 'metro') document.getElementById('field-metro-group').classList.remove('hide');
    });

    // Acción para colocar en el mapa
    btnConfirmPoiPlace.addEventListener('click', () => {
      const type = formPoiType.value;
      const name = document.getElementById('new-poi-name').value.trim();
      
      if (!name) {
        alert("Por favor introduce un nombre.");
        return;
      }

      // Reunir datos personalizados del modal
      pendingPoiData = {
        type: type,
        name: name
      };

      if (type === 'oxxo') {
        pendingPoiData.customTicket = parseFloat(document.getElementById('new-poi-ticket').value);
      } else if (type === 'hotel') {
        pendingPoiData.rooms = parseInt(document.getElementById('new-poi-rooms').value);
        pendingPoiData.rate = parseFloat(document.getElementById('new-poi-rate').value);
      } else if (type === 'metro') {
        pendingPoiData.flow = parseInt(document.getElementById('new-poi-flow').value);
      }

      dialog.close();
      startPlacingPoiMode();
    });
  }

  function startPlacingPoiMode() {
    isPlacingPoi = true;
    document.getElementById('map').style.cursor = 'crosshair';
    showToast("Haz clic en cualquier parte del mapa para ubicar el nuevo comercio.");
  }

  function cancelPlacingPoiMode() {
    isPlacingPoi = false;
    pendingPoiData = null;
    document.getElementById('map').style.cursor = '';
    if (tempPoiMarker) {
      map.removeLayer(tempPoiMarker);
      tempPoiMarker = null;
    }
  }

  function setupSliderListener(sliderId, valId, suffix, formatter = null, callback = null) {
    const slider = document.getElementById(sliderId);
    const badge = document.getElementById(valId);

    const updateVal = () => {
      const val = slider.value;
      badge.textContent = (formatter ? formatter(val) : val) + suffix;
    };

    slider.addEventListener('input', () => {
      updateVal();
      if (callback) callback(slider.value);
    });

    updateVal(); // Inicializar
  }

  // === HELPERS DE MAPA & EVENTOS ===
  function onMapClick(e) {
    if (isPlacingPoi && pendingPoiData) {
      // Agregar nuevo POI manual del usuario
      const latlng = e.latlng;
      const newId = `user-poi-${Date.now()}`;
      
      const newPoi = {
        id: newId,
        type: pendingPoiData.type,
        name: pendingPoiData.name,
        lat: latlng.lat,
        lng: latlng.lng,
        ...pendingPoiData
      };
      
      userPois.push(newPoi);
      cancelPlacingPoiMode();
      
      recalculateEconomicImpact();
      showToast(`Punto "${newPoi.name}" agregado con éxito.`);
      return;
    }

    // Si no está en modo de colocar POI, mover el evento al lugar del click
    const latlng = e.latlng;
    eventMarker.setLatLng(latlng);
    onEventLocationChange(latlng);
  }

  function onEventMarkerDragEnd(e) {
    const latlng = eventMarker.getLatLng();
    onEventLocationChange(latlng);
  }

  async function onEventLocationChange(latlng) {
    // Centrar círculo de radio
    radiusCircle.setLatLng(latlng);

    // Actualizar coordenadas en texto
    document.getElementById('current-coords-val').textContent = `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`;

    // Quitar active de presets si el usuario lo mueve manualmente
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));

    // Cargar POIs reales
    await loadAndQueryRealPOIs(latlng.lat, latlng.lng, getRadiusInputValue());
  }

  async function applyPreset(key) {
    const preset = presets[key];
    if (!preset) return;

    currentCenter = preset;

    // Actualizar controles UI con los valores del preset
    document.getElementById('event-name').value = preset.name;
    
    const attendanceSlider = document.getElementById('event-attendance');
    attendanceSlider.value = preset.attendance;
    document.getElementById('attendance-val').textContent = formatNumber(preset.attendance) + ' personas';

    const ticketPriceSlider = document.getElementById('event-ticket-price');
    ticketPriceSlider.value = preset.ticketPrice || 350;
    document.getElementById('event-ticket-price-val').textContent = formatCurrency(preset.ticketPrice || 350) + ' MXN';

    const venueSpendSlider = document.getElementById('event-venue-spend');
    venueSpendSlider.value = preset.venueSpend || 100;
    document.getElementById('event-venue-spend-val').textContent = formatCurrency(preset.venueSpend || 100) + ' MXN';

    const radiusSlider = document.getElementById('search-radius');
    radiusSlider.value = preset.radius;
    document.getElementById('radius-val').textContent = formatNumber(preset.radius) + ' m';
    document.getElementById('radius-desc-val').textContent = (preset.radius / 1000).toFixed(1);

    // Centrar mapa y marcador
    const latlng = L.latLng(preset.lat, preset.lng);
    map.setView(latlng, 14);
    eventMarker.setLatLng(latlng);
    radiusCircle.setLatLng(latlng);
    radiusCircle.setRadius(preset.radius);

    // Actualizar coordenadas en texto
    document.getElementById('current-coords-val').textContent = `Lat: ${preset.lat.toFixed(4)}, Lng: ${preset.lng.toFixed(4)}`;

    // Cargar POIs reales
    await loadAndQueryRealPOIs(preset.lat, preset.lng, preset.radius);
  }

  // === AUXILIARY HELPERS ===
  function getRadiusInputValue() {
    return parseInt(document.getElementById('search-radius').value);
  }

  function getAttendanceInputValue() {
    return parseInt(document.getElementById('event-attendance').value);
  }

  function getTicketPriceInputValue() {
    return parseFloat(document.getElementById('event-ticket-price').value);
  }

  function getVenueSpendInputValue() {
    return parseFloat(document.getElementById('event-venue-spend').value);
  }

  function getOxxoTicketValue() {
    return parseFloat(document.getElementById('oxxo-ticket').value);
  }

  function getOxxoCaptureRateValue() {
    return parseFloat(document.getElementById('oxxo-capture').value);
  }

  function getHotelRateValue() {
    return parseFloat(document.getElementById('hotel-rate').value);
  }

  function getHotelOccupancyValue() {
    return parseFloat(document.getElementById('hotel-occupancy').value);
  }

  function getMetroUsageValue() {
    return parseFloat(document.getElementById('metro-usage').value);
  }

  function getMetroTicketValue() {
    return parseFloat(document.getElementById('metro-ticket').value);
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function formatCurrency(val) {
    return '$' + parseFloat(val).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatCurrencyCompact(val) {
    if (val >= 1000000) {
      return '$' + (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return '$' + (val / 1000).toFixed(1) + 'k';
    }
    return '$' + Math.round(val);
  }

  function formatNumber(val) {
    return parseInt(val).toLocaleString('es-MX');
  }

  // Animación suave de aumento numérico para widgets
  function animateCounter(elementId, targetVal, prefix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Si ya hay una animación activa, la cancelamos guardándola en el dataset
    if (element.animationFrameId) {
      cancelAnimationFrame(element.animationFrameId);
    }

    const duration = 800; // ms
    const startTime = performance.now();
    // Obtener valor actual o iniciar en 0
    let currentText = element.textContent.replace(/[^\d]/g, '');
    let startVal = parseFloat(currentText) || 0;
    
    // Si la diferencia es muy pequeña, ponerlo directo
    if (Math.abs(targetVal - startVal) < 1) {
      element.textContent = prefix + targetVal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MXN';
      return;
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing de desaceleración (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      const currentVal = startVal + (targetVal - startVal) * easeProgress;
      
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

  function showToast(message) {
    const toast = document.getElementById('map-toast');
    toast.querySelector('span').textContent = message;
    toast.classList.add('show');
    
    // Ocultar después de 4.5 segundos
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    
    toast.timeoutId = setTimeout(() => {
      toast.classList.remove('show');
    }, 4500);
  }

  // Inicializar todo
  init();
