import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Utensils, ShoppingBag, ClipboardList, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function MobileBottomNav() {
  const { user, isAuthenticated, isOwner } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();

  // Don't show on admin dashboard pages if preferred, or show owner navigation
  const isOwnerRoute = location.pathname.startsWith('/admin');

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
          padding: '6px 12px',
          minWidth: '56px',
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
          padding: '6px 12px',
          minWidth: '56px',
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
          padding: '6px 12px',
          minWidth: '56px',
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

      {/* 4. Orders (Customer orders or Owner orders) */}
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
          padding: '6px 12px',
          minWidth: '56px',
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
          padding: '6px 12px',
          minWidth: '56px',
        })}
      >
        {isOwner ? <ShieldCheck size={20} /> : <User size={20} />}
        <span>{isOwner ? 'Owner' : isAuthenticated ? 'Profile' : 'Login'}</span>
      </NavLink>
    </nav>
  );
}
