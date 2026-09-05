
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  MapPin,
  AlertCircle,
  RefreshCw,
  Home,
  Briefcase,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import addressService from '../../services/addressService';
import LocationMap from './LocationMap';

const ADDRESS_LABELS = ['Home', 'Office', 'Hostel', 'Other'];

export default function AddressForm({
  initialData = null,
  isOpen = false,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    label: 'Home',
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    latitude: null,
    longitude: null,
    deliveryInstructions: '',
    isDefault: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill form on mount or when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        label: initialData.label || 'Home',
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        addressLine1: initialData.addressLine1 || '',
        addressLine2: initialData.addressLine2 || '',
        landmark: initialData.landmark || '',
        city: initialData.city || '',
        state: initialData.state || '',
        postalCode: initialData.postalCode || '',
        country: initialData.country || 'India',
        latitude: initialData.latitude !== undefined ? initialData.latitude : null,
        longitude: initialData.longitude !== undefined ? initialData.longitude : null,
        deliveryInstructions: initialData.deliveryInstructions || '',
        isDefault: Boolean(initialData.isDefault),
      });
    } else {
      // Default to authenticated user data
      setFormData({
        label: 'Home',
        fullName: user?.name || '',
        phone: user?.phone || '',
        addressLine1: '',
        addressLine2: '',
        landmark: '',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '',
        country: 'India',
        latitude: 22.7196, // default Indore center coordinate
        longitude: 75.8577,
        deliveryInstructions: '',
        isDefault: false,
      });
    }
    setErrorMsg('');
  }, [initialData, user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLocationChange = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Frontend validation
    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter recipient full name');
      return;
    }
    if (!formData.phone.trim() || !/^[0-9+ -]{10,15}$/.test(formData.phone.trim())) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.addressLine1.trim()) {
      setErrorMsg('Please enter flat/house number and building name');
      return;
    }
    if (!formData.city.trim()) {
      setErrorMsg('Please enter delivery city');
      return;
    }
    if (!formData.state.trim()) {
      setErrorMsg('Please enter delivery state');
      return;
    }
    if (!formData.postalCode.trim() || !/^[1-9][0-9]{5}$|^[0-9A-Za-z -]{4,10}$/.test(formData.postalCode.trim())) {
      setErrorMsg('Please enter a valid 6-digit PIN Code');
      return;
    }
    if (formData.latitude === null || formData.longitude === null) {
      setErrorMsg('Please pin your delivery location on the map or use your current location');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (initialData?._id) {
        result = await addressService.updateAddress(initialData._id, formData);
      } else {
        result = await addressService.createAddress(formData);
      }

      if (result.success && result.data) {
        onSuccess(result.data);
        onClose();
      } else {
        setErrorMsg(result.message || 'Failed to save address');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Server error saving delivery address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    }}>
      <div className="card modal-dialog-card" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 'clamp(16px, 4vw, 28px)',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px',
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {initialData ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Fresh, hygienic tiffins delivered hot to your doorstep
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              borderRadius: 'var(--radius-sm)',
            }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(250, 82, 82, 0.1)',
            border: '1px solid var(--status-danger)',
            color: 'var(--status-danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '18px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Address Label Selector */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
              Address Label *
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {ADDRESS_LABELS.map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, label: lbl }))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: formData.label === lbl ? '2px solid var(--primary-800)' : '1px solid var(--border-subtle)',
                    backgroundColor: formData.label === lbl ? 'var(--primary-50)' : '#ffffff',
                    color: formData.label === lbl ? 'var(--primary-900)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {lbl === 'Home' && <Home size={14} />}
                  {lbl === 'Office' && <Briefcase size={14} />}
                  {lbl === 'Hostel' && <Building size={14} />}
                  {lbl === 'Other' && <MapPin size={14} />}
                  <span>{lbl}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Full Name & Phone */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '14px',
            marginBottom: '14px',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Purshottam Gurjar"
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Mobile Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Address Line 1 */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
              House / Flat / Block No. & Building Name *
            </label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              placeholder="e.g. Flat 402, Shanti Heights"
              className="input-field"
              required
            />
          </div>

          {/* Address Line 2 & Landmark */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '14px',
            marginBottom: '14px',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Street / Area / Colony
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="e.g. Scheme No 54, Vijay Nagar"
                className="input-field"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                Nearby Landmark
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="e.g. Near Bombay Hospital"
                className="input-field"
              />
            </div>
          </div>

          {/* City, State & PIN Code */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
            gap: '14px',
            marginBottom: '18px',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Indore"
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Madhya Pradesh"
                className="input-field"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                PIN Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="e.g. 452010"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Interactive Leaflet Location Map Picker */}
          <LocationMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
          />

          {/* Delivery Instructions */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
              Delivery Instructions for Tiffin Rider (Optional)
            </label>
            <textarea
              name="deliveryInstructions"
              value={formData.deliveryInstructions}
              onChange={handleChange}
              placeholder="e.g. Leave at security gate, call when arriving, ring the bell"
              className="input-field"
              rows={2}
              maxLength={300}
            />
          </div>

          {/* Default Address Checkbox */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600' }}>
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-800)' }}
              />
              <span>Set as my default delivery address</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>{initialData ? 'Update Address' : 'Save Address'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
