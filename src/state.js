/**
 * EconHeat - State Management Store
 */

import { PRESETS } from './config.js';

export const state = {
  // Array of dynamically loaded POIs (real or fallback mock data)
  pois: [],
  
  // Array of user custom-created POIs placed manually
  userPois: [],
  
  // Placing a custom POI state
  isPlacingPoi: false,
  pendingPoiData: null,
  
  // API Integration states
  googleMapsLoaded: false,
  googlePlacesService: null,
  
  // Current active event center/preset configuration
  currentCenter: { ...PRESETS.azteca },

  // Methods to modify state cleanly
  resetUserPois() {
    this.userPois = [];
  },

  getAllPois() {
    return [...this.pois, ...this.userPois];
  }
};
