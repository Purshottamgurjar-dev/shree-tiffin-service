import Cart from '../models/Cart.js';
import Meal from '../models/Meal.js';
import Address from '../models/Address.js';
import BusinessSettings from '../models/BusinessSettings.js';

/**
 * @desc    Validate checkout preparation server-side
 * @route   POST /api/checkout/validate
 * @access  Private (Customer)
 */
export const validateCheckout = async (req, res, next) => {
  try {
    const { addressId } = req.body;

    // 0. Enforce Business Operating Availability
    const settings = await BusinessSettings.getSettings();
    if (!settings.ordering?.isAcceptingOrders) {
      return res.status(400).json({
        success: false,
        message: settings.ordering?.pausedMessage || 'Online ordering is currently unavailable.',
      });
    }

    // 1. Fetch authenticated customer's cart
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty. Please add meals before proceeding to checkout.',
      });
    }

    // 2. Validate every meal against active MongoDB documents
    let subtotal = 0;
    let totalItems = 0;
    let priceChanged = false;
    const unavailableMeals = [];
    const validatedItems = [];

    for (const item of cart.items) {
      const mealId = item.meal ? (item.meal._id ? item.meal._id.toString() : item.meal.toString()) : null;
      let currentMeal = null;

      if (mealId) {
        try {
          currentMeal = await Meal.findById(mealId);
        } catch (err) {
          currentMeal = null;
        }
      }

      if (!currentMeal) {
        unavailableMeals.push(item.nameSnapshot || 'Unknown meal (removed from menu)');
        continue;
      }

      if (!currentMeal.isAvailable) {
        unavailableMeals.push(currentMeal.name);
        continue;
      }

      const activePrice = Number(currentMeal.price);
      if (item.priceSnapshot !== activePrice) {
        priceChanged = true;
      }

      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const itemTotal = activePrice * quantity;

      subtotal += itemTotal;
      totalItems += quantity;

      validatedItems.push({
        _id: item._id,
        meal: {
          _id: currentMeal._id,
          name: currentMeal.name,
          category: currentMeal.category,
          image: currentMeal.image,
          price: activePrice,
          isAvailable: true,
        },
        quantity,
        itemTotal,
      });
    }

    // 3. Reject checkout if any meal is unavailable
    if (unavailableMeals.length > 0) {
      return res.status(400).json({
        success: false,
        message: `One or more meals in your cart are currently unavailable (${unavailableMeals.join(', ')}). Please remove them before proceeding to checkout.`,
        unavailableMeals,
      });
    }

    // 4. Validate Delivery Address if provided
    let verifiedAddress = null;
    if (addressId) {
      try {
        verifiedAddress = await Address.findById(addressId);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Invalid address ID format',
        });
      }

      if (!verifiedAddress) {
        return res.status(404).json({
          success: false,
          message: 'Delivery address not found',
        });
      }

      // Strict ownership check
      if (verifiedAddress.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Selected delivery address does not belong to your account',
        });
      }

      // Coordinate validation
      const lat = Number(verifiedAddress.latitude);
      const lng = Number(verifiedAddress.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Selected delivery address does not have valid GPS coordinates on the map.',
        });
      }
    }

    // 5. Enforce Minimum Order Value
    const minimumOrderValue = Number(settings.delivery?.minimumOrderValue || 0);
    if (minimumOrderValue > 0 && subtotal < minimumOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${minimumOrderValue} is required to proceed to checkout. Your current subtotal is ₹${subtotal}.`,
      });
    }

    // Centralized Delivery Fee Calculation
    const deliveryFee = settings.calculateDeliveryFee
      ? settings.calculateDeliveryFee(subtotal)
      : Number(settings.delivery?.deliveryFee || 0);
    const total = subtotal + deliveryFee;

    // 6. Update cart in MongoDB with current verified totals
    cart.subtotal = subtotal;
    cart.totalItems = totalItems;
    await cart.save();

    // 7. Return verified checkout summary
    res.status(200).json({
      success: true,
      message: priceChanged
        ? 'Meal prices updated to active rates. Checkout details verified successfully.'
        : 'Checkout details verified successfully.',
      data: {
        customer: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
        },
        address: verifiedAddress,
        items: validatedItems,
        totalItems,
        subtotal,
        deliveryFee,
        total,
        priceChanged,
      },
    });
  } catch (error) {
    next(error);
  }
};
