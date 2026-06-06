/**
 * EconHeat - Economic Impact Calculations (Pure Logic)
 */

/**
 * Calculates the Haversine distance in meters between two coordinates.
 */
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Runs the economic simulation calculator based on current parameters and POIs.
 * Returns the calculated breakdowns and updates POI distance and individual impact.
 */
export function calculateEconomicImpact({
  eventLat,
  eventLng,
  radiusMeters,
  attendance,
  ticketPrice,
  venueSpend,
  oxxoTicket,
  oxxoCaptureRate,
  hotelRate,
  hotelOccupancy,
  metroUsage,
  metroTicket,
  restaurantTicket,
  restaurantCaptureRate,
  barTicket,
  barCaptureRate,
  allPois
}) {
  // 1. Direct Event Revenue
  const impactEvent = attendance * (ticketPrice + venueSpend);

  let impactOxxos = 0;
  let impactHoteles = 0;
  let impactMetro = 0;
  let impactRestaurants = 0;
  let impactBars = 0;

  // Clone or modify the POIs array to preserve purity
  const calculatedPois = allPois.map(poi => {
    const updatedPoi = { ...poi };
    
    // Calculate distance using pure Haversine formula
    updatedPoi.distance = getDistance(poi.lat, poi.lng, eventLat, eventLng);

    if (updatedPoi.distance > radiusMeters) {
      updatedPoi.impact = 0;
      updatedPoi.metroSynergy = null;
      return updatedPoi;
    }

    // Proximity proportion (1 = center of event, 0 = edge of radius)
    const proximity = 1 - (updatedPoi.distance / radiusMeters);

    if (updatedPoi.type === 'oxxo') {
      // Oxxo Impact: Quadratic decay (people purchase closer)
      const ticket = updatedPoi.customTicket || oxxoTicket;
      const baseImpact = attendance * ticket * oxxoCaptureRate * Math.pow(proximity, 2);
      
      // Transit Synergy Multiplier: Search closest metro station
      let metroMultiplier = 1;
      let nearestMetro = null;
      let minMetroDist = Infinity;
      
      allPois.forEach(other => {
        if (other.type === 'metro') {
          const distToMetro = getDistance(updatedPoi.lat, updatedPoi.lng, other.lat, other.lng);
          if (distToMetro < minMetroDist) {
            minMetroDist = distToMetro;
            nearestMetro = other;
          }
        }
      });
      
      // Apply 1.5x max synergy boost if within 300m
      if (nearestMetro && minMetroDist < 300) {
        const metroProximity = 1 - (minMetroDist / 300);
        metroMultiplier = 1 + 0.5 * metroProximity;
        updatedPoi.metroSynergy = {
          stationName: nearestMetro.name,
          boostPct: Math.round((metroMultiplier - 1) * 100),
          distance: Math.round(minMetroDist)
        };
      } else {
        updatedPoi.metroSynergy = null;
      }
      
      updatedPoi.impact = baseImpact * metroMultiplier;
      impactOxxos += updatedPoi.impact;
    } 
    else if (updatedPoi.type === 'hotel') {
      // Hotel Impact: Accommodations (1.5 average night stay)
      const rooms = updatedPoi.rooms || 120;
      const rate = updatedPoi.rate || hotelRate;
      updatedPoi.impact = rooms * hotelOccupancy * rate * 1.5;
      impactHoteles += updatedPoi.impact;
    } 
    else if (updatedPoi.type === 'metro') {
      // Transit Impact: Linear decay based on distance
      updatedPoi.impact = attendance * metroUsage * metroTicket * proximity;
      impactMetro += updatedPoi.impact;
    }
    else if (updatedPoi.type === 'restaurant') {
      // Restaurant Impact: Linear decay (people can walk further)
      const ticket = updatedPoi.customTicket || restaurantTicket;
      updatedPoi.impact = attendance * ticket * restaurantCaptureRate * proximity;
      impactRestaurants += updatedPoi.impact;
    }
    else if (updatedPoi.type === 'bar') {
      // Bar Impact: Quadratic decay (concentrates closer to venue)
      const ticket = updatedPoi.customTicket || barTicket;
      updatedPoi.impact = attendance * ticket * barCaptureRate * Math.pow(proximity, 2);
      impactBars += updatedPoi.impact;
    }

    return updatedPoi;
  });

  const totalImpact = impactEvent + impactOxxos + impactHoteles + impactMetro + impactRestaurants + impactBars;

  return {
    total: totalImpact,
    event: impactEvent,
    oxxo: impactOxxos,
    hotel: impactHoteles,
    metro: impactMetro,
    restaurant: impactRestaurants,
    bar: impactBars,
    pois: calculatedPois
  };
}
