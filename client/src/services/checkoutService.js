import api from './api';

const checkoutService = {
  /**
   * Validate checkout state, cart items, live meal prices, and address server-side
   */
  async validateCheckout(addressId) {
    const response = await api.post('/checkout/validate', { addressId });
    return response.data;
  },
};

export default checkoutService;
