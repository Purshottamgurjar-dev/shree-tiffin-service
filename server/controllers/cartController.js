import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Meal from '../models/Meal.js';

/**
 * Helper to validate integer quantity >= 1
 */
const validateQuantity = (qty) => {
  const num = Number(qty);
  if (!Number.isInteger(num) || num < 1) {
    return false;
  }
  return num;
};

/**
 * Find or safely create a cart document for an authenticated user
 */
const findOrCreateUserCart = async (userId) => {
  const uIdStr = userId.toString();
  let cart = await Cart.findOne({ user: uIdStr });

  if (!cart) {
    try {
      cart = await Cart.create({
        user: uIdStr,
        items: [],
        subtotal: 0,
        totalItems: 0,
      });
    } catch (err) {
      // Handle potential race condition where another request created the cart
      cart = await Cart.findOne({ user: uIdStr });
      if (!cart) throw err;
    }
  }

  return cart;
};

/**
 * Server-side calculation engine:
 * Re-reads active meals from MongoDB, revalidates availability and prices,
 * calculates item totals and cart subtotal.
 */
const calculateAndFormatCart = async (cart) => {
  let subtotal = 0;
  let totalItems = 0;
  const formattedItems = [];
  const updatedItemsArray = [];

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

    const isAvailable = currentMeal ? Boolean(currentMeal.isAvailable) : false;
    // Always use current DB price; fallback to snapshot only if meal was deleted
    const currentPrice = currentMeal ? Number(currentMeal.price) : Number(item.priceSnapshot || 0);
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const itemTotal = currentPrice * quantity;

    subtotal += itemTotal;
    totalItems += quantity;

    // Preserved in cart model
    updatedItemsArray.push({
      _id: item._id,
      meal: mealId,
      nameSnapshot: currentMeal ? currentMeal.name : item.nameSnapshot,
      priceSnapshot: currentPrice,
      imageSnapshot: currentMeal ? currentMeal.image : item.imageSnapshot,
      quantity,
    });

    // Public DTO formatted response
    formattedItems.push({
      _id: item._id,
      meal: {
        _id: mealId,
        name: currentMeal ? currentMeal.name : (item.nameSnapshot || 'Homestyle Meal'),
        slug: currentMeal ? currentMeal.slug : '',
        category: currentMeal ? currentMeal.category : 'Daily Tiffin',
        image: currentMeal ? currentMeal.image : (item.imageSnapshot || '/src/assets/hero-thali.jpg'),
        price: currentPrice,
        isAvailable,
      },
      quantity,
      itemTotal,
    });
  }

  // Update cart state and persist
  cart.items = updatedItemsArray;
  cart.subtotal = subtotal;
  cart.totalItems = totalItems;
  await cart.save();

  return {
    _id: cart._id,
    items: formattedItems,
    totalItems,
    subtotal,
    total: subtotal, // Step 4: total = subtotal (no taxes/shipping until checkout phase)
  };
};

/**
 * @desc    Get authenticated customer's cart
 * @route   GET /api/cart
 * @access  Private (Customer/User)
 */
export const getCart = async (req, res, next) => {
  try {
    const cart = await findOrCreateUserCart(req.user._id);
    const data = await calculateAndFormatCart(cart);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add meal to customer cart
 * @route   POST /api/cart/items
 * @access  Private (Customer/User)
 */
export const addToCart = async (req, res, next) => {
  try {
    const { mealId, quantity = 1 } = req.body;

    // 1. Validate meal ID
    if (!mealId || typeof mealId !== 'string' || !mealId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Valid meal ID is required',
      });
    }

    // 2. Validate quantity (Integer and >= 1)
    const validQty = validateQuantity(quantity);
    if (!validQty) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer of at least 1',
      });
    }

    // 3. Find meal in MongoDB
    let meal;
    try {
      meal = await Meal.findById(mealId.trim());
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal ID format',
      });
    }

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found in menu database',
      });
    }

    // 4. Validate availability in MongoDB
    if (!meal.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This meal is currently unavailable.',
      });
    }

    // 5. Retrieve or create cart for user
    const cart = await findOrCreateUserCart(req.user._id);

    // 6. Check if meal already exists in cart
    const existingIndex = cart.items.findIndex((item) => {
      const existingId = item.meal ? (item.meal._id ? item.meal._id.toString() : item.meal.toString()) : null;
      return existingId === meal._id.toString();
    });

    if (existingIndex > -1) {
      // Increase quantity
      cart.items[existingIndex].quantity += validQty;
      cart.items[existingIndex].priceSnapshot = meal.price; // Update to live DB price
    } else {
      // Add new item with live DB price
      cart.items.push({
        _id: new mongoose.Types.ObjectId().toString(),
        meal: meal._id.toString(),
        nameSnapshot: meal.name,
        priceSnapshot: meal.price,
        imageSnapshot: meal.image,
        quantity: validQty,
      });
    }

    // 7. Recalculate totals server-side and save
    const data = await calculateAndFormatCart(cart);

    res.status(200).json({
      success: true,
      message: `"${meal.name}" added to cart`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update quantity of an item in cart
 * @route   PUT /api/cart/items/:mealId
 * @access  Private (Customer/User)
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { mealId } = req.params;
    const { quantity } = req.body;

    // 1. Validate quantity
    const validQty = validateQuantity(quantity);
    if (!validQty) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive integer of at least 1',
      });
    }

    // 2. Validate meal in MongoDB
    let meal;
    try {
      meal = await Meal.findById(mealId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meal ID',
      });
    }

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found',
      });
    }

    if (!meal.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This meal is currently unavailable.',
      });
    }

    // 3. Find cart
    const cart = await findOrCreateUserCart(req.user._id);

    const itemIndex = cart.items.findIndex((item) => {
      const existingId = item.meal ? (item.meal._id ? item.meal._id.toString() : item.meal.toString()) : null;
      return existingId === mealId;
    });

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart',
      });
    }

    // 4. Update quantity and snapshot price
    cart.items[itemIndex].quantity = validQty;
    cart.items[itemIndex].priceSnapshot = meal.price;

    // 5. Recalculate and save
    const data = await calculateAndFormatCart(cart);

    res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove an item from customer's cart
 * @route   DELETE /api/cart/items/:mealId
 * @access  Private (Customer/User)
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const { mealId } = req.params;
    const cart = await findOrCreateUserCart(req.user._id);

    const initialLength = cart.items.length;
    cart.items = cart.items.filter((item) => {
      const existingId = item.meal ? (item.meal._id ? item.meal._id.toString() : item.meal.toString()) : null;
      return existingId !== mealId;
    });

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in your cart',
      });
    }

    const data = await calculateAndFormatCart(cart);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all items from customer's cart
 * @route   DELETE /api/cart
 * @access  Private (Customer/User)
 */
export const clearCart = async (req, res, next) => {
  try {
    const cart = await findOrCreateUserCart(req.user._id);
    cart.items = [];
    cart.subtotal = 0;
    cart.totalItems = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        _id: cart._id,
        items: [],
        totalItems: 0,
        subtotal: 0,
        total: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
