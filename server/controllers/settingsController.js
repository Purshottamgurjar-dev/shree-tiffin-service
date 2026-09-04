import BusinessSettings from '../models/BusinessSettings.js';

/**
 * settingsController.js
 * Business Settings & Operating Controls for Shree Tiffin Service
 * "Ghar Jaisa Khana, Har Din."
 */

/**
 * @desc    Get public sanitized business operating settings
 * @route   GET /api/settings
 * @access  Public
 */
export const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await BusinessSettings.getSettings();

    // Determine if business is open right now based on day and hours
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const currentDayName = days[now.getDay()];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const todayHours = settings.businessHours.find((h) => h.day === currentDayName);
    let isOpenNow = false;
    if (settings.ordering?.isAcceptingOrders && todayHours?.isOpen) {
      if (currentTimeStr >= todayHours.openTime && currentTimeStr <= todayHours.closeTime) {
        isOpenNow = true;
      }
    }

    const publicSettings = {
      businessInfo: settings.businessInfo,
      delivery: {
        deliveryFee: settings.delivery?.deliveryFee ?? 0,
        minimumOrderValue: settings.delivery?.minimumOrderValue ?? 0,
        deliveryRadius: settings.delivery?.deliveryRadius ?? 15,
        instructions: settings.delivery?.instructions || '',
      },
      businessHours: settings.businessHours,
      ordering: {
        isAcceptingOrders: settings.ordering?.isAcceptingOrders ?? true,
        pausedMessage: settings.ordering?.pausedMessage || 'Online ordering is currently unavailable.',
        isOpenNow,
      },
      isOpenNow,
    };

    res.status(200).json({
      success: true,
      settings: publicSettings,
      data: publicSettings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete business configuration for owner
 * @route   GET /api/settings/admin
 * @access  Private (Owner only)
 */
export const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await BusinessSettings.getSettings();

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update business settings with server-side validation & whitelisting
 * @route   PUT /api/settings/admin
 * @access  Private (Owner only)
 */
export const updateAdminSettings = async (req, res, next) => {
  try {
    const { businessInfo, delivery, businessHours, ordering } = req.body;

    const settings = await BusinessSettings.getSettings();

    // 1. Validate & update businessInfo
    if (businessInfo && typeof businessInfo === 'object') {
      if (businessInfo.email && !/^\S+@\S+\.\S+$/.test(businessInfo.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid business email address format',
        });
      }
      if (businessInfo.phone && !/^\+?\d{10,15}$/.test(businessInfo.phone.replace(/[\s-]/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid business phone number (must be 10 to 15 digits)',
        });
      }

      if (businessInfo.name) settings.businessInfo.name = String(businessInfo.name).trim();
      if (businessInfo.tagline) settings.businessInfo.tagline = String(businessInfo.tagline).trim();
      if (businessInfo.email) settings.businessInfo.email = String(businessInfo.email).trim().toLowerCase();
      if (businessInfo.phone) settings.businessInfo.phone = String(businessInfo.phone).trim();
      if (businessInfo.address) settings.businessInfo.address = String(businessInfo.address).trim();
      if (businessInfo.city) settings.businessInfo.city = String(businessInfo.city).trim();
      if (businessInfo.state) settings.businessInfo.state = String(businessInfo.state).trim();
      if (businessInfo.postalCode) settings.businessInfo.postalCode = String(businessInfo.postalCode).trim();
    }

    // 2. Validate & update delivery
    if (delivery && typeof delivery === 'object') {
      if (delivery.deliveryFee !== undefined) {
        const fee = Number(delivery.deliveryFee);
        if (isNaN(fee) || fee < 0) {
          return res.status(400).json({
            success: false,
            message: 'Delivery fee cannot be negative or invalid',
          });
        }
        settings.delivery.deliveryFee = fee;
      }

      if (delivery.minimumOrderValue !== undefined) {
        const minVal = Number(delivery.minimumOrderValue);
        if (isNaN(minVal) || minVal < 0) {
          return res.status(400).json({
            success: false,
            message: 'Minimum order value cannot be negative or invalid',
          });
        }
        settings.delivery.minimumOrderValue = minVal;
      }

      if (delivery.deliveryRadius !== undefined) {
        const radius = Number(delivery.deliveryRadius);
        if (isNaN(radius) || radius < 0) {
          return res.status(400).json({
            success: false,
            message: 'Delivery radius cannot be negative',
          });
        }
        settings.delivery.deliveryRadius = radius;
      }

      if (delivery.instructions !== undefined) {
        settings.delivery.instructions = String(delivery.instructions).trim().slice(0, 500);
      }
    }

    // 3. Validate & update businessHours
    if (businessHours && Array.isArray(businessHours)) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      for (const h of businessHours) {
        if (h.openTime && !timeRegex.test(h.openTime)) {
          return res.status(400).json({
            success: false,
            message: `Invalid open time format "${h.openTime}". Expected HH:MM (24-hour)`,
          });
        }
        if (h.closeTime && !timeRegex.test(h.closeTime)) {
          return res.status(400).json({
            success: false,
            message: `Invalid close time format "${h.closeTime}". Expected HH:MM (24-hour)`,
          });
        }
      }
      settings.businessHours = businessHours;
    }

    // 4. Validate & update ordering controls
    if (ordering && typeof ordering === 'object') {
      if (ordering.isAcceptingOrders !== undefined) {
        settings.ordering.isAcceptingOrders = Boolean(ordering.isAcceptingOrders);
      }
      if (ordering.pausedMessage !== undefined) {
        settings.ordering.pausedMessage = String(ordering.pausedMessage).trim().slice(0, 250);
      }
      if (ordering.maintenanceMode !== undefined) {
        settings.ordering.maintenanceMode = Boolean(ordering.maintenanceMode);
      }
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Business settings updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};
