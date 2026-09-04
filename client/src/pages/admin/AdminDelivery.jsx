import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Bike, 
  Phone, 
  MapPin, 
  Navigation, 
  RefreshCw, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Filter,
  Eye,
  ArrowRight
} from 'lucide-react';
import { getDeliveryOrders, updateOrderStatus } from '../../services/orderService';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import PaymentBadge from '../../components/payment/PaymentBadge';
import useOrderPolling from '../../hooks/useOrderPolling';
import { formatCurrency, formatDate } from '../../utils';

export default function AdminDelivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [mapCenter, setMapCenter] = useState([22.7196, 75.8577]); // Default Indore coordinates

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const fetchDeliveries = async () => {
    try {
      const res = await getDeliveryOrders();
      if (res.success && Array.isArray(res.orders)) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch delivery orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Phase 12: Real-time periodic polling for active deliveries with cleanup
  useOrderPolling(fetchDeliveries, true, 10000);

  // Filter orders by selected sub-status
  const displayedOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.orderStatus === filterStatus;
  });

  // Marker colors and icons per status
  const getMarkerHtml = (status, orderNumber) => {
    let bg = '#3b82f6';
    let icon = '📋';
    if (status === 'Preparing') {
      bg = '#ea580c';
      icon = '🍳';
    } else if (status === 'Out for Delivery') {
      bg = '#059669';
      icon = '🛵';
    }

    return `
      <div style="
        background: ${bg};
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        cursor: pointer;
      ">
        <div style="transform: rotate(45deg); font-size: 16px;">${icon}</div>
      </div>
    `;
  };

  // Mount Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove previous map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: mapCenter,
        zoom: 13,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle map resize
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    } catch (err) {
      console.error('Error initializing delivery map:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever orders or filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const bounds = [];

    displayedOrders.forEach((order) => {
      const lat = Number(order.deliveryAddressSnapshot?.latitude);
      const lng = Number(order.deliveryAddressSnapshot?.longitude);

      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return;
      }

      bounds.push([lat, lng]);

      const customIcon = L.divIcon({
        className: 'delivery-pin-marker',
        html: getMarkerHtml(order.orderStatus, order.orderNumber),
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Clean phone number for WhatsApp/tel
      const cleanPhone = (order.customerSnapshot?.phone || '').replace(/\D/g, '');
      const encodedMsg = encodeURIComponent(
        `Hello ${order.customerSnapshot?.name || 'Customer'}, your Shree Tiffin Service order ${order.orderNumber} is currently ${order.orderStatus}.`
      );

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 220px; padding: 4px;">
          <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px; color: #1c1917;">
            ${order.orderNumber}
          </div>
          <div style="color: #44403c; margin-bottom: 2px;">
            <strong>Customer:</strong> ${order.customerSnapshot?.name || 'Customer'}
          </div>
          <div style="color: #44403c; margin-bottom: 2px;">
            <strong>Phone:</strong> ${order.customerSnapshot?.phone || 'N/A'}
          </div>
          <div style="color: #44403c; margin-bottom: 2px;">
            <strong>Amount:</strong> ₹${order.total} (${order.paymentStatus || 'Pending'})
          </div>
          <div style="color: #44403c; margin-bottom: 6px;">
            <strong>Status:</strong> ${order.orderStatus}
          </div>
          <div style="font-size: 11.5px; color: #78716c; margin-bottom: 8px;">
            ${order.deliveryAddressSnapshot?.addressLine1 || ''}, ${order.deliveryAddressSnapshot?.landmark || ''}
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
            <a href="/admin/orders/${order._id}" style="display: block; text-align: center; background: #c2410c; color: #ffffff; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 11.5px;">
              View Order Details
            </a>
            ${cleanPhone ? `
              <a href="tel:${cleanPhone}" style="display: block; text-align: center; background: #2563eb; color: #ffffff; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 11.5px;">
                📞 Call Customer
              </a>
              <a href="https://wa.me/91${cleanPhone}?text=${encodedMsg}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #16a34a; color: #ffffff; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 11.5px;">
                💬 Open WhatsApp
              </a>
            ` : ''}
            <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #0284c7; color: #ffffff; padding: 5px 10px; border-radius: 4px; text-decoration: none; font-weight: 700; font-size: 11.5px;">
              📍 Open Google Maps Directions
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => setSelectedOrder(order));

      markersRef.current[order._id] = marker;
    });

    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } catch (e) {
        // Fallback
      }
    }
  }, [displayedOrders]);

  // Advance Order Status Workflow
  const handleAdvanceStatus = async (order) => {
    let nextStatus = '';
    let note = '';
    if (order.orderStatus === 'Confirmed') {
      nextStatus = 'Preparing';
      note = 'Started preparing fresh meal in kitchen';
    } else if (order.orderStatus === 'Preparing') {
      nextStatus = 'Out for Delivery';
      note = 'Dispatched with delivery rider';
    } else if (order.orderStatus === 'Out for Delivery') {
      nextStatus = 'Delivered';
      note = 'Delivered to customer doorstep';
    }

    if (!nextStatus) return;

    setActionLoadingId(order._id);
    try {
      const res = await updateOrderStatus(order._id, nextStatus, note);
      if (res.success && res.order) {
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Zoom into specific order on map
  const handleFocusOrder = (order) => {
    setSelectedOrder(order);
    const lat = Number(order.deliveryAddressSnapshot?.latitude);
    const lng = Number(order.deliveryAddressSnapshot?.longitude);
    if (!isNaN(lat) && !isNaN(lng) && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
      const marker = markersRef.current[order._id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div style={{ padding: '36px 0 80px', minHeight: '85vh', backgroundColor: 'var(--bg-subtle)' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Live Delivery Management & Dispatch Map
              </h1>
              <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                Owner Operations
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Live dispatch monitoring for active deliveries: Confirmed, Preparing, and Out for Delivery orders.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchDeliveries}
              className="btn btn-outline"
              style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Map</span>
            </button>
            <Link
              to="/admin/orders"
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              All Orders
            </Link>
          </div>
        </div>

        {/* Filter Badges Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
            Filter Deliveries:
          </span>
          {[
            { key: 'ALL', label: `All Active (${orders.length})` },
            { key: 'Confirmed', label: `Confirmed (${orders.filter((o) => o.orderStatus === 'Confirmed').length})` },
            { key: 'Preparing', label: `Preparing (${orders.filter((o) => o.orderStatus === 'Preparing').length})` },
            { key: 'Out for Delivery', label: `Out for Delivery (${orders.filter((o) => o.orderStatus === 'Out for Delivery').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filterStatus === tab.key ? 'var(--primary-700)' : 'var(--border-color)',
                backgroundColor: filterStatus === tab.key ? 'var(--primary-700)' : '#ffffff',
                color: filterStatus === tab.key ? '#ffffff' : 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Layout: Split Grid (Interactive Leaflet Map + Deliveries List) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }} className="delivery-grid">
          {/* Left Column: Leaflet Map */}
          <div className="card" style={{ padding: '16px', borderRadius: 'var(--radius-lg)', position: 'sticky', top: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} color="var(--primary-700)" />
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Interactive Delivery Map (Leaflet)
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></span> Confirmed
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ea580c' }}></span> Preparing
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></span> On Route
                </span>
              </div>
            </div>

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: 'clamp(280px, 45vh, 540px)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                backgroundColor: '#e5e7eb',
              }}
            />

            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              💡 Click any map pin to view order info, trigger native phone calls, WhatsApp messages, or Google Maps directions.
            </div>
          </div>

          {/* Right Column: Active Delivery Cards */}
          <div>
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Active Deliveries ({displayedOrders.length})
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Auto-refreshes every 10s
              </span>
            </div>

            {displayedOrders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--veg-50)', color: 'var(--veg-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>No Active Deliveries</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  All confirmed orders have been successfully delivered! Great job, kitchen team.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {displayedOrders.map((order) => {
                  const addr = order.deliveryAddressSnapshot || {};
                  const cust = order.customerSnapshot || {};
                  const cleanPhone = (cust.phone || '').replace(/\D/g, '');
                  const isSelected = selectedOrder?._id === order._id;

                  // Pre-filled WhatsApp message templates (Phase 6)
                  let waText = `Hello ${cust.name || 'Customer'}, regarding your Shree Tiffin Service order ${order.orderNumber}.`;
                  if (order.orderStatus === 'Confirmed') {
                    waText = `Hello ${cust.name || 'Customer'}, your Shree Tiffin Service order ${order.orderNumber} has been confirmed. Thank you!`;
                  } else if (order.orderStatus === 'Preparing') {
                    waText = `Hello ${cust.name || 'Customer'}, your Shree Tiffin Service order ${order.orderNumber} is being prepared hot in our kitchen.`;
                  } else if (order.orderStatus === 'Out for Delivery') {
                    waText = `Hello ${cust.name || 'Customer'}, your Shree Tiffin Service order ${order.orderNumber} is out for delivery.`;
                  }
                  const encodedWa = encodeURIComponent(waText);

                  return (
                    <div
                      key={order._id}
                      className="card"
                      style={{
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? '#fffbf7' : '#ffffff',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                              {order.orderNumber}
                            </span>
                            <OrderStatusBadge status={order.orderStatus} />
                          </div>
                          <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {cust.name || 'Customer'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-800)' }}>
                            {formatCurrency(order.total)}
                          </div>
                          <PaymentBadge method={order.paymentMethod || 'COD'} status={order.paymentStatus || 'Pending'} size="small" />
                        </div>
                      </div>

                      {/* Delivery Address & Instructions */}
                      <div style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12.5px',
                        marginBottom: '12px',
                        lineHeight: 1.5,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: 'var(--text-secondary)' }}>
                          <MapPin size={14} style={{ marginTop: '3px', flexShrink: 0 }} />
                          <div>
                            <strong>{addr.addressLine1 || 'Delivery Address'}</strong>
                            {addr.landmark && <span> • Landmark: {addr.landmark}</span>}
                            <div>{addr.city || 'Indore'}, {addr.state || 'Madhya Pradesh'} {addr.postalCode ? `- ${addr.postalCode}` : ''}</div>
                            {addr.latitude && addr.longitude && (
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                GPS: {Number(addr.latitude).toFixed(4)}, {Number(addr.longitude).toFixed(4)}
                              </div>
                            )}
                          </div>
                        </div>

                        {order.deliveryInstructions && (
                          <div style={{ marginTop: '6px', paddingLeft: '20px', color: 'var(--primary-800)', fontWeight: '600', fontSize: '12px' }}>
                            📝 Note: "{order.deliveryInstructions}"
                          </div>
                        )}
                      </div>

                      {/* Items Summary */}
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                        🍲 {order.items?.map((i) => `${i.quantity}x ${i.nameSnapshot}`).join(', ') || 'Tiffin items'}
                      </div>

                      {/* Operational Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Focus on map */}
                        <button
                          onClick={() => handleFocusOrder(order)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <MapPin size={13} />
                          <span>Pin on Map</span>
                        </button>

                        {/* Phase 5: Native Mobile Call */}
                        {cleanPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#1d4ed8' }}
                          >
                            <Phone size={13} />
                            <span>Call ({cleanPhone})</span>
                          </a>
                        )}

                        {/* Phase 6: WhatsApp Customer */}
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodedWa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#15803d' }}
                          >
                            <MessageSquare size={13} />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {/* Google Maps Directions */}
                        {addr.latitude && addr.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${addr.latitude},${addr.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: '#0369a1' }}
                          >
                            <Navigation size={13} />
                            <span>Directions</span>
                          </a>
                        )}

                        {/* Quick Next Status Advancement */}
                        {order.orderStatus === 'Confirmed' && (
                          <button
                            onClick={() => handleAdvanceStatus(order)}
                            disabled={actionLoadingId === order._id}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px', marginLeft: 'auto', backgroundColor: '#ea580c' }}
                          >
                            <ChefHat size={13} />
                            <span>Start Cooking</span>
                          </button>
                        )}
                        {order.orderStatus === 'Preparing' && (
                          <button
                            onClick={() => handleAdvanceStatus(order)}
                            disabled={actionLoadingId === order._id}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px', marginLeft: 'auto', backgroundColor: '#0284c7' }}
                          >
                            <Bike size={13} />
                            <span>Send with Rider</span>
                          </button>
                        )}
                        {order.orderStatus === 'Out for Delivery' && (
                          <button
                            onClick={() => handleAdvanceStatus(order)}
                            disabled={actionLoadingId === order._id}
                            className="btn btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12px', marginLeft: 'auto', backgroundColor: 'var(--veg-700)' }}
                          >
                            <CheckCircle2 size={13} />
                            <span>Mark Delivered</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
