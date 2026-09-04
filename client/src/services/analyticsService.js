/**
 * analyticsService.js
 * Frontend Service for Owner Analytics & Business Reporting
 * "Ghar Jaisa Khana, Har Din."
 */

import api from './api';

export const getOverview = async (params = {}) => {
  const res = await api.get('/analytics/overview', { params });
  return res.data;
};

export const getRevenueTrend = async (params = {}) => {
  const res = await api.get('/analytics/revenue-trend', { params });
  return res.data;
};

export const getOrderTrend = async (params = {}) => {
  const res = await api.get('/analytics/order-trend', { params });
  return res.data;
};

export const getMealsAnalytics = async (params = {}) => {
  const res = await api.get('/analytics/meals', { params });
  return res.data;
};

export const getCustomerStats = async (params = {}) => {
  const res = await api.get('/analytics/customers', { params });
  return res.data;
};

export const getCancellationStats = async (params = {}) => {
  const res = await api.get('/analytics/cancellations', { params });
  return res.data;
};

export const getPaymentStats = async (params = {}) => {
  const res = await api.get('/analytics/payments', { params });
  return res.data;
};

export const getDeliveryStats = async (params = {}) => {
  const res = await api.get('/analytics/delivery', { params });
  return res.data;
};

export const getPeakTimes = async (params = {}) => {
  const res = await api.get('/analytics/peak-times', { params });
  return res.data;
};

export const getCostSettings = async () => {
  const res = await api.get('/analytics/costs');
  return res.data;
};

export const updateCostSettings = async (costsData) => {
  const res = await api.post('/analytics/costs', costsData);
  return res.data;
};

export const downloadReport = async (reportType, params = {}) => {
  const res = await api.get(`/analytics/export/${reportType}`, {
    params,
    responseType: 'blob',
  });

  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `shree-tiffin-${reportType}-report-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
};

export default {
  getOverview,
  getRevenueTrend,
  getOrderTrend,
  getMealsAnalytics,
  getCustomerStats,
  getCancellationStats,
  getPaymentStats,
  getDeliveryStats,
  getPeakTimes,
  getCostSettings,
  updateCostSettings,
  downloadReport,
};
