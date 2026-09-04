import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import addressService from '../../services/addressService';
import AddressCard from './AddressCard';
import AddressForm from './AddressForm';

export default function AddressSelector({
  selectedAddress,
  onSelectAddress,
}) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const fetchAddresses = async (autoSelect = false) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await addressService.getAddresses();
      if (res.success && Array.isArray(res.data)) {
        setAddresses(res.data);

        // Auto-select default or first address if nothing currently selected
        if (autoSelect || !selectedAddress) {
          const def = res.data.find((a) => a.isDefault) || res.data[0] || null;
          if (def && onSelectAddress) {
            onSelectAddress(def);
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load saved delivery addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses(true);
  }, []);

  const handleCreateOrUpdateSuccess = (savedAddr) => {
    setSuccessNotice(editingAddress ? 'Address updated successfully!' : 'New address added successfully!');
    setTimeout(() => setSuccessNotice(''), 3000);
    fetchAddresses();
    if (onSelectAddress) {
      onSelectAddress(savedAddr);
    }
  };

  const handleSetDefault = async (addrId) => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await addressService.setDefaultAddress(addrId);
      if (res.success && res.data) {
        setSuccessNotice('Default delivery address updated!');
        setTimeout(() => setSuccessNotice(''), 3000);
        await fetchAddresses();
        if (onSelectAddress) {
          onSelectAddress(res.data);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to set default address.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (addrId) => {
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await addressService.deleteAddress(addrId);
      if (res.success) {
        setSuccessNotice('Address removed successfully.');
        setTimeout(() => setSuccessNotice(''), 3000);

        // If the deleted address was selected, select next available
        const remaining = addresses.filter((a) => a._id !== addrId);
        setAddresses(remaining);
        if (selectedAddress?._id === addrId) {
          const nextSelected = remaining.find((a) => a.isDefault) || remaining[0] || null;
          if (onSelectAddress) onSelectAddress(nextSelected);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete address.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Header with Title and Add Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-800)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MapPin size={18} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Delivery Address
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAddress(null);
            setIsFormOpen(true);
          }}
          className="btn btn-secondary"
          style={{
            padding: '7px 14px',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={15} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Notices */}
      {successNotice && (
        <div style={{
          backgroundColor: 'var(--veg-50)',
          border: '1px solid var(--veg-200)',
          color: 'var(--veg-800)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={16} />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(250, 82, 82, 0.1)',
          border: '1px solid var(--status-danger)',
          color: 'var(--status-danger)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Address Cards or Empty State */}
      {loading ? (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--primary-700)' }} />
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading saved delivery addresses...</div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="card" style={{
          padding: '36px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-subtle)',
          border: '2px dashed var(--border-subtle)',
        }}>
          <MapPin size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '6px' }}>
            No Saved Delivery Addresses
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', maxWidth: '420px', margin: '0 auto 16px auto' }}>
            Please add your delivery address and pin your location on the map to receive hot, wholesome tiffins.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingAddress(null);
              setIsFormOpen(true);
            }}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} />
            <span>Add Delivery Address</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px',
        }}>
          {addresses.map((addr) => (
            <AddressCard
              key={addr._id}
              address={addr}
              isSelected={selectedAddress?._id === addr._id}
              onSelect={onSelectAddress}
              onEdit={(a) => {
                setEditingAddress(a);
                setIsFormOpen(true);
              }}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              isProcessing={isProcessing}
            />
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      <AddressForm
        isOpen={isFormOpen}
        initialData={editingAddress}
        onClose={() => {
          setIsFormOpen(false);
          setEditingAddress(null);
        }}
        onSuccess={handleCreateOrUpdateSuccess}
      />
    </div>
  );
}
