import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  return (
    <div className="container" style={{ padding: '48px 20px', maxWidth: '720px' }}>
      <div className="card">
        {/* Profile Card Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '24px',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-900) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-warm)',
            }}>
              <User size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {user?.name || 'Customer Profile'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className={user?.role === 'owner' ? 'badge badge-warning' : 'badge badge-primary'}>
                  <Shield size={12} />
                  <span>{user?.role === 'owner' ? 'Kitchen Owner / Admin' : 'Valued Customer'}</span>
                </span>
                <span className="badge badge-success">
                  Active
                </span>
              </div>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={handleStartEdit}
              className="btn btn-secondary"
              style={{ padding: '8px 18px', fontSize: '13.5px' }}
            >
              <Edit3 size={15} />
              <span>Edit Details</span>
            </button>
          )}
        </div>

        {/* Alerts */}
        {successMsg && (
          <div style={{
            backgroundColor: 'var(--veg-50)',
            border: '1px solid var(--veg-100)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--veg-700)',
            fontSize: '14px',
            marginBottom: '24px',
          }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(250, 82, 82, 0.1)',
            border: '1px solid rgba(250, 82, 82, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
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

        {/* Profile Content / Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Full Name Editable */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--text-tertiary)" style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--primary-500)',
                      fontSize: '14.5px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Mobile Phone Editable */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  Mobile Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="var(--text-tertiary)" style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--primary-500)',
                      fontSize: '14.5px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Email Address (Account Identifier)
                  </label>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Read-only
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-tertiary)" style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }} />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '14.5px',
                      cursor: 'not-allowed',
                    }}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Full Name</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {user?.name}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Email Address</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {user?.email}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Phone Number</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {user?.phone || 'Not provided'}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Account Role</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {user?.role}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
