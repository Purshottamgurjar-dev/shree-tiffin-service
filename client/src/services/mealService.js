import api from './api';

export const MEAL_CATEGORIES = [
  'All',
  'Daily Tiffin',
  'Lunch',
  'Dinner',
  'Special Thali',
  'Breakfast',
  'Extra Items',
  'Add-ons',
];

export const mealService = {
  // Get all meals with optional filters (category, search, featured, available, sort)
  async getMeals(params = {}) {
    const response = await api.get('/meals', { params });
    return response.data;
  },

  // Get single meal by ID or slug
  async getMealById(id) {
    const response = await api.get(`/meals/${id}`);
    return response.data;
  },

  // Create new meal (Owner only)
  async createMeal(mealData) {
    const response = await api.post('/meals', mealData);
    return response.data;
  },

  // Update existing meal (Owner only)
  async updateMeal(id, mealData) {
    const response = await api.put(`/meals/${id}`, mealData);
    return response.data;
  },

  // Delete meal (Owner only)
  async deleteMeal(id) {
    const response = await api.delete(`/meals/${id}`);
    return response.data;
  },

  // Toggle meal availability (Owner only)
  async toggleAvailability(id, isAvailable) {
    const response = await api.patch(`/meals/${id}/availability`, { isAvailable });
    return response.data;
  },

  // Toggle meal featured status (Owner only)
  async toggleFeatured(id, isFeatured) {
    const response = await api.patch(`/meals/${id}/featured`, { isFeatured });
    return response.data;
  },

  // Get meal inventory metrics for owner dashboard (Owner only)
  async getMealStats() {
    const response = await api.get('/meals/admin/stats');
    return response.data;
  },
};

export default mealService;
