import React, { useState } from 'react';
import { 
  Home, 
  Briefcase, 
  Building, 
  MapPin, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Phone, 
  User, 
  Star 
} from 'lucide-react';

export default function AddressCard({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  isProcessing = false,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Label Icon mapping
  const renderLabelIcon = (label) => {
    switch (label) {
      case 'Home':
        return <Home size={13} />;
      case 'Office':
        return <Briefcase size={13} />;
      case 'Hostel':
        return <Building size={13} />;
      default:
        return <MapPin size={13} />;
    }
  };

  return (
    <div
      onClick={() => onSelect && onSelect(address)}
      className="card"
      style={{
        padding: '20px',
        cursor: onSelect ? 'pointer' : 'default',
        border: isSelected ? '2px solid var(--primary-800)' : '1px solid var(--border-subtle)',
        backgroundColor: isSelected ? 'var(--primary-50)' : '#ffffff',
        position: 'relative',
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      {/* Header: Label, Default Badge, and Selection Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-primary" style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {renderLabelIcon(address.label)}
            <span>{address.label}</span>
          </span>

          {address.isDefault && (
            <span style={{
              backgroundColor: 'var(--accent-gold-100)',
              border: '1px solid var(--accent-gold-300)',
              color: 'var(--accent-gold-800)',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <Star size={11} fill="var(--accent-gold-800)" />
              <span>Default Address</span>
            </span>
          )}
        </div>

        {/* Selected Radio Pill */}
        {onSelect && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: '700',
            color: isSelected ? 'var(--primary-900)' : 'var(--text-tertiary)',
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: `2px solid ${isSelected ? 'var(--primary-800)' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
            }}>
              {isSelected && (
                <div style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-800)',
                }} />
              )}
            </div>
            <span>{isSelected ? 'Deliver Here' : 'Select'}</span>
          </div>
        )}
      </div>

      {/* Recipient Contact Details */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} color="var(--primary-800)" />
          <span>{address.fullName}</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <Phone size={13} color="var(--text-tertiary)" />
          <span>{address.phone}</span>
        </div>
      </div>

      {/* Postal Address Lines */}
      <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
        <div>{address.addressLine1}</div>
        {address.addressLine2 && <div>{address.addressLine2}</div>}
        {address.landmark && (
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12.5px' }}>
            Landmark: {address.landmark}
          </div>
        )}
        <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
          {address.city}, {address.state} — {address.postalCode}
        </div>
      </div>

      {/* Delivery Instructions if any */}
      {address.deliveryInstructions && (
        <div style={{
          fontSize: '12px',
          backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--bg-subtle)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          marginBottom: '12px',
          fontStyle: 'italic',
        }}>
          💬 "{address.deliveryInstructions}"
        </div>
      )}

      {/* Coordinates Badge */}
      {address.latitude && address.longitude && (
        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={11} />
          <span>GPS: {Number(address.latitude).toFixed(4)}° N, {Number(address.longitude).toFixed(4)}° E</span>
        </div>
      )}

      {/* Action Buttons: Set as Default, Edit, Delete */}
      <div
        onClick={(e) => e.stopPropagation()} // Prevent card selection click
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          {!address.isDefault && onSetDefault && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onSetDefault(address._id)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11.5px' }}
            >
              Set as Default
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {onEdit && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onEdit(address)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit3 size={12} />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            !showDeleteConfirm ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11.5px', color: 'var(--status-danger)' }}
                title="Delete address"
              >
                <Trash2 size={12} />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    onDelete(address._id);
                    setShowDeleteConfirm(false);
                  }}
                  className="btn"
                  style={{
                    backgroundColor: 'var(--status-danger)',
                    color: '#ffffff',
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  ✕
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
