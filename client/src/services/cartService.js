import api from './api';

const cartService = {
  /**
   * Fetch current authenticated customer's cart
   */
  async getCart() {
    const response = await api.get('/cart');
    return response.data;
  },

  /**
   * Add a meal to customer's cart
   */
  async addToCart(mealId, quantity = 1) {
    const response = await api.post('/cart/items', { mealId, quantity });
    return response.data;
  },

  /**
   * Update quantity of an existing item in cart
   */
  async updateCartItem(mealId, quantity) {
    const response = await api.put(`/cart/items/${mealId}`, { quantity });
    return response.data;
  },

  /**
   * Remove a single item from customer's cart
   */
  async removeCartItem(mealId) {
    const response = await api.delete(`/cart/items/${mealId}`);
    return response.data;
  },

  /**
   * Clear all items from customer's cart
   */
  async clearCart() {
    const response = await api.delete('/cart');
    return response.data;
  },
};

export default cartService;
