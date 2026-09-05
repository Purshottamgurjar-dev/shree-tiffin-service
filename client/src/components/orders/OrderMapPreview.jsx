import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

export default function OrderMapPreview({ latitude, longitude, label = 'Delivery Location', addressText = '' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const isValidCoords = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  useEffect(() => {
    if (!mapContainerRef.current || !isValidCoords) return;

    // Cleanup previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom delivery marker
      const customPin = L.divIcon({
        className: 'order-delivery-pin',
        html: `
          <div style="
            background: linear-gradient(135deg, #e8590c 0%, #c92a2a 100%);
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          ">
            <div style="transform: rotate(45deg); font-size: 14px;">🍲</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([lat, lng], { icon: customPin }).addTo(map);
      marker.bindPopup(`<b>${label}</b><br/>${addressText || 'Pinned delivery location'}`).openPopup();

      // Kitchen origin pin
      const kitchenPin = L.divIcon({
        className: 'order-kitchen-pin',
        html: `
          <div style="
            background: linear-gradient(135deg, #2b8a3e 0%, #087f5b 100%);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          ">
            <div style="font-size: 13px;">🍲</div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const kitchenMarker = L.marker([22.7648, 75.8976], { icon: kitchenPin }).addTo(map);
      kitchenMarker.bindPopup('<b>Kitchen Origin</b><br/>Scheme No 78, Vijay Nagar, Indore');

      // Fit bounds to show both kitchen and customer destination
      const bounds = L.latLngBounds([[22.7648, 75.8976], [lat, lng]]);
      map.fitBounds(bounds, { padding: [25, 25], maxZoom: 15 });

      mapInstanceRef.current = map;

      // Handle resize
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    } catch (err) {
      console.error('Error mounting order map:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, label, addressText, isValidCoords]);

  if (!isValidCoords) {
    return (
      <div style={{
        height: '180px',
        backgroundColor: 'var(--bg-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-tertiary)',
        fontSize: '13px',
      }}>
        <MapPin size={18} style={{ marginRight: '6px' }} />
        <span>GPS Coordinates not pinned</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '200px',
          borderRadius: 'var(--radius-md)',
          zIndex: 1,
        }}
      />
    </div>
  );
}
