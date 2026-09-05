import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import SEO from '../components/SEO';

export default function Unauthorized() {
  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <SEO title="Access Restricted (403)" noindex={true} />
      <div className="card" style={{ maxWidth: '480px', textAlign: 'center', padding: '40px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: 'rgba(250, 82, 82, 0.1)',
          color: 'var(--status-danger)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <ShieldAlert size={36} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Access Restricted (403)
        </h2>
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
          This section is exclusively reserved for <strong>Shree Tiffin Service</strong> kitchen owners and administrators. Your account does not have owner permissions.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-secondary" style={{ padding: '10px 20px' }}>
            <Home size={16} />
            <span>Go to Home</span>
          </Link>
          <Link to="/profile" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            <ArrowLeft size={16} />
            <span>Return to Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
