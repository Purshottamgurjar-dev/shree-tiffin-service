import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Home, Compass, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="container" style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center'
    }}>
      <SEO 
        title="Page Not Found (404)" 
        description="The page you are looking for does not exist or has been moved. Explore our authentic homestyle tiffin meals."
        noindex={true} 
      />

      <div className="card" style={{
        maxWidth: '540px',
        width: '100%',
        padding: '48px 32px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(234, 88, 12, 0.15)',
        boxShadow: 'var(--shadow-lg)',
        background: 'var(--bg-surface)'
      }}>
        {/* Decorative Culinary Icon Badge */}
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-50)',
          color: 'var(--primary-800)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px auto',
          border: '2px dashed var(--primary-300)'
        }}>
          <Utensils size={40} />
        </div>

        <span style={{
          display: 'inline-block',
          backgroundColor: 'var(--primary-100)',
          color: 'var(--primary-900)',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: '13px',
          fontWeight: '800',
          letterSpacing: '1px',
          marginBottom: '16px'
        }}>
          ERROR 404
        </span>

        <h1 style={{
          fontSize: '28px',
          fontWeight: '800',
          color: 'var(--text-primary)',
          marginBottom: '12px',
          lineHeight: '1.3'
        }}>
          Yeh Rasta Khana Nahi Pahunchata 🍲
        </h1>

        <p style={{
          fontSize: '15.5px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: '32px'
        }}>
          The page you requested could not be found. It may have been moved, or the link may be outdated. Let us take you back to our freshly prepared homestyle meals!
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '360px',
          margin: '0 auto'
        }}>
          <Link
            to="/menu"
            className="btn btn-primary"
            style={{
              padding: '14px 24px',
              fontSize: '15px',
              fontWeight: '700',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Compass size={18} />
            <span>Explore Today's Menu</span>
          </Link>

          <Link
            to="/"
            className="btn"
            style={{
              padding: '12px 24px',
              fontSize: '14.5px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Home size={16} />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
