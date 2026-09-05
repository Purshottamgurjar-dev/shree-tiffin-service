import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, LogIn, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter owner email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      // Enforce role check
      if (result.user.role !== 'owner') {
        logout();
        setLocalError('Access Denied: This portal is strictly restricted to Shree Tiffin Service owners and kitchen administrators.');
        return;
      }

      setSuccessMessage('Owner authenticated successfully. Loading dashboard...');
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 600);
    } else {
      setLocalError(result.message || 'Invalid owner credentials.');
    }
  };

  return (
    <div className="page-bottom-nav-pad" style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '36px',
        border: '1.5px solid var(--accent-gold-500)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1c1917 0%, #2b221e 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-gold-500)',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-md)',
          }}>
            <ShieldCheck size={30} />
          </div>
          <div className="badge badge-warning" style={{ marginBottom: '8px' }}>
            Restricted Admin Area
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Owner / Kitchen Login
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Authorized portal for kitchen management and live orders
          </p>
        </div>

        {/* Alerts */}
        {localError && (
          <div style={{
            backgroundColor: 'rgba(250, 82, 82, 0.1)',
            border: '1px solid rgba(250, 82, 82, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--status-danger)',
            fontSize: '13.5px',
            marginBottom: '20px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{localError}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            backgroundColor: 'var(--veg-50)',
            border: '1px solid var(--veg-100)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--veg-700)',
            fontSize: '13.5px',
            marginBottom: '20px',
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Owner Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-tertiary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '14.5px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-tertiary)" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '14.5px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn"
            style={{
              width: '100%',
              padding: '13px',
              fontSize: '15px',
              backgroundColor: '#1c1917',
              color: '#ffffff',
            }}
          >
            {isSubmitting ? (
              <span>Verifying Owner Credentials...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In to Owner Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div style={{
          marginTop: '20px',
          padding: '12px 14px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          textAlign: 'center',
        }}>
          🔒 <strong>Secure Access:</strong> This portal is restricted exclusively to authorized kitchen operators and store owners of Shree Tiffin Service.
        </div>

        {/* Back Link */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '18px',
        }}>
          <Link
            to="/"
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={14} />
            <span>Return to Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
