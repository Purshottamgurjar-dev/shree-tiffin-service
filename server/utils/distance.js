/**
 * distance.js - Geographic calculation & coordinate validation utilities
 * "Ghar Jaisa Khana, Har Din."
 */

// Earth's mean radius in kilometers
const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculate Great-Circle distance between two points using the Haversine formula
 * @param {number} lat1 Latitude of point 1 (in degrees)
 * @param {number} lon1 Longitude of point 1 (in degrees)
 * @param {number} lat2 Latitude of point 2 (in degrees)
 * @param {number} lon2 Longitude of point 2 (in degrees)
 * @returns {number} Distance in kilometers rounded to 2 decimal places
 */
export const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) {
    return NaN;
  }

  const toRad = (deg) => (deg * Math.PI) / 180.0;

  const dLat = toRad(p2 - p1);
  const dLon = toRad(l2 - l1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1)) * Math.cos(toRad(p2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Number(distance.toFixed(2));
};

/**
 * Validate and sanitize latitude and longitude coordinates
 * @param {any} lat Latitude
 * @param {any} lng Longitude
 * @returns {{ valid: boolean, latitude?: number, longitude?: number, message?: string }}
 */
export const validateCoordinates = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { valid: false, message: 'Both latitude and longitude are required' };
  }

  const latitude = typeof lat === 'string' ? parseFloat(lat.trim()) : Number(lat);
  const longitude = typeof lng === 'string' ? parseFloat(lng.trim()) : Number(lng);

  if (isNaN(latitude) || !isFinite(latitude)) {
    return { valid: false, message: 'Latitude must be a valid numeric value' };
  }
  if (latitude < -90.0 || latitude > 90.0) {
    return { valid: false, message: 'Latitude must be between -90.0 and +90.0 degrees' };
  }

  if (isNaN(longitude) || !isFinite(longitude)) {
    return { valid: false, message: 'Longitude must be a valid numeric value' };
  }
  if (longitude < -180.0 || longitude > 180.0) {
    return { valid: false, message: 'Longitude must be between -180.0 and +180.0 degrees' };
  }

  return {
    valid: true,
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
};

// Official Shree Tiffin Service Kitchen Coordinates
// Scheme No 78, Vijay Nagar, Indore, Madhya Pradesh 452010, India
export const OFFICIAL_KITCHEN_COORDINATES = Object.freeze({
  latitude: 22.7648,
  longitude: 75.8976,
  address: 'Scheme No 78, Vijay Nagar',
  city: 'Indore',
  state: 'Madhya Pradesh',
  postalCode: '452010',
  country: 'India',
  defaultDeliveryRadiusKm: 15.0,
});
