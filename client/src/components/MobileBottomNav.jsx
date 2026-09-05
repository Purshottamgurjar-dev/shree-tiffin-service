import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Utensils, 
  ShoppingBag, 
  ClipboardList, 
  User, 
  ShieldCheck, 
  LayoutDashboard, 
  Bike, 
  BarChart3, 
  Sliders 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function MobileBottomNav() {
  const { user, isAuthenticated, isOwner } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();

  // Distinct mode for Admin / Kitchen routes
  const isOwnerRoute = location.pathname.startsWith('/admin') && isOwner;

  if (isOwnerRoute) {
    return (
      <nav
        className="mobile-bottom-nav"
        aria-label="Admin Mobile Navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'none', // Controlled by media query in index.css
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* 1. Dashboard */}
        <NavLink
          to="/admin/dashboard"
          end
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: isActive ? 'var(--primary-800)' : 'var(--text-tertiary)',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: isActive ? '700' : '500',
            padding: '6px 2px',
            flex: 1,
            minWidth: 0,
            minHeight: '44px',
          })}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {/* 2. Orders */}
        <NavLink
          to="/admin/orders"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: isActive ? 'var(--primary-800)' : 'var(--text-tertiary)',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: isActive ? '700' : '500',
            padding: '6px 2px',
            flex: 1,
            minWidth: 0,
            minHeight: '44px',
          })}
        >
          <ClipboardList size={20} />
          <span>Orders</span>
        </NavLink>

        {/* 3. Delivery */}
        <NavLink
          to="/admin/delivery"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: isActive ? '#0284c7' : 'var(--text-tertiary)',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: isActive ? '700' : '500',
            padding: '6px 2px',
            flex: 1,
            minWidth: 0,
            minHeight: '44px',
          })}
        >
          <Bike size={20} />
          <span>Delivery</span>
        </NavLink>

        {/* 4. Analytics */}
        <NavLink
          to="/admin/analytics"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: isActive ? '#ea580c' : 'var(--text-tertiary)',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: isActive ? '700' : '500',
            padding: '6px 2px',
            flex: 1,
            minWidth: 0,
            minHeight: '44px',
          })}
        >
          <BarChart3 size={20} />
          <span>Analytics</span>
        </NavLink>

        {/* 5. Settings */}
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            color: isActive ? 'var(--primary-800)' : 'var(--text-tertiary)',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: isActive ? '700' : '500',
            padding: '6px 2px',
            flex: 1,
            minWidth: 0,
            minHeight: '44px',
          })}
        >
          <Sliders size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
    );
  }

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'none', // Controlled by media query in index.css
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 999,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* 1. Home */}
      <NavLink
        to="/"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--primary-800)' : 'var(--text-tertiary)',
          textDecoration: 'none',
          fontSize: '11px',
          fontWeight: isActive ? '700' : '500',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px',
        })}
      >
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      {/* 2. Menu */}
      <NavLink
        to="/menu"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--primary-800)' : 'var(--text-tertiary)',
          textDecoration: 'none',
          fontSize: '11px',
          fontWeight: isActive ? '700' : '500',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px',
        })}
      >
        <Utensils size={20} />
        <span>Menu</span>
      </NavLink>

      {/* 3. Cart with live badge */}
      <NavLink
        to="/cart"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--primary-800)' : 'var(--text-tertiary)',
          textDecoration: 'none',
          fontSize: '11px',
          fontWeight: isActive ? '700' : '500',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px',
          position: 'relative',
        })}
      >
        <div style={{ position: 'relative' }}>
          <ShoppingBag size={20} />
          {totalItems > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-10px',
                backgroundColor: 'var(--primary-800)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: '800',
                borderRadius: '10px',
                padding: '1px 5px',
                minWidth: '16px',
                textAlign: 'center',
                lineHeight: '14px',
                boxShadow: '0 2px 4px rgba(217, 72, 15, 0.4)',
              }}
            >
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </div>
        <span>Cart</span>
      </NavLink>

      {/* 4. Orders */}
      <NavLink
        to={isOwner ? '/admin/orders' : '/orders'}
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--primary-800)' : 'var(--text-tertiary)',
          textDecoration: 'none',
          fontSize: '11px',
          fontWeight: isActive ? '700' : '500',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px',
        })}
      >
        <ClipboardList size={20} />
        <span>{isOwner ? 'Manage' : 'Orders'}</span>
      </NavLink>

      {/* 5. Account / Owner */}
      <NavLink
        to={isOwner ? '/admin/dashboard' : isAuthenticated ? '/profile' : '/login'}
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          color: isActive ? 'var(--primary-800)' : 'var(--text-tertiary)',
          textDecoration: 'none',
          fontSize: '11px',
          fontWeight: isActive ? '700' : '500',
          padding: '6px 2px',
          flex: 1,
          minWidth: 0,
          minHeight: '44px',
        })}
      >
        {isOwner ? <ShieldCheck size={20} /> : <User size={20} />}
        <span>{isOwner ? 'Admin' : isAuthenticated ? 'Profile' : 'Login'}</span>
      </NavLink>
    </nav>
  );
}
