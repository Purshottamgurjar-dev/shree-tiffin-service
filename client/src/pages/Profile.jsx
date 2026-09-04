import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  LogOut,
  MapPin,
  ShoppingBag,
  Clock,
  ArrowRight,
  Plus,
  HeartHandshake,
  Sparkles,
  Flame,
  Home,
  Briefcase,
  Building,
  Bell,
  Utensils,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyOrders } from '../services/orderService';
import addressService from '../services/addressService';
import AddressForm from '../components/address/AddressForm';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import { formatCurrency, formatDate } from '../utils';

export default function Profile() {
  const { user, updateProfile, logout, isOwner } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Orders & Addresses data
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Address Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddressForEdit, setSelectedAddressForEdit] = useState(null);

  // Logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch recent orders & addresses
  const loadProfileData = async () => {
    setLoadingData(true);
    try {
      const [ordersRes, addrRes] = await Promise.allSettled([
        getMyOrders(),
        addressService.getAddresses(),
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.success) {
        setOrders(ordersRes.value.orders || []);
      }
      if (addrRes.status === 'fulfilled' && addrRes.value.success) {
        setAddresses(addrRes.value.data || []);
      }
    } catch (err) {
      // Non-critical
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  // Compute initials for avatar
  const getInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'ST';
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleStartEdit = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setErrorMsg('');
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Full Name cannot be empty.');
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSaving(true);
    const result = await updateProfile({ name: name.trim(), phone: cleanPhone });
    setIsSaving(false);

    if (result.success) {
      setSuccessMsg('Your profile has been updated successfully!');
      setIsEditing(false);
    } else {
      setErrorMsg(result.message || 'Failed to update profile.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Address label icon helper
  const getAddressIcon = (label) => {
    switch (label?.toLowerCase()) {
      case 'office':
        return <Briefcase size={16} color="var(--primary-700)" />;
      case 'hostel':
        return <Building size={16} color="var(--primary-700)" />;
      default:
        return <Home size={16} color="var(--primary-700)" />;
    }
  };

  const memberSinceFormatted = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'September 2026';

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 40px) 0 80px', minHeight: '85vh' }}>
      <div className="container" style={{ maxWidth: '1060px' }}>
        
        {/* ================================================================= */}
        {/* 1. VIBRANT PROFILE HERO BANNER */}
        {/* ================================================================= */}
        <div className="profile-hero-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Left: Avatar + Name + Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 3.5vw, 22px)' }}>
              {/* Circular Gradient Avatar */}
              <div className="profile-avatar-circle">
                {getInitials(user?.name)}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h1 style={{
                    fontSize: 'clamp(22px, 5vw, 30px)',
                    fontWeight: '800',
                    margin: 0,
                    color: '#ffffff',
                    letterSpacing: '-0.3px',
                  }}>
                    {user?.name || 'Customer Profile'}
                  </h1>

                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
                    <CheckCircle2 size={13} color="#4ade80" />
                    <span>Verified</span>
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  flexWrap: 'wrap',
                }}>
                  <span>📧 {user?.email}</span>
                  <span>•</span>
                  <span>📞 {user?.phone || 'Add phone'}</span>
                  <span>•</span>
                  <span>📅 Member since {memberSinceFormatted}</span>
                </div>

                {/* Role Pill */}
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: isOwner ? 'rgba(234, 88, 12, 0.9)' : 'rgba(22, 163, 74, 0.9)',
                    color: '#ffffff',
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {isOwner ? <Shield size={12} /> : <Award size={12} />}
                    <span>{isOwner ? 'Kitchen Owner / Admin' : 'Shree Gold Member'}</span>
                  </span>

                  <span style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    color: 'rgba(255, 255, 255, 0.95)',
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}>
                    🌿 Pure Veg Loyalty
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions (Edit & Logout) */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  style={{
                    backgroundColor: '#ffffff',
                    color: 'var(--primary-900)',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef3c7')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
              )}

              {isOwner && (
                <Link
                  to="/admin"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(8px)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    padding: '9px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: '700',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                  }}
                >
                  <Shield size={15} />
                  <span>Admin Panel</span>
                </Link>
              )}

              <button
                onClick={() => setShowLogoutConfirm(true)}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '600',
                  fontSize: '13px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                title="Sign out of your account"
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. CUSTOMER VIBRANT MILESTONES & STATS ROW */}
        {/* ================================================================= */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}>
          {/* Stat 1: Total Orders */}
          <div className="profile-stat-box">
            <div className="profile-stat-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)' }}>
              🍱
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Tiffins Ordered
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </div>
            </div>
          </div>

          {/* Stat 2: Diet Preference */}
          <div className="profile-stat-box">
            <div className="profile-stat-icon" style={{ backgroundColor: 'var(--veg-50)', color: 'var(--veg-700)' }}>
              🌿
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Meal Quality
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--veg-700)' }}>
                100% Pure Desi Ghee
              </div>
            </div>
          </div>

          {/* Stat 3: Saved Delivery Points */}
          <div className="profile-stat-box">
            <div className="profile-stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
              📍
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Delivery Points
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {addresses.length} {addresses.length === 1 ? 'Address' : 'Addresses'}
              </div>
            </div>
          </div>

          {/* Stat 4: Food Club Membership */}
          <div className="profile-stat-box">
            <div className="profile-stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
              ⭐
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Member Status
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#b45309' }}>
                Priority Kitchen Line
              </div>
            </div>
          </div>
        </div>

        {/* Alerts for save/errors */}
        {successMsg && (
          <div style={{
            backgroundColor: 'var(--veg-50)',
            border: '1px solid var(--veg-200)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--veg-800)',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '24px',
          }}>
            <CheckCircle2 size={18} color="var(--veg-700)" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(250, 82, 82, 0.1)',
            border: '1px solid rgba(250, 82, 82, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--status-danger)',
            fontSize: '14px',
            marginBottom: '24px',
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. MAIN CONTENT: 2-COLUMN ENGAGING GRID */}
        {/* ================================================================= */}
        <div className="profile-grid-layout">
          
          {/* LEFT COLUMN: Account Details & Saved Addresses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Account Details Card */}
            <div className="card" style={{ padding: 'clamp(18px, 4vw, 24px)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="var(--primary-700)" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    Personal Account Information
                  </h3>
                </div>

                {!isEditing && (
                  <button
                    onClick={handleStartEdit}
                    className="btn btn-outline"
                    style={{ fontSize: '12.5px', padding: '5px 12px', borderRadius: 'var(--radius-sm)' }}
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                /* Editable Form Mode */
                <form onSubmit={handleSave}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                        Full Name *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={17} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1.5px solid var(--primary-500)',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                        Mobile Phone Number *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={17} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1.5px solid var(--primary-500)',
                            fontSize: '14px',
                            outline: 'none',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                          Email Address
                        </label>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Lock size={11} /> Permanent Account ID
                        </span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <Mail size={17} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                          type="email"
                          disabled
                          value={user?.email || ''}
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                            cursor: 'not-allowed',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{ padding: '9px 20px', fontSize: '13.5px' }}
                      >
                        <Save size={15} />
                        <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="btn btn-secondary"
                        style={{ padding: '9px 16px', fontSize: '13.5px' }}
                      >
                        <X size={15} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* View Mode: Beautiful Information Grid */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: '600' }}>Full Name</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{user?.name}</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: '600' }}>Phone Number</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{user?.phone || 'Not set'}</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: '600' }}>Registered Email</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{user?.email}</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px 16px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: '600' }}>Account Access</div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary-900)', textTransform: 'capitalize' }}>
                      {user?.role === 'owner' ? 'Kitchen Admin' : 'Customer'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Saved Delivery Addresses Card */}
            <div className="card" style={{ padding: 'clamp(18px, 4vw, 24px)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '12px',
                flexWrap: 'wrap',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="var(--primary-700)" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    Saved Delivery Locations ({addresses.length})
                  </h3>
                </div>

                <button
                  onClick={() => {
                    setSelectedAddressForEdit(null);
                    setShowAddressModal(true);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '12.5px', padding: '6px 14px', borderRadius: 'var(--radius-sm)' }}
                >
                  <Plus size={14} />
                  <span>Add New Address</span>
                </button>
              </div>

              {addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <MapPin size={28} color="var(--text-tertiary)" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                    No delivery addresses saved yet. Add your home, hostel, or office for quick checkout!
                  </p>
                  <button
                    onClick={() => {
                      setSelectedAddressForEdit(null);
                      setShowAddressModal(true);
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '13px', padding: '7px 16px' }}
                  >
                    + Add Your First Address
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: addr.isDefault ? '1.5px solid var(--primary-400)' : '1px solid var(--border-subtle)',
                        backgroundColor: addr.isDefault ? 'var(--primary-50)' : 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <div style={{ marginTop: '2px' }}>
                          {getAddressIcon(addr.label)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                              {addr.label || 'Home'}
                            </strong>
                            {addr.isDefault && (
                              <span className="badge badge-primary" style={{ fontSize: '10px', padding: '1px 6px' }}>
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {addr.addressLine1}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            {addr.city ? `, ${addr.city}` : ''}
                            {addr.postalCode ? ` - ${addr.postalCode}` : ''}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            📞 {addr.phone || user?.phone}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedAddressForEdit(addr);
                          setShowAddressModal(true);
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px', borderRadius: 'var(--radius-xs)', flexShrink: 0 }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Recent Orders & Customer Hub Shortcuts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Recent Orders Preview Card */}
            <div className="card" style={{ padding: 'clamp(18px, 4vw, 24px)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} color="var(--primary-700)" />
                  <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    Recent Orders
                  </h3>
                </div>

                <Link
                  to="/orders"
                  style={{
                    fontSize: '12.5px',
                    fontWeight: '700',
                    color: 'var(--primary-800)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>View All ({orders.length})</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <Utensils size={28} color="var(--text-tertiary)" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                    You haven't ordered any homestyle tiffins yet.
                  </p>
                  <Link to="/menu" className="btn btn-primary" style={{ fontSize: '13px', padding: '7px 16px' }}>
                    Browse Today's Menu
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {orders.slice(0, 2).map((ord) => (
                    <div
                      key={ord._id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                          <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                            {ord.orderNumber}
                          </strong>
                          <OrderStatusBadge status={ord.orderStatus} size="small" />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {formatDate(ord.createdAt)} • {formatCurrency(ord.total)}
                        </div>
                      </div>

                      <Link
                        to={`/orders/${ord._id}`}
                        className="btn btn-outline"
                        style={{ fontSize: '12px', padding: '5px 10px', borderRadius: 'var(--radius-xs)' }}
                      >
                        Track
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Customer Hub Shortcuts */}
            <div className="card" style={{ padding: 'clamp(18px, 4vw, 24px)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '12px',
              }}>
                <Sparkles size={18} color="var(--primary-700)" />
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Customer Shortcuts
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/menu" className="profile-shortcut-link">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🍱</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '700' }}>Browse Daily Menu</span>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </Link>

                <Link to="/cart" className="profile-shortcut-link">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🛒</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '700' }}>View Shopping Cart</span>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </Link>

                <Link to="/orders" className="profile-shortcut-link">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>📦</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '700' }}>My Tiffin Orders</span>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </Link>

                <Link to="/notifications" className="profile-shortcut-link">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🔔</span>
                    <span style={{ fontSize: '13.5px', fontWeight: '700' }}>Delivery Notifications</span>
                  </div>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </Link>
              </div>
            </div>

            {/* Shree Tiffin Authenticity Pledge Card */}
            <div style={{
              background: 'linear-gradient(135deg, var(--veg-50) 0%, #dcfce7 100%)',
              border: '1px solid var(--veg-200)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--veg-900)', marginBottom: '8px' }}>
                <ShieldCheck size={20} color="var(--veg-700)" />
                <h4 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>
                  Shree Tiffin Pure Quality Pledge
                </h4>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--veg-800)', lineHeight: 1.5, margin: 0 }}>
                Cooked with 100% pure vegetarian ingredients, unadulterated cow desi ghee, and delivered hot in stainless steel hygienic tiffins.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Address Edit/Add Modal */}
      {showAddressModal && (
        <AddressForm
          isOpen={showAddressModal}
          initialData={selectedAddressForEdit}
          onClose={() => {
            setShowAddressModal(false);
            setSelectedAddressForEdit(null);
          }}
          onSuccess={() => {
            setShowAddressModal(false);
            setSelectedAddressForEdit(null);
            loadProfileData();
          }}
        />
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
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
          <div className="card modal-dialog-card" style={{ maxWidth: '400px', width: '100%', padding: 'clamp(20px, 4vw, 28px)', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--status-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <LogOut size={26} />
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Sign out of Shree Tiffin?
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              You can log back in anytime to place orders, track hot meals, and access saved delivery addresses.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn btn-secondary"
                style={{ padding: '9px 18px', fontSize: '13.5px' }}
              >
                Stay Logged In
              </button>
              <button
                onClick={handleLogout}
                className="btn"
                style={{
                  backgroundColor: 'var(--status-danger)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 20px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
