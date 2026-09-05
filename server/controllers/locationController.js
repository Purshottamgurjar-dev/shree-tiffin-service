/**
 * locationController.js - Geocoding proxy, kitchen coordinates & delivery radius checks
 * "Ghar Jaisa Khana, Har Din."
 */

import BusinessSettings from '../models/BusinessSettings.js';
import {
  validateCoordinates,
  calculateHaversineDistanceKm,
  OFFICIAL_KITCHEN_COORDINATES,
} from '../utils/distance.js';

// Simple in-memory cache to respect Nominatim usage policy & deliver sub-millisecond responses
const geocodeCache = new Map();
const searchCache = new Map();
const CACHE_MAX_SIZE = 500;

function setCache(cache, key, value) {
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, value);
}

/**
 * @desc    Get official kitchen origin coordinates & delivery radius
 * @route   GET /api/location/kitchen
 * @access  Public
 */
export const getKitchenLocation = async (req, res, next) => {
  try {
    const settings = await BusinessSettings.getSettings();
    const lat = Number(settings.businessInfo?.location?.latitude || OFFICIAL_KITCHEN_COORDINATES.latitude);
    const lng = Number(settings.businessInfo?.location?.longitude || OFFICIAL_KITCHEN_COORDINATES.longitude);
    const radiusKm = Number(settings.delivery?.deliveryRadius || OFFICIAL_KITCHEN_COORDINATES.defaultDeliveryRadiusKm);

    res.status(200).json({
      success: true,
      data: {
        brandName: settings.businessInfo?.name || 'Shree Tiffin Service',
        tagline: settings.businessInfo?.tagline || 'Ghar Jaisa Khana, Har Din.',
        address: settings.businessInfo?.address || OFFICIAL_KITCHEN_COORDINATES.address,
        city: settings.businessInfo?.city || OFFICIAL_KITCHEN_COORDINATES.city,
        state: settings.businessInfo?.state || OFFICIAL_KITCHEN_COORDINATES.state,
        postalCode: settings.businessInfo?.postalCode || OFFICIAL_KITCHEN_COORDINATES.postalCode,
        latitude: lat,
        longitude: lng,
        deliveryRadiusKm: radiusKm,
        deliveryFee: Number(settings.delivery?.deliveryFee || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if customer coordinates are within delivery radius
 * @route   GET /api/location/check-radius
 * @access  Public
 */
export const checkDeliveryRadius = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const settings = await BusinessSettings.getSettings();
    const result = settings.checkDeliveryEligibility(lat, lng);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reverse geocode coordinates to structured address
 * @route   GET /api/location/reverse
 * @access  Public
 */
export const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    const validation = validateCoordinates(lat, lng);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const cacheKey = `${validation.latitude.toFixed(4)},${validation.longitude.toFixed(4)}`;
    if (geocodeCache.has(cacheKey)) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: geocodeCache.get(cacheKey),
      });
    }

    // Call OpenStreetMap Nominatim reverse geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${validation.latitude}&lon=${validation.longitude}&addressdetails=1`;

    let nominatimData = null;
    try {
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'ShreeTiffinService/1.0 (shreetiffinservice09@gmail.com; homestyle tiffin delivery Indore)',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
      });

      if (response.ok) {
        nominatimData = await response.json();
      }
    } catch (fetchErr) {
      // Non-blocking fallback
      nominatimData = null;
    }

    const addr = nominatimData?.address || {};

    // Normalize into Indian address structure
    const road = addr.road || addr.street || addr.footway || addr.path || '';
    const houseNumber = addr.house_number || addr.building || '';
    const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || '';
    const landmark = addr.amenity || addr.shop || addr.commercial || '';
    const city = addr.city || addr.town || addr.village || addr.county || 'Indore';
    const state = addr.state || 'Madhya Pradesh';
    const postalCode = addr.postcode || '';
    const country = addr.country || 'India';

    let addressLine1 = [houseNumber, road].filter(Boolean).join(', ');
    if (!addressLine1 && suburb) {
      addressLine1 = suburb;
    }

    const normalized = {
      displayName: nominatimData?.display_name || `${city}, ${state}`,
      addressLine1: addressLine1 || '',
      addressLine2: suburb !== addressLine1 ? suburb : '',
      landmark: landmark || '',
      city: city,
      state: state,
      postalCode: postalCode,
      country: country,
      latitude: validation.latitude,
      longitude: validation.longitude,
    };

    setCache(geocodeCache, cacheKey, normalized);

    res.status(200).json({
      success: true,
      source: nominatimData ? 'nominatim' : 'fallback',
      data: normalized,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search Indore localities / places
 * @route   GET /api/location/search
 * @access  Public
 */
export const searchLocation = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const query = q.trim().toLowerCase();
    const cacheKey = query;

    if (searchCache.has(cacheKey)) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        data: searchCache.get(cacheKey),
      });
    }

    // Call Nominatim search with Indore bounding box
    // Indore approximate bounding box: 75.7,22.6 to 76.0,22.85
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ' Indore')}&countrycodes=in&viewbox=75.6,22.9,76.1,22.6&bounded=0&limit=6&addressdetails=1`;

    let results = [];
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'ShreeTiffinService/1.0 (shreetiffinservice09@gmail.com; homestyle tiffin delivery Indore)',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
      });

      if (response.ok) {
        const rawResults = await response.json();
        if (Array.isArray(rawResults)) {
          results = rawResults.map((item) => {
            const addr = item.address || {};
            const road = addr.road || addr.street || '';
            const suburb = addr.suburb || addr.neighbourhood || '';
            const city = addr.city || addr.town || 'Indore';
            const postalCode = addr.postcode || '';

            return {
              placeId: item.place_id,
              name: item.name || item.display_name?.split(',')[0],
              displayName: item.display_name,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              addressLine1: road || item.name || '',
              addressLine2: suburb || '',
              city: city,
              state: addr.state || 'Madhya Pradesh',
              postalCode: postalCode,
            };
          });
        }
      }
    } catch (fetchErr) {
      results = [];
    }

    setCache(searchCache, cacheKey, results);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
