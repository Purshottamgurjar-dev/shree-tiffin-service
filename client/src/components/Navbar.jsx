import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

const ADMIN_TABS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { path: '/admin/delivery', label: 'Delivery Map', icon: Bike },
  { path: '/admin/payments', label: 'Payments & COD', icon: CreditCard },
  { path: '/admin/customers', label: 'Customers', icon: Users },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/admin/meals', label: 'Menu Items', icon: Utensils },
  { path: '/admin/settings', label: 'Settings', icon: Sliders },
];

export default function Navbar({ serverStatus = 'online' }) {
  const { user, isAuthenticated, isOwner, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [storeStatus, setStoreStatus] = useState({ isAcceptingOrders: true });
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

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
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
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
        maxWidth: '1240px',
      }}>
        {/* Brand Logo & Name */}
        <Link 
          to={isAdminRoute && isOwner ? "/admin/dashboard" : "/"} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            textDecoration: 'none', 
            flexShrink: 0 
          }}
        >
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
          <div style={{ flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title-text" style={{ whiteSpace: 'nowrap' }}>
                SHREE TIFFIN SERVICE
              </span>
              {isAdminRoute && (
                <span className="badge badge-warning" style={{ 
                  fontSize: '10px', 
                  padding: '1px 6px',
                  fontWeight: '700',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  Kitchen Console
                </span>
              )}
            </div>
            <div className="brand-tagline-text" style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}>
              <span>Ghar Jaisa Khana, Har Din.</span>
              <span style={{
                fontSize: '10px',
                padding: '1px 7px',
                borderRadius: '12px',
                backgroundColor: storeStatus.isAcceptingOrders ? '#ecfdf5' : '#fff1f2',
                color: storeStatus.isAcceptingOrders ? '#047857' : '#be123c',
                border: storeStatus.isAcceptingOrders ? '1px solid #a7f3d0' : '1px solid #fecdd3',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: storeStatus.isAcceptingOrders ? '#10b981' : '#f43f5e',
                }}></span>
                {storeStatus.isAcceptingOrders ? 'Delivering Hot' : 'Pre-orders'}
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '14px' }} className="desktop-nav">
          {isAdminRoute ? (
            /* Admin Mode Actions */
            <>
              <Link
                to="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: '#ffffff',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
                title="View customer storefront"
              >
                <ShoppingBag size={14} />
                <span>View Storefront</span>
              </Link>

              <Link
                to="/admin/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: storeStatus.isAcceptingOrders ? '#ecfdf5' : '#fff1f2',
                  border: storeStatus.isAcceptingOrders ? '1px solid #a7f3d0' : '1px solid #fecdd3',
                  color: storeStatus.isAcceptingOrders ? '#047857' : '#be123c',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  textDecoration: 'none',
                }}
                title="Store operational status toggle"
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: storeStatus.isAcceptingOrders ? '#10b981' : '#f43f5e',
                }} />
                <span>{storeStatus.isAcceptingOrders ? 'Accepting Orders' : 'Store Paused'}</span>
              </Link>
            </>
          ) : (
            /* Customer Mode Links */
            <>
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

              {/* If Owner on Customer page: Clean Console Switcher */}
              {isAuthenticated && isOwner && (
                <Link 
                  to="/admin/dashboard" 
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#fff7ed',
                    color: '#c2410c',
                    border: '1px solid #fed7aa',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    boxShadow: '0 1px 2px rgba(234, 88, 12, 0.08)',
                  }}
                  title="Switch to Kitchen & Owner Console"
                >
                  <ShieldCheck size={16} color="#c2410c" />
                  <span>Admin Console</span>
                </Link>
              )}
            </>
          )}

          {/* Common Right Controls: Notifications, Profile, Logout */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Notification Bell */}
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

              {/* Profile Chip */}
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-primary)',
                  fontWeight: '600',
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                <User size={15} color="var(--primary-800)" />
                <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
                {isOwner && (
                  <span className="badge badge-warning" style={{ fontSize: '10px', padding: '1px 6px' }}>
                    Owner
                  </span>
                )}
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>

              {/* API Status Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: serverStatus === 'online' ? 'var(--veg-50)' : 'rgba(250, 82, 82, 0.1)',
                fontSize: '11px',
                fontWeight: '600',
                color: serverStatus === 'online' ? 'var(--veg-700)' : 'var(--status-danger)',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: serverStatus === 'online' ? 'var(--status-success)' : 'var(--status-danger)',
                }} />
                <span>{serverStatus === 'online' ? 'Online' : 'Offline'}</span>
              </div>
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

      {/* Dedicated Persistent Admin Subnav Tabs on all /admin/* routes */}
      {isAdminRoute && isAuthenticated && isOwner && (
        <nav className="admin-subnav-bar" aria-label="Kitchen Operations Navigation">
          <div className="container admin-subnav-container">
            {ADMIN_TABS.map((tab) => {
              const isActive = location.pathname === tab.path || 
                (tab.path !== '/admin/dashboard' && location.pathname.startsWith(tab.path));
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`admin-subnav-tab ${isActive ? 'active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        }}>
          {isAdminRoute && isAuthenticated && isOwner ? (
            <>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-800)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                Kitchen Operations
              </div>
              {ADMIN_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = location.pathname === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? '#fff7ed' : 'transparent',
                      color: isActive ? 'var(--primary-900)' : 'var(--text-primary)',
                      fontWeight: isActive ? '700' : '600',
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    <Icon size={18} color={isActive ? 'var(--primary-700)' : 'var(--text-tertiary)'} />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '6px 0' }} />
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '14px' }}
              >
                <ShoppingBag size={18} />
                <span>View Customer Storefront</span>
              </Link>
            </>
          ) : (
            <>
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

              {isAuthenticated && isOwner && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '700',
                    padding: '8px 0',
                    color: '#c2410c',
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>Admin & Kitchen Console</span>
                </Link>
              )}

              {isAuthenticated && !isOwner && (
                <Link
                  to="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontWeight: '700', padding: '8px 0', color: 'var(--primary-800)' }}
                >
                  My Tiffin Orders
                </Link>
              )}
            </>
          )}

          {isAuthenticated ? (
            <>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={16} />
                <span>Logout</span>
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
