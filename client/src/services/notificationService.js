import api from './api.js';

export const notificationService = {
  /**
   * Get paginated notifications for current user with optional filters
   */
  getNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  /**
   * Get unread notification count for badge
   */
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data;
  },

  /**
   * Mark single notification as read
   */
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

export default notificationService;
