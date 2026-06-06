/**
 * EconHeat - Geographic Data API Client (OSM & Google Places)
 */

import { state } from './state.js';

// 1. OpenStreetMap Overpass API Fetcher
export async function fetchOSMData(lat, lng, radius) {
  // Query to search nodes, ways, and relations in the radius
  const query = `[out:json][timeout:25];
(
  nwr["brand"~"Oxxo",i](around:${radius},${lat},${lng});
  nwr["name"~"Oxxo",i](around:${radius},${lat},${lng});
  nwr["tourism"~"hotel|hostel|motel",i](around:${radius},${lat},${lng});
  nwr["railway"="station"](around:${radius},${lat},${lng});
  nwr["amenity"="restaurant"](around:${radius},${lat},${lng});
  nwr["amenity"~"bar|pub|nightclub",i](around:${radius},${lat},${lng});
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

export function parseOSMData(elements) {
  return elements.map(el => {
    const tags = el.tags || {};
    const lat = el.lat || (el.center ? el.center.lat : null);
    const lng = el.lon || (el.center ? el.center.lng : null);
    
    if (!lat || !lng) return null;

    let type = 'oxxo';
    let name = tags.name || 'Comercio Local';
    
    // Classify POI
    if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'motel' || tags.tourism === 'guest_house') {
      type = 'hotel';
      name = tags.name || 'Hotel Alojamiento';
    } else if (tags.railway === 'station' || tags.station === 'subway' || tags.subway === 'yes' || tags.railway === 'halt') {
      type = 'metro';
      name = tags.name || 'Estación de Metro';
    } else if (tags.amenity === 'restaurant' || tags.amenity === 'cafe' || tags.amenity === 'fast_food') {
      type = 'restaurant';
      name = tags.name || 'Restaurante';
    } else if (tags.amenity === 'bar' || tags.amenity === 'pub' || tags.amenity === 'nightclub' || tags.amenity === 'biergarten') {
      type = 'bar';
      name = tags.name || 'Bar / Pub';
    } else {
      const brandName = (tags.brand || tags.name || '').toLowerCase();
      if (brandName.includes('oxxo')) {
        type = 'oxxo';
        name = tags.name || 'Oxxo';
      } else {
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

// 2. Google Maps / Places API Loader & Client
export function loadGoogleMapsAPI(key) {
  return new Promise((resolve, reject) => {
    if (state.googleMapsLoaded) {
      resolve();
      return;
    }
    
    const oldScript = document.getElementById('google-maps-sdk');
    if (oldScript) oldScript.remove();

    window.initGoogleMapsCallback = () => {
      state.googleMapsLoaded = true;
      const dummyDiv = document.createElement('div');
      state.googlePlacesService = new google.maps.places.PlacesService(dummyDiv);
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
    if (!state.googlePlacesService) {
      reject(new Error('Google Places service no inicializado.'));
      return;
    }
    
    const request = {
      location: new google.maps.LatLng(lat, lng),
      radius: radius,
      ...options
    };
    
    state.googlePlacesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK || status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve(results || []);
      } else {
        reject(new Error(`Places Search falló con status: ${status}`));
      }
    });
  });
}

export async function fetchGooglePlacesData(lat, lng, radius) {
  const [oxxos, hotels, metros, restaurants, bars] = await Promise.all([
    searchGooglePlacesNearby(lat, lng, radius, { keyword: 'Oxxo' }),
    searchGooglePlacesNearby(lat, lng, radius, { type: 'lodging' }),
    searchGooglePlacesNearby(lat, lng, radius, { type: 'transit_station' }),
    searchGooglePlacesNearby(lat, lng, radius, { type: 'restaurant' }),
    searchGooglePlacesNearby(lat, lng, radius, { type: 'bar' })
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

  // Restaurantes
  restaurants.forEach(item => {
    list.push({
      id: `gcp-restaurant-${item.place_id}`,
      type: 'restaurant',
      name: item.name,
      lat: item.geometry.location.lat(),
      lng: item.geometry.location.lng(),
      distance: 0
    });
  });

  // Bares
  bars.forEach(item => {
    list.push({
      id: `gcp-bar-${item.place_id}`,
      type: 'bar',
      name: item.name,
      lat: item.geometry.location.lat(),
      lng: item.geometry.location.lng(),
      distance: 0
    });
  });

  list.forEach(applyOperationalMetrics);
  return list;
}

// 3. Simulated Operational Metrics
export function applyOperationalMetrics(poi) {
  if (poi.type === 'hotel') {
    const nameLower = poi.name.toLowerCase();
    let rooms = 100;
    if (nameLower.includes('grand') || nameLower.includes('sheraton') || nameLower.includes('marriott') || nameLower.includes('hilton') || nameLower.includes('camino real')) {
      rooms = Math.round(180 + Math.random() * 120); // Large
    } else if (nameLower.includes('fiesta inn') || nameLower.includes('city express') || nameLower.includes('holiday inn') || nameLower.includes('hampton')) {
      rooms = Math.round(100 + Math.random() * 60); // Medium
    } else {
      rooms = Math.round(30 + Math.random() * 50); // Small
    }
    poi.rooms = rooms;
    poi.rate = Math.round(8 + Math.random() * 22) * 100;
  } 
  else if (poi.type === 'metro') {
    const nameLower = poi.name.toLowerCase();
    let flow = 35000;
    if (nameLower.includes('tasqueña') || nameLower.includes('hidalgo') || nameLower.includes('bellas artes') || nameLower.includes('pino suárez') || nameLower.includes('balderas') || nameLower.includes('chabacano') || nameLower.includes('pantitlán')) {
      flow = Math.round(90 + Math.random() * 70) * 1000; // High transfer
    } else {
      flow = Math.round(15 + Math.random() * 35) * 1000; // Standard station
    }
    poi.flow = flow;
  }
}

/**
 * Searches for addresses or places using the OpenStreetMap Nominatim API.
 */
export async function searchAddressNominatim(query) {
  if (!query || query.trim().length < 3) return [];
  
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=mx`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'EconHeat-Visualizer'
    }
  });

  if (!response.ok) throw new Error('Error al consultar el servicio de búsqueda de direcciones.');
  const data = await response.json();
  
  return data.map(item => ({
    display_name: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon)
  }));
}

