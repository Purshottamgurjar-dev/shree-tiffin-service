import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Utensils, 
  User, 
  LogOut, 
  LayoutDashboard, 
  Menu as MenuIcon, 
  X, 
  ShieldCheck,
  ChefHat,
  ShoppingBag,
  ClipboardList,
  CreditCard,
  Bike,
  Users,
  BarChart3,
  Bell,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import notificationService from '../services/notificationService';
import settingsService from '../services/settingsService';

export default function Navbar({ serverStatus = 'online' }) {
  const { user, isAuthenticated, isOwner, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [storeStatus, setStoreStatus] = useState({ isAcceptingOrders: true });
  const navigate = useNavigate();

  React.useEffect(() => {
    let isMounted = true;
    const loadStatusAndNotifications = async () => {
      if (isAuthenticated) {
        try {
          const res = await notificationService.getUnreadCount();
          if (res.success && isMounted) {
            setUnreadCount(res.unreadCount || 0);
          }
        } catch (err) {
          // ignore
        }
      }
      try {
        const sRes = await settingsService.getPublicSettings();
        if (sRes.success && sRes.settings && isMounted) {
          setStoreStatus({
            isAcceptingOrders: sRes.settings.ordering?.isAcceptingOrders ?? true,
          });
        }
      } catch (err) {
        // ignore
      }
    };

    loadStatusAndNotifications();
    const interval = setInterval(loadStatusAndNotifications, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header style={{
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '76px',
      }}>
        {/* Brand Logo & Name */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2.5vw, 14px)', textDecoration: 'none', minWidth: 0 }}>
          <div className="brand-logo-box" style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-900) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: 'var(--shadow-warm)',
            flexShrink: 0,
          }}>
            <Utensils size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="brand-title-text">
              SHREE TIFFIN SERVICE
            </div>
            <div className="brand-tagline-text" style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: '500',
            }}>
              Ghar Jaisa Khana, Har Din.
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="desktop-nav">
          <Link to="/" style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14.5px' }}>
            Home
          </Link>

          <Link to="/menu" style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '14.5px' }}>
            Our Menu
          </Link>

          {/* Cart Link with Badge */}
          <Link
            to="/cart"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              backgroundColor: totalItems > 0 ? 'var(--primary-50)' : 'transparent',
              border: totalItems > 0 ? '1px solid var(--primary-200)' : '1px solid transparent',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--primary-900)',
              fontWeight: '700',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
            title="Shopping Cart"
          >
            <ShoppingBag size={17} color="var(--primary-800)" />
            <span>Cart</span>
            {totalItems > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--primary-800)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  minWidth: '19px',
                  height: '19px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>

          {/* If Owner: show Owner Dashboard, Orders & Manage Menu */}
          {isAuthenticated && isOwner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Link 
                to="/admin/dashboard" 
                style={{ 
                  color: 'var(--primary-800)', 
                  fontWeight: '700', 
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LayoutDashboard size={17} />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/admin/orders" 
                style={{ 
                  color: 'var(--primary-800)', 
                  fontWeight: '700', 
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ClipboardList size={16} />
                <span>Orders</span>
              </Link>
              <Link 
                to="/admin/delivery" 
                style={{ 
                  color: '#0284c7', 
                  fontWeight: '700', 
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Bike size={16} />
                <span>Delivery</span>
              </Link>
              <Link 
                to="/admin/payments" 
                style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: '600', 
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CreditCard size={16} />
                <span>Payments</span>
              </Link>
              <Link 
                to="/admin/customers" 
                style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: '600', 
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Users size={16} />
                <span>Customers</span>
              </Link>
              <Link 
                to="/admin/analytics" 
                style={{ 
                  color: '#ea580c', 
                  fontWeight: '700', 
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <BarChart3 size={16} />
                <span>Analytics</span>
              </Link>
              <Link 
                to="/admin/meals" 
                style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: '600', 
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Utensils size={16} />
                <span>Menu</span>
              </Link>
              <Link 
                to="/admin/settings" 
                style={{ 
                  color: 'var(--primary-900)', 
                  fontWeight: '700', 
                  fontSize: '14.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Business & Delivery Settings"
              >
                <Sliders size={16} />
                <span>Settings</span>
              </Link>
            </div>
          )}

          {/* If Authenticated Customer: show My Orders */}
          {isAuthenticated && !isOwner && (
            <Link
              to="/orders"
              style={{
                color: 'var(--text-primary)',
                fontWeight: '600',
                fontSize: '14.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
              }}
            >
              <ClipboardList size={16} color="var(--primary-800)" />
              <span>My Orders</span>
            </Link>
          )}

          {/* Authenticated State */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Notification Bell with live unread badge */}
              <Link
                to="/notifications"
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: unreadCount > 0 ? 'var(--primary-50)' : 'var(--bg-subtle)',
                  border: unreadCount > 0 ? '1px solid var(--primary-200)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                title="Notifications"
              >
                <Bell size={18} color="var(--primary-800)" />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 3px',
                      border: '2px solid #ffffff',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                <User size={16} color="var(--primary-800)" />
                <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                {isOwner && (
                  <span className="badge badge-warning" style={{ fontSize: '10px', padding: '1px 6px' }}>
                    Owner
                  </span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{
                  padding: '7px 16px',
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            /* Logged Out State */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to="/login"
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: '14px' }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '14px' }}
              >
                Register
              </Link>
              <Link
                to="/admin/login"
                style={{
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '6px',
                }}
                title="Kitchen Owner Login"
              >
                <ShieldCheck size={14} />
                <span>Owner</span>
              </Link>
            </div>
          )}

          {/* Store Paused Indicator if online ordering is paused */}
          {!storeStatus.isAcceptingOrders && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#fef3c7',
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#b45309',
                border: '1px solid #fde68a',
              }}
              title="Store ordering is currently paused by kitchen manager"
            >
              <span>⏸️ Orders Paused</span>
            </div>
          )}

          {/* Backend Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: serverStatus === 'online' ? 'var(--veg-50)' : 'rgba(250, 82, 82, 0.1)',
            fontSize: '11.5px',
            fontWeight: '600',
            color: serverStatus === 'online' ? 'var(--veg-700)' : 'var(--status-danger)',
            marginLeft: '8px',
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: serverStatus === 'online' ? 'var(--status-success)' : 'var(--status-danger)',
            }} />
            <span>{serverStatus === 'online' ? 'API Online' : 'API Offline'}</span>
          </div>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'none',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-subtle)',
            minWidth: '44px',
            minHeight: '44px',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
          }}
          className="mobile-nav-toggle"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontWeight: '600', padding: '8px 0', color: 'var(--text-primary)' }}
          >
            Home
          </Link>

          <Link
            to="/menu"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontWeight: '600', padding: '8px 0', color: 'var(--text-primary)' }}
          >
            Our Menu
          </Link>

          <Link
            to="/cart"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              fontWeight: '700',
              padding: '8px 0',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} />
              <span>Shopping Cart</span>
            </span>
            {totalItems > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--primary-800)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '800',
                  borderRadius: '10px',
                  padding: '2px 8px',
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              {isOwner && (
                <>
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: '700', padding: '8px 0', color: 'var(--primary-800)' }}
                  >
                    Owner Dashboard
                  </Link>
                  <Link
                    to="/admin/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: '700', padding: '8px 0', color: 'var(--primary-800)' }}
                  >
                    Manage Orders
                  </Link>
                  <Link
                    to="/admin/delivery"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: '700', padding: '8px 0', color: '#0284c7' }}
                  >
                    Live Delivery Map
                  </Link>
                  <Link
                    to="/admin/payments"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: '700', padding: '8px 0', color: 'var(--primary-800)' }}
                  >
                    Payments & COD
                  </Link>
                  <Link
                    to="/admin/customers"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: '700', padding: '8px 0', color: 'var(--primary-800)' }}
                  >
                    Customer Directory
                  </Link>
                  <Link
                    to="/admin/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: '700', padding: '8px 0', color: '#ea580c' }}
                  >
                    Analytics & Reports
                  </Link>
                  <Link
                    to="/admin/meals"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: '700', padding: '8px 0', color: 'var(--primary-800)' }}
                  >
                    Manage Menu Items
                  </Link>
                  <Link
                    to="/admin/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ fontWeight: '700', padding: '8px 0', color: 'var(--primary-900)' }}
                  >
                    ⚙️ Business Settings
                  </Link>
                </>
              )}
              {!isOwner && (
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontWeight: '700', padding: '8px 0', color: 'var(--primary-800)' }}
                >
                  My Tiffin Orders
                </Link>
              )}
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontWeight: '600',
                  padding: '8px 0',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>🔔 Notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '800',
                      borderRadius: '10px',
                      padding: '2px 8px',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontWeight: '600', padding: '8px 0', color: 'var(--text-primary)' }}
              >
                Profile ({user?.name})
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'var(--status-danger)',
                  padding: '8px 0',
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontWeight: '600', padding: '8px 0', color: 'var(--primary-800)' }}
              >
                Customer Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontWeight: '600', padding: '8px 0', color: 'var(--text-primary)' }}
              >
                Register
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{ fontWeight: '600', padding: '8px 0', color: 'var(--text-secondary)' }}
              >
                Owner / Kitchen Login
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
