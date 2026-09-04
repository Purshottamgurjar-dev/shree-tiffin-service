import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { isAuthenticated, isOwner, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px'
      }}>
        <RefreshCw size={36} className="animate-spin" color="var(--primary-700)" />
        <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
          Verifying owner administrator privileges...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isOwner) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <React.Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '16px',
          }}
        >
          <RefreshCw size={36} className="animate-spin" color="var(--primary-700)" />
          <p style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
            Loading kitchen controls...
          </p>
        </div>
      }
    >
      {children ? children : <Outlet />}
    </React.Suspense>
  );
}
