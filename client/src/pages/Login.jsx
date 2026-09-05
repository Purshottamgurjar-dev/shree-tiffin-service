import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Utensils, Mail, Lock, LogIn, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password modal state (token-based secure flow)
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = request token, 2 = enter token & new password
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/profile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage('Welcome back! Logging you in...');
      setTimeout(() => {
        if (result.user.role === 'owner') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }, 600);
    } else {
      setLocalError(result.message || 'Invalid email or password.');
    }
  };

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }

    try {
      setIsResetting(true);
      const res = await api.post('/auth/forgot-password', {
        email: resetEmail.trim(),
      });

      if (res.data.success) {
        setResetSuccess(res.data.message || 'Password reset token generated.');
        if (res.data.resetToken) {
          setResetToken(res.data.resetToken);
        }
        setResetStep(2);
      } else {
        setResetError(res.data.message || 'Failed to request reset token.');
      }
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to request reset token. Please verify your email.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetToken.trim()) {
      setResetError('Please enter the reset token received.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('New passwords do not match. Please re-type.');
      return;
    }

    try {
      setIsResetting(true);
      const res = await api.post(`/auth/reset-password/${resetToken.trim()}`, {
        password: newPassword,
      });

      if (res.data.success) {
        setResetSuccess('Password updated successfully! Redirecting to login...');
        setEmail(resetEmail.trim());
        setPassword(newPassword);
        setTimeout(() => {
          setIsResetOpen(false);
          setResetStep(1);
          setSuccessMessage('Password reset successfully! Click Log In to continue.');
          setResetSuccess('');
          setResetToken('');
          setNewPassword('');
          setConfirmPassword('');
        }, 1200);
      } else {
        setResetError(res.data.message || 'Could not reset password.');
      }
    } catch (err) {
      setResetError(err.response?.data?.message || 'Invalid or expired reset token. Please request a new one.');
    } finally {
      setIsResetting(false);
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
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-900) 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-warm)',
          }}>
            <Utensils size={28} />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Customer Login
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Welcome back to Shree Tiffin Service!
          </p>
        </div>

        {/* Error Alert */}
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

        {/* Success Alert */}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '6px',
            }}>
              Email Address
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
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '14.5px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setIsResetOpen(true);
                  setResetError('');
                  setResetSuccess('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--primary-700)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Forgot Password?
              </button>
            </div>
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
                  backgroundColor: '#ffffff',
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
                  padding: '4px',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
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
            className="btn btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '15px' }}
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Register */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '13.5px',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '20px',
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: '700', color: 'var(--primary-800)' }}>
            Register Now
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isResetOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '30px', position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: 'rgba(232, 89, 12, 0.1)',
                color: 'var(--primary-700)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}>
                <KeyRound size={24} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Reset Your Password
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Enter your registered email and choose a new password.
              </p>
            </div>

            {resetError && (
              <div style={{
                backgroundColor: 'rgba(250, 82, 82, 0.1)',
                border: '1px solid rgba(250, 82, 82, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--status-danger)',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div style={{
                backgroundColor: 'var(--veg-50)',
                border: '1px solid var(--veg-100)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--veg-700)',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{resetSuccess}</span>
              </div>
            )}

            {resetStep === 1 ? (
              /* Step 1: Enter email to receive single-use cryptographic token */
              <form onSubmit={handleRequestToken}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px' }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                    A secure 15-minute single-use reset token will be generated.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => { setIsResetOpen(false); setResetStep(1); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      background: '#ffffff',
                      fontWeight: '600',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="btn btn-primary"
                    style={{
                      flex: 2,
                      padding: '10px',
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <KeyRound size={16} />
                    <span>{isResetting ? 'Generating...' : 'Get Reset Token'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Enter token & new password */
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px' }}>
                    Reset Token (from email / generated)
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter reset token"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      fontSize: '13.5px',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px' }}>
                    New Password (min 6 chars)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 38px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                      }}
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '5px' }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      background: '#ffffff',
                      fontWeight: '600',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="btn btn-primary"
                    style={{
                      flex: 2,
                      padding: '10px',
                      fontSize: '13.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <KeyRound size={16} />
                    <span>{isResetting ? 'Updating...' : 'Set Password'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
