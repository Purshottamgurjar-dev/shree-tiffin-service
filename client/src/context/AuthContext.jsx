import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sts_token') || null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore authenticated session from token on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('sts_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
          setToken(storedToken);
        } else {
          localStorage.removeItem('sts_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session restoration failed:', err.message);
        localStorage.removeItem('sts_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Listen for global auth expiration event
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('sts_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('sts_auth_expired', handleAuthExpired);
  }, []);

  // Customer / Owner Login
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('sts_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true, user: receivedUser };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Customer Registration
  const register = async (userData) => {
    setAuthError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('sts_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);

      return { success: true, user: receivedUser };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('sts_token');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  // Update Profile
  const updateProfile = async (profileData) => {
    setAuthError(null);
    try {
      const response = await api.put('/auth/profile', profileData);
      if (response.data.success && response.data.user) {
        setUser((prev) => ({
          ...prev,
          ...response.data.user,
        }));
        return { success: true, user: response.data.user };
      }
      return { success: false, message: 'Failed to update profile' };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, message: err.message };
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isOwner: user?.role === 'owner',
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom Hook to consume AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
