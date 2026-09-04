import api from './api';

const addressService = {
  /**
   * Fetch all saved addresses for authenticated customer
   */
  async getAddresses() {
    const response = await api.get('/addresses');
    return response.data;
  },

  /**
   * Fetch single address by ID
   */
  async getAddress(id) {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  /**
   * Create new delivery address
   */
  async createAddress(addressData) {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  /**
   * Update existing address
   */
  async updateAddress(id, addressData) {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },

  /**
   * Delete address
   */
  async deleteAddress(id) {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },

  /**
   * Set address as default delivery destination
   */
  async setDefaultAddress(id) {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data;
  },
};

export default addressService;
