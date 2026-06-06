/**
 * EconHeat - Configurations and Constants
 */

export const PRESETS = {
  azteca: {
    name: "Estadio Azteca",
    lat: 19.3030,
    lng: -99.1506,
    attendance: 75000,
    radius: 1200,
    ticketPrice: 650,
    venueSpend: 180
  },
  auditorio: {
    name: "Auditorio Nacional",
    lat: 19.4247,
    lng: -99.1949,
    attendance: 10000,
    radius: 800,
    ticketPrice: 950,
    venueSpend: 150
  },
  monterrey: {
    name: "Estadio BBVA (MTY)",
    lat: 25.6692,
    lng: -100.2444,
    attendance: 51000,
    radius: 1000,
    ticketPrice: 800,
    venueSpend: 200
  },
  guadalajara: {
    name: "Estadio Akron (GDL)",
    lat: 20.6817,
    lng: -103.4628,
    attendance: 46000,
    radius: 1100,
    ticketPrice: 550,
    venueSpend: 160
  }
};

export const SIMULATED_NAMES = {
  oxxo: [
    "Oxxo Tlalpan", "Oxxo Santa Úrsula", "Oxxo Estadio", "Oxxo Imán", 
    "Oxxo Acoxpa", "Oxxo Huipulco", "Oxxo Insurgentes", "Oxxo Del Valle", 
    "Oxxo Bosques", "Oxxo Chapultepec", "Oxxo Reforma", "Oxxo Polanco", 
    "Oxxo Juárez", "Oxxo Patria", "Oxxo Vallarta", "Oxxo Américas", 
    "Oxxo Gonzalitos", "Oxxo Garza Sada", "Oxxo San Jerónimo"
  ],
  hotel: [
    "Hotel Fiesta Inn", "City Express Plus", "Holiday Inn", "Camino Real", 
    "NH Collection", "Hampton by Hilton", "Barceló", "Marriott Executive", 
    "Hotel Krystal", "One Hoteles", "Real Inn", "Hotel Sheraton"
  ],
  metro: [
    "Estación Tasqueña", "Estación General Anaya", "Estación Huipulco", 
    "Estación Auditorio", "Estación Constituyentes", "Estación Polanco", 
    "Estación Universidad", "Estación Copilco", "Estación Exposición", 
    "Estación Y Griega", "Estación Estadio", "Estación Periférico"
  ],
  restaurant: [
    "La Mansión Chapultepec", "El Cardenal", "Tacos El Califa", "Café El Jarocho", 
    "Restaurante El Bajío", "Pujol", "Los Arbolitos", "Vips Tlalpan", 
    "La Pagoda", "La Casa de Toño", "Tacos Orinoco", "El Cardenal Alameda"
  ],
  bar: [
    "La Cervecería de Barrio", "Cantina El Centenario", "Bar Milán", "Fever Club", 
    "La Bota", "Salón Corona", "McCarthy's Irish Pub", "The Dubliner", 
    "Pata Negra", "Cantina La Única", "El Depósito", "El Hijo del Cuervo"
  ]
};
