import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingBag,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Bike,
  CreditCard,
  Banknote,
  Utensils,
  ChevronRight,
  Info,
  Settings,
  X,
  Layers,
  PieChart as PieIcon,
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import { formatCurrency, formatDate } from '../../utils';

export default function AdminAnalytics() {
  // Filters & Options
  const [preset, setPreset] = useState('last30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [compare, setCompare] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, meals, customers, cancellations, delivery
  const [mealTab, setMealTab] = useState('top'); // top, low

  // Main Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [orderTrend, setOrderTrend] = useState([]);
  const [mealsData, setMealsData] = useState({ topSelling: [], lowPerforming: [] });
  const [customerStats, setCustomerStats] = useState(null);
  const [cancellationStats, setCancellationStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [deliveryStats, setDeliveryStats] = useState(null);
  const [peakTimes, setPeakTimes] = useState(null);

  // Business Cost Modal State
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [costForm, setCostForm] = useState({
    ingredientCostPercentage: 0,
    packagingCostPerOrder: 0,
    deliveryCostPerOrder: 0,
    operatingCostMonthly: 0,
  });
  const [savingCosts, setSavingCosts] = useState(false);
  const [costSuccessMsg, setCostSuccessMsg] = useState('');

  // Export State
  const [exportingType, setExportingType] = useState(null);

  // Fetch all analytics datasets
  const fetchAnalytics = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const params = { preset };
      if (preset === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      if (compare) {
        params.compare = 'true';
      }

      const [
        overviewRes,
        revTrendRes,
        ordTrendRes,
        mealsRes,
        custRes,
        cancRes,
        payRes,
        delivRes,
        peakRes,
        costsRes,
      ] = await Promise.all([
        analyticsService.getOverview(params),
        analyticsService.getRevenueTrend(params),
        analyticsService.getOrderTrend(params),
        analyticsService.getMealsAnalytics(params),
        analyticsService.getCustomerStats(params),
        analyticsService.getCancellationStats(params),
        analyticsService.getPaymentStats(params),
        analyticsService.getDeliveryStats(params),
        analyticsService.getPeakTimes(params),
        analyticsService.getCostSettings(),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (revTrendRes.success) setRevenueTrend(revTrendRes.data.trend || []);
      if (ordTrendRes.success) setOrderTrend(ordTrendRes.data.trend || []);
      if (mealsRes.success) setMealsData(mealsRes.data);
      if (custRes.success) setCustomerStats(custRes.data);
      if (cancRes.success) setCancellationStats(cancRes.data);
      if (payRes.success) setPaymentStats(payRes.data);
      if (delivRes.success) setDeliveryStats(delivRes.data);
      if (peakRes.success) setPeakTimes(peakRes.data);
      if (costsRes.success) {
        setCostForm({
          ingredientCostPercentage: costsRes.data.ingredientCostPercentage || 0,
          packagingCostPerOrder: costsRes.data.packagingCostPerOrder || 0,
          deliveryCostPerOrder: costsRes.data.deliveryCostPerOrder || 0,
          operatingCostMonthly: costsRes.data.operatingCostMonthly || 0,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [preset, compare]);

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setError('Please select both start date and end date');
      return;
    }
    fetchAnalytics();
  };

  const handleSaveCosts = async (e) => {
    e.preventDefault();
    setSavingCosts(true);
    setCostSuccessMsg('');
    try {
      await analyticsService.updateCostSettings(costForm);
      setCostSuccessMsg('Business cost configuration updated successfully!');
      setTimeout(() => {
        setIsCostModalOpen(false);
        setCostSuccessMsg('');
        fetchAnalytics(true);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to update cost settings');
    } finally {
      setSavingCosts(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setExportingType(type);
      const params = { preset };
      if (preset === 'custom' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      await analyticsService.downloadReport(type, params);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExportingType(null);
    }
  };

  // Safe Helper for growth display
  const renderGrowthBadge = (growthValue) => {
    if (growthValue === null || growthValue === undefined) return null;
    const isPositive = growthValue > 0;
    const isZero = growthValue === 0;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '11.5px',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '999px',
          backgroundColor: isZero ? '#f3f4f6' : isPositive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          color: isZero ? '#4b5563' : isPositive ? '#15803d' : '#b91c1c',
        }}
      >
        {isPositive ? <ArrowUpRight size={13} /> : !isZero ? <ArrowDownRight size={13} /> : null}
        {isPositive ? `+${growthValue}%` : `${growthValue}%`} vs prev
      </span>
    );
  };

  return (
    <div style={{ backgroundColor: '#fcfbf8', minHeight: '100vh', padding: '32px 16px 64px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--primary-900)', fontWeight: '600' }}>Business Analytics & Reporting</span>
        </div>

        {/* Top Header & Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '28px',
            paddingBottom: '20px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary-800) 0%, #1c1917 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <BarChart3 size={22} />
              </div>
              <div>
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '24px',
                    fontWeight: '800',
                    color: '#1c1917',
                    letterSpacing: '-0.5px',
                    margin: 0,
                  }}
                >
                  Owner Analytics & Reporting
                </h1>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Real-time server calculated metrics • Shree Tiffin Service (Ghar Jaisa Khana, Har Din)
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Preset Selector */}
            <div style={{ position: 'relative' }}>
              <select
                id="analytics-preset-select"
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#1f2937',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
                <option value="thisyear">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Compare Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                style={{ accentColor: 'var(--primary-800)', cursor: 'pointer' }}
              />
              Compare vs Prior Period
            </label>

            {/* Cost Configuration Button */}
            <button
              id="analytics-cost-config-btn"
              onClick={() => setIsCostModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer',
              }}
              title="Configure recorded costs to calculate Estimated Profit"
            >
              <Settings size={15} color="#4b5563" />
              <span>Business Costs</span>
            </button>

            {/* CSV Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                id="analytics-export-select"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleExport(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={Boolean(exportingType)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#0284c7',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="" disabled>
                  {exportingType ? `Exporting ${exportingType}...` : '📥 Export CSV Report'}
                </option>
                <option value="sales">Sales Report (CSV)</option>
                <option value="payments">Payment Report (CSV)</option>
                <option value="customers">Customer Report (CSV)</option>
                <option value="meals">Meal Performance (CSV)</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              id="analytics-refresh-btn"
              onClick={() => fetchAnalytics(true)}
              disabled={loading || refreshing}
              style={{
                padding: '9px 13px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#4b5563',
              }}
              title="Refresh Analytics Data"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Custom Date Form (Shown only when preset === 'custom') */}
        {preset === 'custom' && (
          <form
            onSubmit={handleCustomDateSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="#6b7280" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Custom Range:</span>
            </div>
            <input
              type="date"
              id="analytics-start-date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <span style={{ fontSize: '13px', color: '#6b7280' }}>to</span>
            <input
              type="date"
              id="analytics-end-date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
              style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <button
              type="submit"
              id="analytics-apply-custom-btn"
              style={{
                padding: '7px 16px',
                backgroundColor: 'var(--primary-800)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Apply Filter
            </button>
          </form>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              color: '#991b1b',
              fontSize: '13.5px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Top KPI Cards Grid */}
        {overview && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '18px',
              marginBottom: '28px',
            }}
          >
            {/* Realized Revenue Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Realized Revenue</span>
                  <span title="Verified online payments + COD payments marked as collected." style={{ cursor: 'help', display: 'flex', alignItems: 'center' }}>
                    <Info size={13} color="#9ca3af" />
                  </span>
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(234, 88, 12, 0.1)',
                    color: 'var(--primary-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>
                {formatCurrency(overview.revenue?.realizedRevenue || 0)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {overview.orders?.paidCount || 0} paid orders
                </span>
                {compare && overview.comparison && renderGrowthBadge(overview.comparison.growth?.revenueGrowth)}
              </div>
            </div>

            {/* Total Orders Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Total Orders</span>
                  <span title="Total number of orders placed in this period, including cancelled." style={{ cursor: 'help', display: 'flex', alignItems: 'center' }}>
                    <Info size={13} color="#9ca3af" />
                  </span>
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>
                {overview.orders?.total || 0}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                  {overview.orders?.delivered || 0} Delivered
                </span>
                {compare && overview.comparison && renderGrowthBadge(overview.comparison.growth?.orderGrowth)}
              </div>
            </div>

            {/* Average Order Value (AOV) Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Average Order Value</span>
                  <span title="Realized revenue divided by qualifying paid/collected orders." style={{ cursor: 'help', display: 'flex', alignItems: 'center' }}>
                    <Info size={13} color="#9ca3af" />
                  </span>
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>
                {formatCurrency(overview.revenue?.aov || 0)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  Month: {formatCurrency(overview.revenue?.monthAov || 0)}
                </span>
                {compare && overview.comparison && renderGrowthBadge(overview.comparison.growth?.aovGrowth)}
              </div>
            </div>

            {/* Active Customers & Retention Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Active Customers</span>
                  <span title="Customers who placed at least one valid order during the last 30 days." style={{ cursor: 'help', display: 'flex', alignItems: 'center' }}>
                    <Info size={13} color="#9ca3af" />
                  </span>
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>
                {overview.customers?.active || 0}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '600' }}>
                  Repeat Rate: {overview.customers?.repeatOrderRate || 0}%
                </span>
                {compare && overview.comparison && renderGrowthBadge(overview.comparison.growth?.customerGrowth)}
              </div>
            </div>

            {/* Estimated Profit Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #f3f4f6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                background: 'linear-gradient(180deg, #ffffff 0%, #fafffc 100%)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#047857' }}>Estimated Profit</span>
                  <button
                    onClick={() => setIsCostModalOpen(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    title="Configure costs"
                  >
                    <Info size={13} color="#059669" />
                  </button>
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DollarSign size={18} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '800', color: '#065f46', letterSpacing: '-0.5px' }}>
                {formatCurrency(overview.estimatedProfit?.estimatedProfit || 0)}
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                {overview.estimatedProfit?.hasConfiguredCosts ? (
                  <span>Recorded Costs: {formatCurrency(overview.estimatedProfit?.totalRecordedCosts || 0)}</span>
                ) : (
                  <span style={{ color: '#d97706', fontStyle: 'italic' }}>Costs not configured yet</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Period Revenue Highlights Banner */}
        {overview && overview.revenue && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              padding: '16px 20px',
              border: '1px solid #e5e7eb',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Today's Revenue</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
                {formatCurrency(overview.revenue.today || 0)}
              </div>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Yesterday</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
                {formatCurrency(overview.revenue.yesterday || 0)}
              </div>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>This Week</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
                {formatCurrency(overview.revenue.thisWeek || 0)}
              </div>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>This Month</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
                {formatCurrency(overview.revenue.thisMonth || 0)}
              </div>
            </div>
            <div style={{ width: '1px', height: '32px', backgroundColor: '#e5e7eb' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Previous Month</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginTop: '2px' }}>
                {formatCurrency(overview.revenue.previousMonth || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '8px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'overview', label: '📊 Trends & Distributions' },
            { id: 'meals', label: '🍲 Best-Selling Meals' },
            { id: 'customers', label: '👥 Customer Retention' },
            { id: 'payments', label: '💳 Payment Breakdown' },
            { id: 'delivery', label: '🛵 Delivery & Cancellations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--primary-800)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CHARTS & TRENDS */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '24px' }}>
            {/* Chart 1: Revenue Trend (SVG) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Realized Revenue Trend
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>
                    Strictly paid online + collected COD transactions
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-800)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-800)' }} />
                    Revenue (₹)
                  </span>
                </div>
              </div>

              {revenueTrend.length > 0 ? (
                <div style={{ width: '100%', height: '240px' }}>
                  <RevenueTrendSvgChart data={revenueTrend} />
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No revenue data in this period
                </div>
              )}
            </div>

            {/* Chart 2: Order Trend (Delivered vs Cancelled vs Pending) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Order Volume & Status
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>
                    Delivered, Cancelled, and Pending breakdown
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', fontWeight: '600' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                    Delivered
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                    Cancelled
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                    Pending
                  </span>
                </div>
              </div>

              {orderTrend.length > 0 ? (
                <div style={{ width: '100%', height: '240px' }}>
                  <OrderTrendBarSvgChart data={orderTrend} />
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No orders found in this period
                </div>
              )}
            </div>

            {/* Chart 3: Peak Ordering Hours */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Peak Ordering Hours
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>
                    Rush times across 24 hours (00:00 to 23:00)
                  </p>
                </div>
                {peakTimes && (
                  <div
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(234, 88, 12, 0.1)',
                      color: 'var(--primary-800)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                    }}
                  >
                    Peak: {peakTimes.peakHour}
                  </div>
                )}
              </div>

              {peakTimes?.hours ? (
                <div style={{ width: '100%', height: '240px' }}>
                  <HourlyRushSvgChart hours={peakTimes.hours} />
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No hourly data available
                </div>
              )}
            </div>

            {/* Chart 4: Orders by Weekday */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Orders by Weekday
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>
                    Weekly distribution from Sunday to Saturday
                  </p>
                </div>
                {peakTimes && (
                  <div
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                    }}
                  >
                    Busiest Day: {peakTimes.peakDay}
                  </div>
                )}
              </div>

              {peakTimes?.weekdays ? (
                <div style={{ width: '100%', height: '240px' }}>
                  <WeekdayDistributionSvgChart weekdays={peakTimes.weekdays} />
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No weekday data available
                </div>
              )}
            </div>

            {/* Chart 5: Order Status Distribution */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Order Status Distribution
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>
                    Real-time fulfillment vs cancellation breakdown
                  </p>
                </div>
              </div>

              {overview?.orders && overview.orders.total > 0 ? (
                <div>
                  <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <OrderStatusDonutSvg
                      delivered={overview.orders.delivered || 0}
                      cancelled={overview.orders.cancelled || 0}
                      pending={overview.orders.pending || 0}
                      other={(overview.orders.confirmed || 0) + (overview.orders.preparing || 0) + (overview.orders.outForDelivery || 0)}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px', fontSize: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '700' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
                      Delivered ({overview.orders.delivered || 0})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: '700' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                      Cancelled ({overview.orders.cancelled || 0})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706', fontWeight: '700' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                      Pending ({overview.orders.pending || 0})
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0284c7', fontWeight: '700' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                      Kitchen / Transit ({((overview.orders.confirmed || 0) + (overview.orders.preparing || 0) + (overview.orders.outForDelivery || 0))})
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No orders found in this period
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BEST-SELLING & LOW PERFORMING MEALS */}
        {activeTab === 'meals' && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Meal Popularity & Performance
                </h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                  Calculated from immutable order snapshot items (excludes cancelled orders)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setMealTab('top')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: '1px solid #d1d5db',
                    backgroundColor: mealTab === 'top' ? 'var(--primary-800)' : '#ffffff',
                    color: mealTab === 'top' ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                  }}
                >
                  🔥 Top 5 Best Sellers
                </button>
                <button
                  onClick={() => setMealTab('low')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: '1px solid #d1d5db',
                    backgroundColor: mealTab === 'low' ? 'var(--primary-800)' : '#ffffff',
                    color: mealTab === 'low' ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                  }}
                >
                  📉 Low Performing Meals
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#6b7280', fontWeight: '700', fontSize: '12px' }}>
                    <th style={{ padding: '12px 14px' }}>RANK</th>
                    <th style={{ padding: '12px 14px' }}>MEAL NAME</th>
                    <th style={{ padding: '12px 14px' }}>CATEGORY</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>QUANTITY SOLD</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>ORDERS</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>REVENUE GENERATED</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>AVG SELLING PRICE</th>
                    <th style={{ padding: '12px 14px', textAlign: 'center' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {(mealTab === 'top' ? mealsData.topSelling : mealsData.lowPerforming).map((meal, idx) => (
                    <tr key={meal.mealId || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px', fontWeight: '700', color: '#9ca3af' }}>#{idx + 1}</td>
                      <td style={{ padding: '14px', fontWeight: '700', color: '#111827' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Utensils size={15} color="var(--primary-800)" />
                          <span>{meal.mealName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px', color: '#6b7280' }}>{meal.category || 'General'}</td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                        {meal.quantitySold} units
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#4b5563' }}>
                        {meal.orderCount}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                        {formatCurrency(meal.revenueGenerated || 0)}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right', color: '#4b5563' }}>
                        {formatCurrency(meal.averageSellingPrice || 0)}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: meal.currentAvailability ? '#ecfdf5' : '#fef2f2',
                            color: meal.currentAvailability ? '#059669' : '#dc2626',
                          }}
                        >
                          {meal.currentAvailability ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(mealTab === 'top' ? mealsData.topSelling : mealsData.lowPerforming).length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                        No meal records found for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER RETENTION & TOP CUSTOMERS */}
        {activeTab === 'customers' && customerStats && (
          <div>
            {/* Customer Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>New Customers</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  {customerStats.overview?.newCustomers || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>Registered in range</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Returning Customers</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  {customerStats.overview?.returningCustomers || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '2px' }}>Placed repeat order in range</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Customers with 2+ Orders</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  {customerStats.overview?.customersWith2Plus || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#7c3aed', marginTop: '2px' }}>Loyal repeat buyers</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Customers with 5+ Orders</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  {customerStats.overview?.customersWith5Plus || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#ea580c', marginTop: '2px' }}>High-frequency advocates</div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Average Spend / Customer</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827', marginTop: '4px' }}>
                  {formatCurrency(customerStats.overview?.avgCustomerSpend || 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Avg orders: {customerStats.overview?.avgOrdersPerCustomer || 0}</div>
              </div>
            </div>

            {/* Customer Growth & Retention Visual Chart */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Customer Growth & Retention Breakdown
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '3px 0 0' }}>
                    Segment analysis of customer acquisition, activity, and loyalty
                  </p>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    color: '#7c3aed',
                    fontWeight: '700',
                    fontSize: '12px',
                  }}
                >
                  Repeat Rate: {customerStats.overview?.repeatCustomerPercentage || 0}%
                </span>
              </div>
              <CustomerGrowthSvgChart overview={customerStats.overview} />
            </div>

            {/* Top Spenders Table */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '0 0 16px' }}>
                Top Customers Leaderboard
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#6b7280', fontWeight: '700', fontSize: '12px' }}>
                      <th style={{ padding: '12px 14px' }}>CUSTOMER</th>
                      <th style={{ padding: '12px 14px' }}>EMAIL & PHONE</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>TOTAL ORDERS</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>DELIVERED</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>TOTAL SPENT</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>LAST ORDER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerStats.topCustomers?.map((c) => (
                      <tr key={c._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '14px', fontWeight: '700', color: '#111827' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary-100)',
                                color: 'var(--primary-800)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '800',
                              }}
                            >
                              {(c.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <span>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px', color: '#6b7280', fontSize: '12.5px' }}>
                          <div>{c.email}</div>
                          <div style={{ color: '#9ca3af' }}>{c.phone}</div>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center', fontWeight: '700', color: '#111827' }}>
                          {c.totalOrders}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'center', color: '#16a34a', fontWeight: '600' }}>
                          {c.completedOrders}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: '800', color: '#111827' }}>
                          {formatCurrency(c.totalSpent)}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', color: '#6b7280', fontSize: '12.5px' }}>
                          {c.lastOrderDate ? formatDate(c.lastOrderDate) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {(!customerStats.topCustomers || customerStats.topCustomers.length === 0) && (
                      <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#9ca3af' }}>
                          No customer orders recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENT BREAKDOWN */}
        {activeTab === 'payments' && paymentStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
            {/* Online Payment Summary */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Online Payment Analytics
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Razorpay & Webhooks</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Realized Online Revenue</span>
                  <strong style={{ color: '#16a34a', fontSize: '16px' }}>
                    {formatCurrency(paymentStats.online?.totalOnlineRevenue || 0)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Successful Payments</span>
                  <span style={{ fontWeight: '700', color: '#111827' }}>{paymentStats.online?.successfulPayments || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Failed Payments</span>
                  <span style={{ fontWeight: '700', color: '#dc2626' }}>{paymentStats.online?.failedPayments || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Failed Amount</span>
                  <span style={{ color: '#dc2626' }}>{formatCurrency(paymentStats.online?.failedAmount || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Refund Amount</span>
                  <span style={{ color: '#6b7280' }}>{formatCurrency(paymentStats.online?.refundAmount || 0)}</span>
                </div>
              </div>
            </div>

            {/* Cash on Delivery Summary */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Cash on Delivery (COD)
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Collected & Pending Cash</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>COD Collected Revenue</span>
                  <strong style={{ color: '#16a34a', fontSize: '16px' }}>
                    {formatCurrency(paymentStats.cod?.codCollectedAmount || 0)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Collected Orders</span>
                  <span style={{ fontWeight: '700', color: '#111827' }}>{paymentStats.cod?.codCollectedCount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Pending COD Amount</span>
                  <strong style={{ color: '#d97706', fontSize: '15px' }}>
                    {formatCurrency(paymentStats.cod?.pendingCodAmount || 0)}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Pending COD Orders</span>
                  <span style={{ fontWeight: '700', color: '#d97706' }}>{paymentStats.cod?.pendingCodCount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '13.5px' }}>COD Collection Rate</span>
                  <strong style={{ color: '#059669' }}>{paymentStats.cod?.codCollectionRate || 0}%</strong>
                </div>
              </div>
            </div>

            {/* Payment Method Distribution */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: '0 0 16px' }}>
                Payment Method Share
              </h3>
              <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PaymentShareDonutSvg
                  onlinePct={paymentStats.distribution?.onlinePercentage || 0}
                  codPct={paymentStats.distribution?.codPercentage || 0}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px', fontSize: '13px' }}>
                <span style={{ color: '#2563eb', fontWeight: '700' }}>
                  Online: {paymentStats.distribution?.onlinePercentage || 0}%
                </span>
                <span style={{ color: '#059669', fontWeight: '700' }}>
                  COD: {paymentStats.distribution?.codPercentage || 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DELIVERY & CANCELLATIONS */}
        {activeTab === 'delivery' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '24px' }}>
            {/* Delivery Operational Performance */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(2, 132, 199, 0.1)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bike size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Delivery Performance
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Speed & Realized Deliveries</div>
                </div>
              </div>

              {deliveryStats && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                    <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Delivered Today</span>
                    <strong style={{ color: '#16a34a', fontSize: '15px' }}>{deliveryStats.deliveredToday || 0} orders</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                    <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Currently Out for Delivery</span>
                    <strong style={{ color: '#0284c7', fontSize: '15px' }}>{deliveryStats.outForDelivery || 0} orders</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                    <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Pending in Kitchen / Unassigned</span>
                    <strong style={{ color: '#d97706', fontSize: '15px' }}>{deliveryStats.pendingDelivery || 0} orders</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px' }}>
                    <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Delivery Completion Rate</span>
                    <strong style={{ color: '#16a34a', fontSize: '15px' }}>{deliveryStats.deliveryCompletionRate || 0}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '13.5px' }}>Average Completion Duration</span>
                    <strong style={{ color: '#111827', fontSize: '15px' }}>
                      {deliveryStats.avgCompletionTime || 'Insufficient data'}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Cancellation Analytics & Reasons */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Cancellation Analytics
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Lost Sales & Reason Aggregation</div>
                </div>
              </div>

              {cancellationStats && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11.5px', color: '#991b1b', fontWeight: '600' }}>Total Cancelled</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#b91c1c' }}>
                        {cancellationStats.totalCancelled || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: '#991b1b' }}>Rate: {cancellationStats.cancellationRate || 0}%</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '10px' }}>
                      <div style={{ fontSize: '11.5px', color: '#991b1b', fontWeight: '600' }}>Cancelled Value</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#b91c1c' }}>
                        {formatCurrency(cancellationStats.cancellationAmount || 0)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#991b1b' }}>Excluded from revenue</div>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', margin: '14px 0 8px' }}>
                    Common Cancellation Reasons:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cancellationStats.reasons?.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                        }}
                      >
                        <span style={{ color: '#4b5563' }}>{r.reason}</span>
                        <strong style={{ color: '#111827' }}>{r.count}</strong>
                      </div>
                    ))}
                    {(!cancellationStats.reasons || cancellationStats.reasons.length === 0) && (
                      <div style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic' }}>
                        No cancellations recorded in this period.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: Business Cost Configuration */}
        {isCostModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                maxWidth: '520px',
                width: '100%',
                padding: '28px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
                      Business Cost Configuration
                    </h3>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Calculates "Estimated Profit = Realized Revenue - Recorded Costs"
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCostModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                >
                  <X size={20} />
                </button>
              </div>

              {costSuccessMsg && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#ecfdf5',
                    color: '#065f46',
                    borderRadius: '8px',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  {costSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveCosts} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Ingredient Cost (% of realized revenue)
                  </label>
                  <input
                    type="number"
                    id="cost-ingredient-pct"
                    min="0"
                    max="100"
                    step="0.5"
                    value={costForm.ingredientCostPercentage}
                    onChange={(e) =>
                      setCostForm({ ...costForm, ingredientCostPercentage: parseFloat(e.target.value) || 0 })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#9ca3af' }}>Example: 35% standard for tiffin ingredients</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Packaging Cost per Order (₹)
                  </label>
                  <input
                    type="number"
                    id="cost-packaging-order"
                    min="0"
                    step="1"
                    value={costForm.packagingCostPerOrder}
                    onChange={(e) =>
                      setCostForm({ ...costForm, packagingCostPerOrder: parseFloat(e.target.value) || 0 })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#9ca3af' }}>Example: ₹15 per sealed container box</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Delivery Fuel / Rider Cost per Order (₹)
                  </label>
                  <input
                    type="number"
                    id="cost-delivery-order"
                    min="0"
                    step="1"
                    value={costForm.deliveryCostPerOrder}
                    onChange={(e) =>
                      setCostForm({ ...costForm, deliveryCostPerOrder: parseFloat(e.target.value) || 0 })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#9ca3af' }}>Example: ₹20 per fulfilled delivery trip</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Monthly Operating Overhead (₹)
                  </label>
                  <input
                    type="number"
                    id="cost-operating-monthly"
                    min="0"
                    step="100"
                    value={costForm.operatingCostMonthly}
                    onChange={(e) =>
                      setCostForm({ ...costForm, operatingCostMonthly: parseFloat(e.target.value) || 0 })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#9ca3af' }}>Kitchen rent, utilities, gas (prorated to selected period)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCostModalOpen(false)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#4b5563',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="cost-save-submit-btn"
                    disabled={savingCosts}
                    style={{
                      padding: '9px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'var(--primary-800)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    {savingCosts ? 'Saving...' : 'Save Cost Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Pure Responsive SVG Chart Components
// -------------------------------------------------------------

/**
 * 1. Realized Revenue Area / Line Chart
 */
function RevenueTrendSvgChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) return null;

  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 55 };

  const maxRevenue = Math.max(...data.map((d) => d.revenue || 0), 100);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.revenue || 0) / maxRevenue) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * (1 - ratio);
          const val = Math.round(maxRevenue * ratio);
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        <path d={areaPath} fill="url(#revenueGrad)" />

        {/* Line Stroke */}
        <path d={linePath} fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />

        {/* Data Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 5 : 3}
            fill="#ffffff"
            stroke="#ea580c"
            strokeWidth={hoveredIndex === i ? 3 : 2}
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}

        {/* X-axis labels (Sampled if many data points) */}
        {points.map((p, i) => {
          const shouldShow =
            data.length <= 8 ||
            i === 0 ||
            i === points.length - 1 ||
            i % Math.ceil(data.length / 6) === 0;
          if (!shouldShow) return null;

          const label = p.date.includes('-') ? p.date.slice(5) : p.date;
          return (
            <text
              key={i}
              x={p.x}
              y={padding.top + chartHeight + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#9ca3af"
              fontWeight="600"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Hover Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            top: `${(points[hoveredIndex].y / height) * 100}%`,
            transform: 'translate(-50%, -115%)',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: '700' }}>{points[hoveredIndex].date}</div>
          <div style={{ color: '#fed7aa' }}>Revenue: ₹{points[hoveredIndex].revenue}</div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>
            Online: ₹{points[hoveredIndex].onlineRevenue} • COD: ₹{points[hoveredIndex].codRevenue}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 2. Order Trend Grouped Bar Chart
 */
function OrderTrendBarSvgChart({ data = [] }) {
  if (!data || data.length === 0) return null;

  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 40 };

  const maxOrders = Math.max(...data.map((d) => d.totalOrders || 0), 5);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const barGroupWidth = chartWidth / data.length;
  const subBarWidth = Math.max(3, Math.min(12, (barGroupWidth - 6) / 3));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {/* Grid Lines */}
      {[0, 0.5, 1].map((ratio, idx) => {
        const y = padding.top + chartHeight * (1 - ratio);
        const val = Math.round(maxOrders * ratio);
        return (
          <g key={idx}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              {val}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const groupX = padding.left + i * barGroupWidth;
        const centerX = groupX + barGroupWidth / 2;

        const deliveredHeight = ((d.deliveredOrders || 0) / maxOrders) * chartHeight;
        const cancelledHeight = ((d.cancelledOrders || 0) / maxOrders) * chartHeight;
        const pendingHeight = ((d.pendingOrders || 0) / maxOrders) * chartHeight;

        const shouldShowLabel =
          data.length <= 8 || i === 0 || i === data.length - 1 || i % Math.ceil(data.length / 6) === 0;
        const label = d.date.includes('-') ? d.date.slice(5) : d.date;

        return (
          <g key={i}>
            {/* Delivered Bar */}
            <rect
              x={centerX - subBarWidth * 1.5 - 1}
              y={padding.top + chartHeight - deliveredHeight}
              width={subBarWidth}
              height={deliveredHeight}
              fill="#16a34a"
              rx="2"
            />
            {/* Cancelled Bar */}
            <rect
              x={centerX - subBarWidth * 0.5}
              y={padding.top + chartHeight - cancelledHeight}
              width={subBarWidth}
              height={cancelledHeight}
              fill="#dc2626"
              rx="2"
            />
            {/* Pending Bar */}
            <rect
              x={centerX + subBarWidth * 0.5 + 1}
              y={padding.top + chartHeight - pendingHeight}
              width={subBarWidth}
              height={pendingHeight}
              fill="#d97706"
              rx="2"
            />

            {/* Label */}
            {shouldShowLabel && (
              <text
                x={centerX}
                y={padding.top + chartHeight + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
                fontWeight="600"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * 3. Hourly Rush Times Bar Chart
 */
function HourlyRushSvgChart({ hours = [] }) {
  if (!hours || hours.length === 0) return null;

  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 35 };

  const maxOrders = Math.max(...hours.map((h) => h.orderCount || 0), 3);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = chartWidth / hours.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {/* Grid Lines */}
      {[0, 0.5, 1].map((ratio, idx) => {
        const y = padding.top + chartHeight * (1 - ratio);
        return (
          <line
            key={idx}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        );
      })}

      {/* Hourly Bars */}
      {hours.map((h, i) => {
        const x = padding.left + i * barWidth;
        const barH = ((h.orderCount || 0) / maxOrders) * chartHeight;
        const isPeak = h.orderCount === maxOrders && maxOrders > 0;

        return (
          <g key={i}>
            <rect
              x={x + 2}
              y={padding.top + chartHeight - barH}
              width={Math.max(2, barWidth - 4)}
              height={barH}
              fill={isPeak ? '#ea580c' : '#fdba74'}
              rx="2"
            >
              <title>{`${h.label}: ${h.orderCount} orders (₹${h.revenue})`}</title>
            </rect>

            {/* Label every 4 hours */}
            {i % 4 === 0 && (
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 16}
                textAnchor="middle"
                fontSize="9"
                fill="#9ca3af"
                fontWeight="600"
              >
                {h.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/**
 * 4. Weekday Distribution Bar Chart
 */
function WeekdayDistributionSvgChart({ weekdays = [] }) {
  if (!weekdays || weekdays.length === 0) return null;

  const width = 500;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 35 };

  const maxOrders = Math.max(...weekdays.map((w) => w.orderCount || 0), 3);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = chartWidth / weekdays.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      {/* Grid Lines */}
      {[0, 0.5, 1].map((ratio, idx) => {
        const y = padding.top + chartHeight * (1 - ratio);
        return (
          <line
            key={idx}
            x1={padding.left}
            y1={y}
            x2={width - padding.right}
            y2={y}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        );
      })}

      {/* Weekday Bars */}
      {weekdays.map((w, i) => {
        const x = padding.left + i * barWidth;
        const barH = ((w.orderCount || 0) / maxOrders) * chartHeight;
        const isBusiest = w.orderCount === maxOrders && maxOrders > 0;

        return (
          <g key={i}>
            <rect
              x={x + 10}
              y={padding.top + chartHeight - barH}
              width={Math.max(6, barWidth - 20)}
              height={barH}
              fill={isBusiest ? '#059669' : '#a7f3d0'}
              rx="3"
            >
              <title>{`${w.dayName}: ${w.orderCount} orders (₹${w.revenue})`}</title>
            </rect>

            <text
              x={x + barWidth / 2}
              y={padding.top + chartHeight + 16}
              textAnchor="middle"
              fontSize="11"
              fill="#4b5563"
              fontWeight="600"
            >
              {w.dayName.slice(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * 5. Payment Share Donut SVG
 */
function PaymentShareDonutSvg({ onlinePct = 50, codPct = 50 }) {
  const size = 150;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const validOnline = Math.max(0, Math.min(100, onlinePct));
  const onlineDash = (validOnline / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background COD Circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth={strokeWidth}
      />

      {/* Foreground Online Stroke */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        strokeDasharray={`${onlineDash} ${circumference}`}
        strokeDashoffset="0"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeLinecap="round"
      />

      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill="#111827"
      >
        {onlinePct}%
      </text>
      <text
        x={size / 2}
        y={size / 2 + 19}
        textAnchor="middle"
        fontSize="9"
        fill="#6b7280"
      >
        ONLINE
      </text>
    </svg>
  );
}

/**
 * 6. Order Status Donut SVG
 */
function OrderStatusDonutSvg({ delivered = 0, cancelled = 0, pending = 0, other = 0 }) {
  const total = delivered + cancelled + pending + other;
  if (total === 0) return null;

  const size = 160;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const deliveredDash = (delivered / total) * circumference;
  const cancelledDash = (cancelled / total) * circumference;
  const pendingDash = (pending / total) * circumference;
  const otherDash = (other / total) * circumference;

  const offsetDelivered = 0;
  const offsetCancelled = deliveredDash;
  const offsetPending = deliveredDash + cancelledDash;
  const offsetOther = deliveredDash + cancelledDash + pendingDash;

  const delPct = Math.round((delivered / total) * 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth={strokeWidth}
      />
      {/* Delivered segment */}
      {delivered > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#16a34a"
          strokeWidth={strokeWidth}
          strokeDasharray={`${deliveredDash} ${circumference}`}
          strokeDashoffset={-offsetDelivered}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      {/* Cancelled segment */}
      {cancelled > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#dc2626"
          strokeWidth={strokeWidth}
          strokeDasharray={`${cancelledDash} ${circumference}`}
          strokeDashoffset={-offsetCancelled}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      {/* Pending segment */}
      {pending > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#d97706"
          strokeWidth={strokeWidth}
          strokeDasharray={`${pendingDash} ${circumference}`}
          strokeDashoffset={-offsetPending}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      {/* Kitchen / other segment */}
      {other > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0284c7"
          strokeWidth={strokeWidth}
          strokeDasharray={`${otherDash} ${circumference}`}
          strokeDashoffset={-offsetOther}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fill="#111827"
      >
        {delPct}%
      </text>
      <text
        x={size / 2}
        y={size / 2 + 18}
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="#16a34a"
      >
        DELIVERED
      </text>
    </svg>
  );
}

/**
 * 7. Customer Growth & Segment Bar SVG
 */
function CustomerGrowthSvgChart({ overview }) {
  if (!overview) return null;

  const segments = [
    { label: 'Total Base', count: overview.totalCustomers || 0, color: '#4b5563' },
    { label: 'Active in Period', count: overview.activeCustomers || 0, color: '#2563eb' },
    { label: 'New Registered', count: overview.newCustomers || 0, color: '#16a34a' },
    { label: 'Returning Buyers', count: overview.returningCustomers || 0, color: '#7c3aed' },
    { label: '2+ Orders (Loyal)', count: overview.customersWith2Plus || 0, color: '#ea580c' },
    { label: '5+ Orders (VIP)', count: overview.customersWith5Plus || 0, color: '#e11d48' },
  ];

  const maxVal = Math.max(...segments.map((s) => s.count), 1);
  const width = 600;
  const barHeight = 22;
  const gap = 16;
  const height = segments.length * (barHeight + gap) + 10;
  const labelWidth = 140;
  const chartWidth = width - labelWidth - 60;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      {segments.map((seg, idx) => {
        const y = idx * (barHeight + gap) + 5;
        const barW = Math.max(4, (seg.count / maxVal) * chartWidth);

        return (
          <g key={idx}>
            <text
              x={labelWidth - 12}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fontSize="12"
              fontWeight="600"
              fill="#374151"
            >
              {seg.label}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={chartWidth}
              height={barHeight}
              fill="#f3f4f6"
              rx="6"
            />
            <rect
              x={labelWidth}
              y={y}
              width={barW}
              height={barHeight}
              fill={seg.color}
              rx="6"
            >
              <title>{`${seg.label}: ${seg.count} customers`}</title>
            </rect>
            <text
              x={labelWidth + barW + 10}
              y={y + barHeight / 2 + 4}
              fontSize="12"
              fontWeight="700"
              fill={seg.color}
            >
              {seg.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
