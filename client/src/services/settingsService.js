import api from './api.js';

export const settingsService = {
  /**
   * Get public business operating settings (sanitized, contains isOpenNow, businessInfo, businessHours, etc.)
   */
  getPublicSettings: async () => {
    const res = await api.get('/settings');
    return res.data;
  },

  /**
   * Get full business settings for owner
   */
  getAdminSettings: async () => {
    const res = await api.get('/settings/admin');
    return res.data;
  },

  /**
   * Update business settings (Owner only)
   */
  updateAdminSettings: async (settingsData) => {
    const res = await api.put('/settings/admin', settingsData);
    return res.data;
  },
};

export default settingsService;
