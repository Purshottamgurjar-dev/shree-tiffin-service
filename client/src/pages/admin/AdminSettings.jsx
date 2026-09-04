import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Store,
  Clock,
  Truck,
  Power,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
} from 'lucide-react';
import settingsService from '../../services/settingsService';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Form states
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [delivery, setDelivery] = useState({
    deliveryFee: 0,
    minimumOrderValue: 0,
    deliveryRadius: 15,
    instructions: '',
  });

  const [businessHours, setBusinessHours] = useState(
    DAYS_OF_WEEK.map((day) => ({
      day,
      isOpen: true,
      openTime: '07:00',
      closeTime: '22:00',
    }))
  );

  const [ordering, setOrdering] = useState({
    isAcceptingOrders: true,
    pausedMessage: 'Online ordering is currently unavailable.',
    maintenanceMode: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsService.getAdminSettings();
      if (res.success && res.settings) {
        const s = res.settings;
        if (s.businessInfo) setBusinessInfo(s.businessInfo);
        if (s.delivery) {
          setDelivery({
            deliveryFee: s.delivery.deliveryFee ?? 0,
            minimumOrderValue: s.delivery.minimumOrderValue ?? 0,
            deliveryRadius: s.delivery.deliveryRadius ?? 15,
            instructions: s.delivery.instructions || '',
          });
        }
        if (Array.isArray(s.businessHours) && s.businessHours.length > 0) {
          // Merge to ensure all 7 days present
          const merged = DAYS_OF_WEEK.map((day) => {
            const found = s.businessHours.find((h) => h.day === day);
            return (
              found || {
                day,
                isOpen: true,
                openTime: '07:00',
                closeTime: '22:00',
              }
            );
          });
          setBusinessHours(merged);
        }
        if (s.ordering) {
          setOrdering({
            isAcceptingOrders: s.ordering.isAcceptingOrders ?? true,
            pausedMessage: s.ordering.pausedMessage || 'Online ordering is currently unavailable.',
            maintenanceMode: s.ordering.maintenanceMode ?? false,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setStatusMessage({ type: 'error', text: 'Failed to load business settings from server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (dayIndex, field, value) => {
    setBusinessHours((prev) => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], [field]: value };
      return updated;
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setStatusMessage({ type: '', text: '' });

      const payload = {
        businessInfo,
        delivery: {
          ...delivery,
          deliveryFee: Number(delivery.deliveryFee),
          minimumOrderValue: Number(delivery.minimumOrderValue),
          deliveryRadius: Number(delivery.deliveryRadius),
        },
        businessHours,
        ordering,
      };

      const res = await settingsService.updateAdminSettings(payload);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Business settings updated and active across customer ordering!',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save business settings. Please verify all inputs.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--bg-cream)', minHeight: 'calc(100vh - 76px)', padding: '60px 0', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin" style={{ color: 'var(--primary-800)', marginBottom: '16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading business settings...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-cream)', minHeight: 'calc(100vh - 76px)', padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '940px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-800)',
                }}
              >
                <Sliders size={22} />
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Business Settings & Operating Controls
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', margin: '4px 0 0' }}>
              Configure store availability, centralized delivery fees, minimum orders, and operating hours
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: 'var(--primary-800)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-warm)',
            }}
          >
            {saving ? <RefreshCw size={17} className="spin" /> : <Save size={17} />}
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage.text && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: statusMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${statusMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Ordering Availability Toggle */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: ordering.isAcceptingOrders ? '1px solid var(--border-light)' : '2px solid #f59e0b',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Power size={20} color={ordering.isAcceptingOrders ? '#16a34a' : '#d97706'} />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Store Ordering Status
              </h2>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: ordering.isAcceptingOrders ? '#f0fdf4' : '#fffbeb',
                borderRadius: '10px',
                marginBottom: '16px',
              }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                  Accepting Online Customer Orders
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {ordering.isAcceptingOrders
                    ? 'Customers can build carts and place orders online freely.'
                    : 'Customer checkout is paused. Cart submissions will be blocked.'}
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={ordering.isAcceptingOrders}
                  onChange={(e) => setOrdering({ ...ordering, isAcceptingOrders: e.target.checked })}
                  style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: 'var(--primary-800)' }}
                />
                <span style={{ fontWeight: '700', fontSize: '14px', color: ordering.isAcceptingOrders ? '#15803d' : '#b45309' }}>
                  {ordering.isAcceptingOrders ? 'ACTIVE / OPEN' : 'PAUSED'}
                </span>
              </label>
            </div>

            {!ordering.isAcceptingOrders && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Customer Paused Notice Message:
                </label>
                <input
                  type="text"
                  value={ordering.pausedMessage}
                  onChange={(e) => setOrdering({ ...ordering, pausedMessage: e.target.value })}
                  placeholder="e.g. Kitchen is closed for afternoon prep. Evening ordering re-opens at 6:00 PM."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}
          </div>

          {/* Section 2: Delivery & Minimum Order Controls */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Truck size={20} color="var(--primary-800)" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Delivery Pricing & Minimum Order Value
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Centralized Delivery Fee (₹):
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={delivery.deliveryFee}
                    onChange={(e) => setDelivery({ ...delivery, deliveryFee: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                  Set to 0 for Free Delivery across all orders.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Minimum Order Value (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={delivery.minimumOrderValue}
                  onChange={(e) => setDelivery({ ...delivery, minimumOrderValue: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                  Checkout is blocked if customer subtotal is below this amount.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Delivery Radius (km):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={delivery.deliveryRadius}
                  onChange={(e) => setDelivery({ ...delivery, deliveryRadius: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Delivery Note / Instructions for Customers:
              </label>
              <textarea
                rows="2"
                value={delivery.instructions}
                onChange={(e) => setDelivery({ ...delivery, instructions: e.target.value })}
                placeholder="e.g. Hot homestyle meals delivered fresh in insulated carriers within 45 minutes."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Section 3: Business Operating Hours (7 Days) */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Clock size={20} color="var(--primary-800)" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Weekly Operating Hours
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {businessHours.map((h, idx) => (
                <div
                  key={h.day}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: h.isOpen ? 'var(--bg-subtle)' : '#f9fafb',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ width: '130px', fontWeight: '700', fontSize: '14.5px', color: 'var(--text-primary)' }}>
                    {h.day}
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={h.isOpen}
                      onChange={(e) => handleHourChange(idx, 'isOpen', e.target.checked)}
                      style={{ accentColor: 'var(--primary-800)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13.5px', fontWeight: '600', color: h.isOpen ? '#15803d' : '#6b7280' }}>
                      {h.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </label>

                  {h.isOpen ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>From</span>
                      <input
                        type="time"
                        value={h.openTime}
                        onChange={(e) => handleHourChange(idx, 'openTime', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      />
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>to</span>
                      <input
                        type="time"
                        value={h.closeTime}
                        onChange={(e) => handleHourChange(idx, 'closeTime', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          fontSize: '13px',
                          fontWeight: '600',
                        }}
                      />
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                      Closed for orders all day
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Business Profile Information */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              border: '1px solid var(--border-light)',
              padding: '24px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <Building size={20} color="var(--primary-800)" />
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Business Profile Information
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Business Name:
                </label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Tagline:
                </label>
                <input
                  type="text"
                  value={businessInfo.tagline}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, tagline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Official Phone:
                </label>
                <input
                  type="text"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Customer Support Email:
                </label>
                <input
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Kitchen Street Address:
                </label>
                <input
                  type="text"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  City:
                </label>
                <input
                  type="text"
                  value={businessInfo.city}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  State:
                </label>
                <input
                  type="text"
                  value={businessInfo.state}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Postal Code:
                </label>
                <input
                  type="text"
                  value={businessInfo.postalCode}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, postalCode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                backgroundColor: 'var(--primary-800)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-warm)',
              }}
            >
              {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
              <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
