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
 * Seedable hash function to generate a deterministic noise float between 0 and 1.
 */
function getDeterministicNoise(stringSeed) {
  let hash = 0;
  for (let i = 0; i < stringSeed.length; i++) {
    hash = (hash << 5) - hash + stringSeed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
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
  useIndividualData,
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

    const noise = getDeterministicNoise(updatedPoi.id);

    if (updatedPoi.distance > radiusMeters) {
      updatedPoi.impact = 0;
      updatedPoi.metroSynergy = null;
      // Also calculate defaults to prevent undefined variables in UI
      if (updatedPoi.type === 'oxxo') {
        updatedPoi.calculatedTicket = updatedPoi.customTicket || (useIndividualData ? (75 + noise * 60) : oxxoTicket);
        updatedPoi.calculatedCaptureRate = useIndividualData ? (0.08 + noise * 0.12) : oxxoCaptureRate;
      } else if (updatedPoi.type === 'hotel') {
        updatedPoi.calculatedRate = updatedPoi.rate || (useIndividualData ? (1200 + noise * 1000) : hotelRate);
        updatedPoi.calculatedOccupancy = useIndividualData ? (0.70 + noise * 0.25) : hotelOccupancy;
      } else if (updatedPoi.type === 'metro') {
        updatedPoi.calculatedTicket = useIndividualData ? (15 + noise * 25) : metroTicket;
        updatedPoi.calculatedUsage = useIndividualData ? (0.25 + noise * 0.35) : metroUsage;
      } else if (updatedPoi.type === 'restaurant') {
        updatedPoi.calculatedTicket = updatedPoi.customTicket || (useIndividualData ? (100 + noise * 200) : restaurantTicket);
        updatedPoi.calculatedCaptureRate = useIndividualData ? (0.06 + noise * 0.10) : restaurantCaptureRate;
      } else if (updatedPoi.type === 'bar') {
        updatedPoi.calculatedTicket = updatedPoi.customTicket || (useIndividualData ? (150 + noise * 250) : barTicket);
        updatedPoi.calculatedCaptureRate = useIndividualData ? (0.05 + noise * 0.09) : barCaptureRate;
      }
      return updatedPoi;
    }

    // Proximity proportion (1 = center of event, 0 = edge of radius)
    const proximity = 1 - (updatedPoi.distance / radiusMeters);

    if (updatedPoi.type === 'oxxo') {
      // Oxxo Impact: Quadratic decay (people purchase closer)
      const ticket = updatedPoi.customTicket || (useIndividualData ? (75 + noise * 60) : oxxoTicket);
      const captureRate = useIndividualData ? (0.08 + noise * 0.12) : oxxoCaptureRate;
      
      updatedPoi.calculatedTicket = ticket;
      updatedPoi.calculatedCaptureRate = captureRate;

      const baseImpact = attendance * ticket * captureRate * Math.pow(proximity, 2);
      
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
      const rate = updatedPoi.rate || (useIndividualData ? (1200 + noise * 1000) : hotelRate);
      const occupancy = useIndividualData ? (0.70 + noise * 0.25) : hotelOccupancy;

      updatedPoi.calculatedRate = rate;
      updatedPoi.calculatedOccupancy = occupancy;

      updatedPoi.impact = rooms * occupancy * rate * 1.5;
      impactHoteles += updatedPoi.impact;
    } 
    else if (updatedPoi.type === 'metro') {
      // Transit Impact: Linear decay based on distance
      const usage = useIndividualData ? (0.25 + noise * 0.35) : metroUsage;
      const ticket = useIndividualData ? (15 + noise * 25) : metroTicket;

      updatedPoi.calculatedUsage = usage;
      updatedPoi.calculatedTicket = ticket;

      updatedPoi.impact = attendance * usage * ticket * proximity;
      impactMetro += updatedPoi.impact;
    }
    else if (updatedPoi.type === 'restaurant') {
      // Restaurant Impact: Linear decay (people can walk further)
      const ticket = updatedPoi.customTicket || (useIndividualData ? (100 + noise * 200) : restaurantTicket);
      const captureRate = useIndividualData ? (0.06 + noise * 0.10) : restaurantCaptureRate;

      updatedPoi.calculatedTicket = ticket;
      updatedPoi.calculatedCaptureRate = captureRate;

      updatedPoi.impact = attendance * ticket * captureRate * proximity;
      impactRestaurants += updatedPoi.impact;
    }
    else if (updatedPoi.type === 'bar') {
      // Bar Impact: Quadratic decay (concentrates closer to venue)
      const ticket = updatedPoi.customTicket || (useIndividualData ? (150 + noise * 250) : barTicket);
      const captureRate = useIndividualData ? (0.05 + noise * 0.09) : barCaptureRate;

      updatedPoi.calculatedTicket = ticket;
      updatedPoi.calculatedCaptureRate = captureRate;

      updatedPoi.impact = attendance * ticket * captureRate * Math.pow(proximity, 2);
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
