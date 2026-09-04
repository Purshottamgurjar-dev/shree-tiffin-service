import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

export default function LocationMap({ latitude, longitude, onLocationChange }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [geoStatus, setGeoStatus] = useState('idle'); // 'idle', 'detecting', 'success', 'denied', 'unavailable', 'timeout'
  const [geoMessage, setGeoMessage] = useState('');

  // Default coordinate if none provided (Indore, Central India)
  const defaultLat = 22.7196;
  const defaultLng = 75.8577;

  const currentLat = latitude ? Number(latitude) : defaultLat;
  const currentLng = longitude ? Number(longitude) : defaultLng;
  const hasSelectedCoords = latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null;

  // Custom styled delivery pin marker
  const createDeliveryPin = () => {
    return L.divIcon({
      className: 'custom-delivery-pin',
      html: `
        <div style="
          background: linear-gradient(135deg, #e8590c 0%, #c92a2a 100%);
          width: 38px;
          height: 38px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.35);
          cursor: grab;
        ">
          <div style="transform: rotate(45deg); font-size: 15px;">🍲</div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy any existing map instance on re-mount
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: hasSelectedCoords ? 15 : 13,
      zoomControl: true,
    });

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Add marker if coordinates exist
    if (hasSelectedCoords) {
      const marker = L.marker([currentLat, currentLng], {
        icon: createDeliveryPin(),
        draggable: true,
      }).addTo(map);

      // Marker drag event
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        onLocationChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
      });

      markerRef.current = marker;
    }

    // Map click event to place / adjust marker
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const formattedLat = Number(lat.toFixed(6));
      const formattedLng = Number(lng.toFixed(6));

      if (markerRef.current) {
        markerRef.current.setLatLng([formattedLat, formattedLng]);
      } else {
        const marker = L.marker([formattedLat, formattedLng], {
          icon: createDeliveryPin(),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', (evt) => {
          const pos = evt.target.getLatLng();
          onLocationChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
        });

        markerRef.current = marker;
      }

      onLocationChange(formattedLat, formattedLng);
      setGeoStatus('success');
      setGeoMessage('Location selected on map.');
    });

    mapInstanceRef.current = map;

    // Trigger resize after small delay to ensure container size is settled
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map and marker when external coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !hasSelectedCoords) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([currentLat, currentLng]);
    } else {
      const marker = L.marker([currentLat, currentLng], {
        icon: createDeliveryPin(),
        draggable: true,
      }).addTo(mapInstanceRef.current);

      marker.on('dragend', (evt) => {
        const pos = evt.target.getLatLng();
        onLocationChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });

      markerRef.current = marker;
    }

    mapInstanceRef.current.setView([currentLat, currentLng], 15);
  }, [latitude, longitude]);

  // Geolocation trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      setGeoMessage('Geolocation is not supported by your browser. Please select location manually on the map.');
      return;
    }

    setGeoStatus('detecting');
    setGeoMessage('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        onLocationChange(lat, lng);
        setGeoStatus('success');
        setGeoMessage('Your current location was detected successfully! You can drag the marker to fine-tune it.');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], {
              icon: createDeliveryPin(),
              draggable: true,
            }).addTo(mapInstanceRef.current);

            marker.on('dragend', (evt) => {
              const pos = evt.target.getLatLng();
              onLocationChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
            });

            markerRef.current = marker;
          }
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('denied');
          setGeoMessage('Location permission was denied. Please allow location access in your browser or click on the map to set your address pin.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoStatus('unavailable');
          setGeoMessage('Your position could not be determined. Please click on the map to place your delivery pin.');
        } else if (error.code === error.TIMEOUT) {
          setGeoStatus('timeout');
          setGeoMessage('Location request timed out. Please click on the map to select your delivery pin.');
        } else {
          setGeoStatus('unavailable');
          setGeoMessage('Unable to retrieve location. Please select it manually on the map.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div style={{ marginBottom: '18px' }}>
      {/* Action Bar: Use Current Location Button & Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
          <MapPin size={16} color="var(--primary-800)" />
          <span>Pin Delivery Location on Map *</span>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={geoStatus === 'detecting'}
          className="btn btn-secondary"
          style={{
            padding: '6px 14px',
            fontSize: '12.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {geoStatus === 'detecting' ? (
            <>
              <RefreshCw size={13} className="animate-spin" />
              <span>Detecting Location...</span>
            </>
          ) : (
            <>
              <Navigation size={13} color="var(--primary-800)" />
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>

      {/* Geolocation Feedback Alert */}
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

      {/* Interactive Map Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '240px',
          borderRadius: 'var(--radius-md)',
          border: hasSelectedCoords ? '2px solid var(--primary-700)' : '2px dashed var(--border-subtle)',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#e9ecef',
          zIndex: 1,
        }}
      />

      {/* Helper Guidance & Coordinate Readout */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '8px',
        fontSize: '11.5px',
        color: 'var(--text-tertiary)',
      }}>
        <div>
          👉 <em>Drag the pin or click anywhere on the map to adjust delivery point.</em>
        </div>

        {hasSelectedCoords ? (
          <div style={{
            fontFamily: 'monospace',
            backgroundColor: 'var(--bg-subtle)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-primary)',
            fontWeight: '600',
          }}>
            📍 {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
          </div>
        ) : (
          <div style={{ color: 'var(--status-danger)', fontWeight: '600' }}>
            ⚠️ Coordinates required (Click map or use GPS)
          </div>
        )}
      </div>
    </div>
  );
}
