import axios from 'axios';

// Base API instance (supports both VITE_API_BASE_URL and VITE_API_URL)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sts_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unified error handling & token expiration cleanup
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    let message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    // Improve cryptic Axios "Network Error" when backend is unreachable or connection dropped
    if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
      message = 'Unable to connect to the server. Please check your internet connection or verify the server is running.';
    }

    // Clear stale auth token on 401 Unauthorized if previously set
    if (status === 401 && localStorage.getItem('sts_token')) {
      // Only clear if not on the login request itself
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/login') && !requestUrl.includes('/register')) {
        localStorage.removeItem('sts_token');
        window.dispatchEvent(new Event('sts_auth_expired'));
      }
    }

    const customError = {
      status: status || 500,
      message,
      data: error.response?.data || null,
    };
    return Promise.reject(customError);
  }
);

export default api;
