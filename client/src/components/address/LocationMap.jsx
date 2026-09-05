import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Search,
  Crosshair,
  Maximize2,
  X,
  Compass,
} from 'lucide-react';
import locationService, {
  OFFICIAL_KITCHEN,
  calculateDistanceKm,
} from '../../services/locationService';

export default function LocationMap({
  latitude,
  longitude,
  onLocationChange,
  onAddressAutoFill,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const kitchenMarkerRef = useRef(null);

  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle' | 'detecting' | 'success' | 'denied' | 'unavailable' | 'timeout'
  const [geoMessage, setGeoMessage] = useState('');
  const [accuracyMeters, setAccuracyMeters] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Delivery status state
  const [deliveryStatus, setDeliveryStatus] = useState({
    distanceKm: null,
    isEligible: true,
    message: '',
  });

  // Kitchen reference coordinates
  const kitchenLat = OFFICIAL_KITCHEN.latitude;
  const kitchenLng = OFFICIAL_KITCHEN.longitude;
  const deliveryRadiusKm = OFFICIAL_KITCHEN.deliveryRadiusKm;

  // Active coordinates
  const currentLat = latitude !== null && latitude !== undefined ? Number(latitude) : kitchenLat;
  const currentLng = longitude !== null && longitude !== undefined ? Number(longitude) : kitchenLng;
  const hasSelectedCoords = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  // Custom customer delivery pin marker
  const createDeliveryPin = () => {
    return L.divIcon({
      className: 'custom-delivery-pin',
      html: `
        <div style="
          background: linear-gradient(135deg, #e8590c 0%, #c92a2a 100%);
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          cursor: grab;
        ">
          <div style="transform: rotate(45deg); font-size: 16px;">📍</div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });
  };

  // Kitchen origin pin marker
  const createKitchenPin = () => {
    return L.divIcon({
      className: 'custom-kitchen-pin',
      html: `
        <div style="
          background: linear-gradient(135deg, #2b8a3e 0%, #087f5b 100%);
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2.5px solid #ffffff;
          box-shadow: 0 3px 12px rgba(0,0,0,0.3);
        ">
          <div style="font-size: 15px;">🍲</div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -17],
    });
  };

  // Evaluate distance & delivery eligibility
  const updateDistanceEvaluation = useCallback((lat, lng) => {
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

    const distance = calculateDistanceKm(kitchenLat, kitchenLng, lat, lng);
    const isEligible = distance <= deliveryRadiusKm;

    setDeliveryStatus({
      distanceKm: distance,
      isEligible,
      message: isEligible
        ? `Delivery available (${distance} km from Vijay Nagar kitchen)`
        : `Outside our ${deliveryRadiusKm} km delivery area (${distance} km away)`,
    });
  }, [kitchenLat, kitchenLng, deliveryRadiusKm]);

  // Handle location update from drag, click, search, or GPS
  const handleCoordUpdate = useCallback(async (lat, lng, shouldReverseGeocode = true) => {
    const formattedLat = Number(lat.toFixed(6));
    const formattedLng = Number(lng.toFixed(6));

    onLocationChange(formattedLat, formattedLng);
    updateDistanceEvaluation(formattedLat, formattedLng);

    if (shouldReverseGeocode && onAddressAutoFill) {
      try {
        const addressData = await locationService.reverseGeocode(formattedLat, formattedLng);
        if (addressData) {
          onAddressAutoFill(addressData);
        }
      } catch (err) {
        // Non-blocking: keep coordinates and allow manual form entry
      }
    }
  }, [onLocationChange, onAddressAutoFill, updateDistanceEvaluation]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove any previous map instance on re-mount
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: hasSelectedCoords ? 15 : 13,
      zoomControl: false, // Custom placed zoom control below
      scrollWheelZoom: false, // Prevents trapping mobile page scrolling
    });

    // Add custom zoom control in top-right for mobile ergonomics
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(map);

    // 15 KM Delivery Radius Circle around Official Kitchen
    const radiusCircle = L.circle([kitchenLat, kitchenLng], {
      radius: deliveryRadiusKm * 1000,
      color: '#e8590c',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#ffa94d',
      fillOpacity: 0.08,
    }).addTo(map);
    radiusCircleRef.current = radiusCircle;

    // Kitchen Marker
    const kitchenMarker = L.marker([kitchenLat, kitchenLng], {
      icon: createKitchenPin(),
      zIndexOffset: 100,
    }).addTo(map);
    kitchenMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
        <strong style="color: #2b8a3e;">🍲 Shree Tiffin Service Kitchen</strong><br/>
        Scheme No 78, Vijay Nagar, Indore<br/>
        <em style="color: #666;">Delivery Radius: 15 KM</em>
      </div>
    `);
    kitchenMarkerRef.current = kitchenMarker;

    // Add Delivery Marker if coordinates exist
    if (hasSelectedCoords) {
      const marker = L.marker([currentLat, currentLng], {
        icon: createDeliveryPin(),
        draggable: true,
        zIndexOffset: 500,
      }).addTo(map);

      marker.bindTooltip('Move pin to your exact delivery location', {
        permanent: false,
        direction: 'top',
      });

      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        handleCoordUpdate(lat, lng, true);
      });

      markerRef.current = marker;
      updateDistanceEvaluation(currentLat, currentLng);
    }

    // Map Click / Tap Event
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const fLat = Number(lat.toFixed(6));
      const fLng = Number(lng.toFixed(6));

      if (markerRef.current) {
        markerRef.current.setLatLng([fLat, fLng]);
      } else {
        const marker = L.marker([fLat, fLng], {
          icon: createDeliveryPin(),
          draggable: true,
          zIndexOffset: 500,
        }).addTo(map);

        marker.on('dragend', (evt) => {
          const pos = evt.target.getLatLng();
          handleCoordUpdate(pos.lat, pos.lng, true);
        });

        markerRef.current = marker;
      }

      handleCoordUpdate(fLat, fLng, true);
      setGeoStatus('success');
      setGeoMessage('Location selected on map.');
    });

    mapInstanceRef.current = map;

    // Invalidate map size after short delay to prevent grey tiles
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    // Window orientation / resize listener
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view when external coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !hasSelectedCoords) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([currentLat, currentLng]);
    } else {
      const marker = L.marker([currentLat, currentLng], {
        icon: createDeliveryPin(),
        draggable: true,
        zIndexOffset: 500,
      }).addTo(mapInstanceRef.current);

      marker.on('dragend', (evt) => {
        const pos = evt.target.getLatLng();
        handleCoordUpdate(pos.lat, pos.lng, true);
      });

      markerRef.current = marker;
    }

    updateDistanceEvaluation(currentLat, currentLng);
  }, [latitude, longitude, hasSelectedCoords, currentLat, currentLng, handleCoordUpdate, updateDistanceEvaluation]);

  // "Use Current Location" (Browser Geolocation)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      setGeoMessage('Location services are not supported by this browser. Please select your location manually on the map.');
      return;
    }

    setGeoStatus('detecting');
    setGeoMessage('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        setAccuracyMeters(accuracy);
        setGeoStatus('success');

        if (accuracy > 300) {
          setGeoMessage(`Location detected (accuracy: ~${accuracy} m). Please drag the pin to your exact building.`);
        } else {
          setGeoMessage(`Location detected successfully (accuracy: ~${accuracy} m)! Drag pin to fine-tune.`);
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true });

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], {
              icon: createDeliveryPin(),
              draggable: true,
              zIndexOffset: 500,
            }).addTo(mapInstanceRef.current);

            marker.on('dragend', (evt) => {
              const pos = evt.target.getLatLng();
              handleCoordUpdate(pos.lat, pos.lng, true);
            });

            markerRef.current = marker;
          }
        }

        handleCoordUpdate(lat, lng, true);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('denied');
          setGeoMessage('Location permission was denied. Please enable location access or select your location manually on the map.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoStatus('unavailable');
          setGeoMessage('Your location could not be detected. Please try again or select your location manually on the map.');
        } else if (error.code === error.TIMEOUT) {
          setGeoStatus('timeout');
          setGeoMessage('Location detection timed out. Please try again or select your location manually on the map.');
        } else {
          setGeoStatus('unavailable');
          setGeoMessage('Unable to detect location. Please tap on the map to set your delivery location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Debounced search for Indore localities
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val.trim() || val.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await locationService.searchLocalities(val);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  // Select a search result
  const handleSelectSearchResult = (result) => {
    const lat = Number(result.latitude.toFixed(6));
    const lng = Number(result.longitude.toFixed(6));

    setSearchQuery(result.name || result.displayName);
    setShowSearchResults(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: createDeliveryPin(),
          draggable: true,
          zIndexOffset: 500,
        }).addTo(mapInstanceRef.current);

        marker.on('dragend', (evt) => {
          const pos = evt.target.getLatLng();
          handleCoordUpdate(pos.lat, pos.lng, true);
        });

        markerRef.current = marker;
      }
    }

    handleCoordUpdate(lat, lng, true);
    setGeoStatus('success');
    setGeoMessage(`Moved to ${result.name || 'selected place'}.`);
  };

  // Recenter to Official Kitchen
  const handleRecenterKitchen = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([kitchenLat, kitchenLng], 14, { animate: true });
    }
  };

  // Recenter to Selected Delivery Pin
  const handleRecenterPin = () => {
    if (mapInstanceRef.current && hasSelectedCoords) {
      mapInstanceRef.current.setView([currentLat, currentLng], 16, { animate: true });
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Top Header: Label & "Use Current Location" Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
          <MapPin size={17} color="var(--primary-800)" />
          <span>Pin Delivery Location on Map *</span>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoStatus === 'detecting'}
          className="btn btn-secondary"
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            minHeight: '44px', // 44px mobile touch target
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: geoStatus === 'detecting' ? 'wait' : 'pointer',
            backgroundColor: geoStatus === 'detecting' ? 'var(--bg-subtle)' : undefined,
          }}
          aria-label="Use Current GPS Location"
        >
          {geoStatus === 'detecting' ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Detecting Location...</span>
            </>
          ) : (
            <>
              <Navigation size={14} color="var(--primary-800)" />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Locality Search Input */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0 12px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <Search size={16} color="var(--text-tertiary)" style={{ flexShrink: 0, marginRight: '8px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search area, landmark or colony in Indore (e.g. Vijay Nagar, Palasia, Bhawarkua)..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              padding: '10px 0',
              color: 'var(--text-primary)',
              backgroundColor: 'transparent',
            }}
          />
          {isSearching && (
            <RefreshCw size={14} className="animate-spin" color="var(--text-tertiary)" style={{ marginLeft: '6px' }} />
          )}
          {searchQuery && !isSearching && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            maxHeight: '220px',
            overflowY: 'auto',
          }}>
            {searchResults.map((item, idx) => (
              <div
                key={item.placeId || idx}
                onClick={() => handleSelectSearchResult(item)}
                style={{
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  borderBottom: idx < searchResults.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <MapPin size={14} color="var(--primary-800)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name || item.displayName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.displayName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Geolocation Feedback Message */}
      {geoMessage && (
        <div style={{
          backgroundColor: geoStatus === 'success' ? 'var(--veg-50)' : '#fff3bf',
          border: `1px solid ${geoStatus === 'success' ? 'var(--veg-200)' : '#fab005'}`,
          color: geoStatus === 'success' ? 'var(--veg-800)' : '#b25e00',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          lineHeight: 1.4,
        }}>
          {geoStatus === 'success' ? (
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
          ) : (
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
          )}
          <span>{geoMessage}</span>
        </div>
      )}

      {/* Map Canvas Container */}
      <div style={{ position: 'relative' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '280px', // Mobile & Desktop optimal touch height
            borderRadius: 'var(--radius-md)',
            border: hasSelectedCoords
              ? (deliveryStatus.isEligible ? '2px solid var(--primary-700)' : '2px solid var(--status-danger)')
              : '2px dashed var(--border-subtle)',
            overflow: 'hidden',
            backgroundColor: '#e9ecef',
            zIndex: 1,
          }}
        />

        {/* Quick Map Overlay Controls */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 500,
        }}>
          {hasSelectedCoords && (
            <button
              type="button"
              onClick={handleRecenterPin}
              title="Focus on delivery pin"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--primary-800)',
              }}
              aria-label="Recenter to Delivery Pin"
            >
              <Crosshair size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={handleRecenterKitchen}
            title="Show Vijay Nagar kitchen"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--veg-800)',
            }}
            aria-label="View Kitchen Location"
          >
            <Compass size={18} />
          </button>
        </div>
      </div>

      {/* Delivery Radius & Distance Status Card */}
      <div style={{
        marginTop: '10px',
        padding: '12px 14px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: hasSelectedCoords
          ? (deliveryStatus.isEligible ? 'rgba(43, 138, 62, 0.08)' : 'rgba(250, 82, 82, 0.08)')
          : 'var(--bg-subtle)',
        border: hasSelectedCoords
          ? (deliveryStatus.isEligible ? '1px solid var(--veg-200)' : '1px solid var(--status-danger)')
          : '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasSelectedCoords ? (
              deliveryStatus.isEligible ? (
                <CheckCircle2 size={18} color="var(--veg-700)" style={{ flexShrink: 0 }} />
              ) : (
                <AlertCircle size={18} color="var(--status-danger)" style={{ flexShrink: 0 }} />
              )
            ) : (
              <MapPin size={18} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
            )}

            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: hasSelectedCoords
                  ? (deliveryStatus.isEligible ? 'var(--veg-800)' : 'var(--status-danger)')
                  : 'var(--text-primary)',
              }}>
                {hasSelectedCoords
                  ? (deliveryStatus.isEligible ? '✓ Delivery Available (Within 15 KM)' : '✕ Outside Delivery Area')
                  : 'Tap map or use GPS to select delivery location'}
              </div>

              {hasSelectedCoords && deliveryStatus.distanceKm !== null && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {deliveryStatus.distanceKm} km from our kitchen in Scheme No 78, Vijay Nagar.
                  {deliveryStatus.isEligible
                    ? ' Free delivery (₹0 fee) applied.'
                    : ` Fresh tiffin limit is ${deliveryRadiusKm} km.`}
                </div>
              )}
            </div>
          </div>

          {/* Coordinate Readout */}
          {hasSelectedCoords ? (
            <div style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              backgroundColor: '#ffffff',
              padding: '4px 8px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontWeight: '600',
            }}>
              📍 {currentLat.toFixed(4)}°, {currentLng.toFixed(4)}°
            </div>
          ) : (
            <div style={{ fontSize: '11.5px', color: 'var(--status-danger)', fontWeight: '600' }}>
              ⚠️ Pin required
            </div>
          )}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px', fontStyle: 'italic' }}>
          👉 Move the pin or tap anywhere on the map to set your exact doorstep.
        </div>
      </div>
    </div>
  );
}
