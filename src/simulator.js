/**
 * EconHeat - Offline Mock Data Simulator
 */

import { SIMULATED_NAMES } from './config.js';

export function generateSimulatedPOIs(centerLat, centerLng, radiusMeters) {
  const list = [];
  
  if (radiusMeters < 50) return list;

  const numOxxos = Math.max(4, Math.min(12, Math.round(radiusMeters / 120)));
  const numHoteles = Math.max(2, Math.min(6, Math.round(radiusMeters / 220)));
  const numMetros = Math.max(1, Math.min(3, Math.round(radiusMeters / 450)));

  const radiusInDegreesLat = radiusMeters / 111300;
  const radiusInDegreesLng = radiusMeters / (111300 * Math.cos(centerLat * Math.PI / 180));

  function getRandomLocation(minDistPct = 0.05, maxDistPct = 0.95) {
    const angle = Math.random() * Math.PI * 2;
    const distanceFactor = minDistPct + Math.random() * (maxDistPct - minDistPct);
    const radialDistance = distanceFactor;
    
    const latOffset = Math.sin(angle) * radialDistance * radiusInDegreesLat;
    const lngOffset = Math.cos(angle) * radialDistance * radiusInDegreesLng;
    
    return {
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset,
      distance: radialDistance * radiusMeters
    };
  }

  // Helper shuffle
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // 1. Generate Oxxos
  const oxxoNames = shuffleArray(SIMULATED_NAMES.oxxo);
  for (let i = 0; i < numOxxos; i++) {
    const loc = getRandomLocation(0.05, 0.95);
    list.push({
      id: `sim-oxxo-${i}`,
      type: 'oxxo',
      name: oxxoNames[i % oxxoNames.length] || `Oxxo Sucursal ${i+1}`,
      lat: loc.lat,
      lng: loc.lng,
      distance: loc.distance,
      baseValue: 95
    });
  }

  // 2. Generate Hotels
  const hotelNames = shuffleArray(SIMULATED_NAMES.hotel);
  for (let i = 0; i < numHoteles; i++) {
    const loc = getRandomLocation(0.2, 0.95);
    const rooms = Math.round(45 + Math.random() * 175);
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

  // 3. Generate Metro stations
  const metroNames = shuffleArray(SIMULATED_NAMES.metro);
  for (let i = 0; i < numMetros; i++) {
    const loc = getRandomLocation(0.15, 0.9);
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

  // 4. Generate Restaurants
  const numRestaurants = Math.max(3, Math.min(8, Math.round(radiusMeters / 150)));
  const restNames = shuffleArray(SIMULATED_NAMES.restaurant);
  for (let i = 0; i < numRestaurants; i++) {
    const loc = getRandomLocation(0.1, 0.9);
    list.push({
      id: `sim-restaurant-${i}`,
      type: 'restaurant',
      name: restNames[i % restNames.length] || `Restaurante Sucursal ${i+1}`,
      lat: loc.lat,
      lng: loc.lng,
      distance: loc.distance,
      baseValue: 180
    });
  }

  // 5. Generate Bars
  const numBars = Math.max(2, Math.min(6, Math.round(radiusMeters / 200)));
  const barNames = shuffleArray(SIMULATED_NAMES.bar);
  for (let i = 0; i < numBars; i++) {
    const loc = getRandomLocation(0.15, 0.95);
    list.push({
      id: `sim-bar-${i}`,
      type: 'bar',
      name: barNames[i % barNames.length] || `Bar ${i+1}`,
      lat: loc.lat,
      lng: loc.lng,
      distance: loc.distance,
      baseValue: 250
    });
  }

  return list;
}
