import heroThali from '../assets/hero-thali.jpg';

// Export Vite-bundled hero thali asset
export { heroThali };

// Safe meal image helper that resolves Vite-bundled asset and sanitizes legacy /src/assets paths
export const getMealImage = (image) => {
  if (!image || typeof image !== 'string' || image.includes('/src/assets/')) {
    return heroThali;
  }
  return image;
};

// Currency formatting in INR ₹
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Date formatter
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Time formatter
export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

