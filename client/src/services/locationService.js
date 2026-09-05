/**
 * locationService.js - Frontend client service for map, geocoding, and delivery radius
 * "Ghar Jaisa Khana, Har Din."
 */

import api from './api';

// Official Kitchen Default Coordinates (Fallback)
export const OFFICIAL_KITCHEN = Object.freeze({
  latitude: 22.7648,
  longitude: 75.8976,
  address: 'Scheme No 78, Vijay Nagar',
  city: 'Indore',
  state: 'Madhya Pradesh',
  postalCode: '452010',
  deliveryRadiusKm: 15,
});

/**
 * Client-side Haversine formula for zero-latency distance computation
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const p1 = Number(lat1);
  const l1 = Number(lon1);
  const p2 = Number(lat2);
  const l2 = Number(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) return NaN;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(p2 - p1);
  const dLon = toRad(l2 - l1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1)) * Math.cos(toRad(p2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

/**
 * Get official kitchen coordinates & delivery configuration
 */
export const getKitchenLocation = async () => {
  try {
    const res = await api.get('/location/kitchen');
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    // Fallback to official constant
  }
  return OFFICIAL_KITCHEN;
};

/**
 * Check delivery radius eligibility
 */
export const checkRadius = async (lat, lng) => {
  try {
    const res = await api.get(`/location/check-radius?lat=${lat}&lng=${lng}`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    // Client-side fallback calculation
  }

  const distance = calculateDistanceKm(OFFICIAL_KITCHEN.latitude, OFFICIAL_KITCHEN.longitude, lat, lng);
  const isEligible = !isNaN(distance) && distance <= OFFICIAL_KITCHEN.deliveryRadiusKm;

  return {
    isEligible,
    distanceKm: distance,
    maxRadiusKm: OFFICIAL_KITCHEN.deliveryRadiusKm,
    kitchenCoordinates: { latitude: OFFICIAL_KITCHEN.latitude, longitude: OFFICIAL_KITCHEN.longitude },
    customerCoordinates: { latitude: lat, longitude: lng },
    message: isEligible
      ? `Delivery available (${distance} km from kitchen)`
      : `Location is outside our ${OFFICIAL_KITCHEN.deliveryRadiusKm} km delivery radius (${distance} km away)`,
  };
};

/**
 * Reverse geocode coordinates to structured address fields
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const res = await api.get(`/location/reverse?lat=${lat}&lng=${lng}`);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    // Fallback to direct Nominatim call if backend endpoint has network error
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en-IN,en;q=0.9' } }
      );
      if (nomRes.ok) {
        const item = await nomRes.json();
        const addr = item.address || {};
        const road = addr.road || addr.street || '';
        const houseNumber = addr.house_number || '';
        const suburb = addr.suburb || addr.neighbourhood || '';
        const city = addr.city || addr.town || 'Indore';

        return {
          addressLine1: [houseNumber, road].filter(Boolean).join(', ') || suburb || '',
          addressLine2: suburb || '',
          landmark: addr.amenity || '',
          city: city,
          state: addr.state || 'Madhya Pradesh',
          postalCode: addr.postcode || '',
          country: addr.country || 'India',
          latitude: lat,
          longitude: lng,
        };
      }
    } catch (fallbackErr) {
      // Return null so user's manual inputs are preserved
    }
  }
  return null;
};

/**
 * Search localities in Indore
 */
export const searchLocalities = async (query) => {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await api.get(`/location/search?q=${encodeURIComponent(query)}`);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
  } catch (err) {
    // Fallback direct Nominatim search
    try {
      const searchRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ' Indore')}&countrycodes=in&viewbox=75.6,22.9,76.1,22.6&bounded=0&limit=5&addressdetails=1`
      );
      if (searchRes.ok) {
        const list = await searchRes.json();
        return (list || []).map((item) => ({
          name: item.name || item.display_name?.split(',')[0],
          displayName: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          city: item.address?.city || 'Indore',
          state: item.address?.state || 'Madhya Pradesh',
          postalCode: item.address?.postcode || '',
        }));
      }
    } catch (nomErr) {
      return [];
    }
  }
  return [];
};

export default {
  OFFICIAL_KITCHEN,
  calculateDistanceKm,
  getKitchenLocation,
  checkRadius,
  reverseGeocode,
  searchLocalities,
};
