import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import cartService from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isOwner } = useAuth();

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'adding', 'updating-id', 'removing-id', 'clearing'
  const [error, setError] = useState(null);

  /**
   * Sync state from backend cart DTO
   */
  const updateLocalCartState = (cartData) => {
    if (cartData) {
      setCart(cartData);
      setItems(cartData.items || []);
      setTotalItems(cartData.totalItems || 0);
      setSubtotal(cartData.subtotal || 0);
      setTotal(cartData.total || 0);
    } else {
      setCart(null);
      setItems([]);
      setTotalItems(0);
      setSubtotal(0);
      setTotal(0);
    }
  };

  /**
   * Load cart from MongoDB for authenticated customer
   */
  const loadCart = useCallback(async () => {
    // Only fetch if authenticated customer
    if (!isAuthenticated) {
      updateLocalCartState(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await cartService.getCart();
      if (res.success && res.data) {
        updateLocalCartState(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve shopping cart.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Synchronize cart on authentication change
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      updateLocalCartState(null);
    }
  }, [isAuthenticated, loadCart]);

  /**
   * Add item to cart
   */
  const addToCart = async (mealId, quantity = 1) => {
    if (!isAuthenticated) {
      return {
        success: false,
        requireAuth: true,
        message: 'Please login to add items to your cart.',
      };
    }

    setActionLoading('adding');
    setError(null);
    try {
      const res = await cartService.addToCart(mealId, quantity);
      if (res.success && res.data) {
        updateLocalCartState(res.data);
        return { success: true, message: res.message || 'Added to cart successfully!' };
      }
      return { success: false, message: res.message || 'Failed to add item.' };
    } catch (err) {
      const msg = err.message || 'Failed to add meal to cart.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Update item quantity
   */
  const updateQuantity = async (mealId, newQuantity) => {
    if (newQuantity < 1) return;

    setActionLoading(`updating-${mealId}`);
    setError(null);
    try {
      const res = await cartService.updateCartItem(mealId, newQuantity);
      if (res.success && res.data) {
        updateLocalCartState(res.data);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.message || 'Failed to update quantity.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = async (mealId) => {
    setActionLoading(`removing-${mealId}`);
    setError(null);
    try {
      const res = await cartService.removeCartItem(mealId);
      if (res.success && res.data) {
        updateLocalCartState(res.data);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.message || 'Failed to remove item.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Clear entire cart
   */
  const clearCart = async () => {
    setActionLoading('clearing');
    setError(null);
    try {
      const res = await cartService.clearCart();
      if (res.success && res.data) {
        updateLocalCartState(res.data);
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      const msg = err.message || 'Failed to clear cart.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setActionLoading(null);
    }
  };

  const value = {
    cart,
    items,
    totalItems,
    subtotal,
    total,
    loading,
    actionLoading,
    error,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
