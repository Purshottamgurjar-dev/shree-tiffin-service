import notificationService from '../services/notificationService.js';

/**
 * notificationController.js
 * Protected Notification API Handlers for Shree Tiffin Service
 * "Ghar Jaisa Khana, Har Din."
 */

/**
 * @desc    Get current authenticated user's notifications (paginated)
 * @route   GET /api/notifications
 * @access  Private
 */
export const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit, isRead } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, {
      page,
      limit,
      isRead,
    });

    res.status(200).json({
      success: true,
      ...result,
      count: result.total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count for authenticated user
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getMyUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);

    res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user._id);

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification: result.notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user's notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};
