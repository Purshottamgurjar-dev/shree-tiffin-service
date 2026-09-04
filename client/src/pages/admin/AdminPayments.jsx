import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CreditCard, 
  Banknote, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  ShieldCheck,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import PaymentBadge from '../../components/payment/PaymentBadge';
import { formatCurrency, formatDate } from '../../utils';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    onlineRevenue: 0,
    codCollectedRevenue: 0,
    codPendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // COD Collection Modal State
  const [selectedPaymentForCod, setSelectedPaymentForCod] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectError, setCollectError] = useState('');
  const [collectSuccessMessage, setCollectSuccessMessage] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (methodFilter) params.method = methodFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateRange) params.dateRange = dateRange;

      const res = await paymentService.getAllPayments(params);
      if (res.success) {
        setPayments(res.payments || []);
        if (res.stats) setStats(res.stats);
        if (res.pagination) {
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.total);
        }
      } else {
        setError(res.message || 'Failed to load payments.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error loading payments from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, methodFilter, statusFilter, dateRange]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPayments();
  };

  const handleResetFilters = () => {
    setSearch('');
    setMethodFilter('');
    setStatusFilter('');
    setDateRange('');
    setPage(1);
  };

  const handleConfirmCodCollection = async () => {
    if (!selectedPaymentForCod) return;

    setIsCollecting(true);
    setCollectError('');
    try {
      const res = await paymentService.collectCodPayment(selectedPaymentForCod._id);
      if (res.success) {
        setCollectSuccessMessage(
          `Successfully collected ₹${selectedPaymentForCod.amount} for Order ${
            selectedPaymentForCod.order?.orderNumber || ''
          }!`
        );
        setSelectedPaymentForCod(null);
        fetchPayments();
        setTimeout(() => setCollectSuccessMessage(''), 6000);
      } else {
        setCollectError(res.message || 'Failed to record COD collection.');
      }
    } catch (err) {
      setCollectError(err.response?.data?.message || err.message || 'Server error recording collection.');
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <div style={{ padding: '36px 0 80px', minHeight: '85vh', backgroundColor: 'var(--bg-subtle)' }}>
      <div className="container" style={{ maxWidth: '1240px' }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Payment & Settlement Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Track online Razorpay transactions, manage Cash on Delivery collections, and audit kitchen revenue.
            </p>
          </div>

          <button
            onClick={fetchPayments}
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13.5px',
              padding: '8px 16px',
            }}
          >
            <RefreshCw size={15} />
            <span>Refresh Settlements</span>
          </button>
        </div>

        {/* Global Success Notification */}
        {collectSuccessMessage && (
          <div style={{
            backgroundColor: 'var(--veg-50)',
            border: '1px solid var(--veg-200)',
            color: 'var(--veg-800)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
          }}>
            <CheckCircle2 size={20} color="var(--veg-700)" />
            <span>{collectSuccessMessage}</span>
          </div>
        )}

        {/* Revenue KPI Summary Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '28px',
        }}>
          {/* Total Collected Revenue */}
          <div className="card" style={{
            padding: '20px 22px',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '4px solid var(--veg-600)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Total Revenue Collected
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--veg-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TrendingUp size={18} color="var(--veg-700)" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--veg-700)', fontWeight: '600' }}>
              {stats.paidCount} settlements completed
            </div>
          </div>

          {/* Razorpay Online Revenue */}
          <div className="card" style={{
            padding: '20px 22px',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '4px solid #6366f1',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Online (Razorpay)
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eef2ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CreditCard size={18} color="#4f46e5" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {formatCurrency(stats.onlineRevenue)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              100% verified via HMAC-SHA256
            </div>
          </div>

          {/* COD Cash Collected */}
          <div className="card" style={{
            padding: '20px 22px',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '4px solid #0d9488',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                COD Cash Collected
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ccfbf1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Banknote size={18} color="#0f766e" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {formatCurrency(stats.codCollectedRevenue)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Cash received by delivery riders
            </div>
          </div>

          {/* Pending COD Collection */}
          <div className="card" style={{
            padding: '20px 22px',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '4px solid #f59e0b',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Pending COD Collection
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Clock size={18} color="#d97706" />
              </div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#b45309', marginBottom: '4px' }}>
              {formatCurrency(stats.codPendingAmount)}
            </div>
            <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '600' }}>
              {stats.pendingCount} orders pending cash collection
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="card" style={{
          padding: '18px 22px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: '1 1 300px',
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                color="var(--text-tertiary)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search by Payment ID, Razorpay ID, or Order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  backgroundColor: 'var(--bg-subtle)',
                }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '13px' }}>
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="var(--text-tertiary)" />
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <option value="">All Methods</option>
                <option value="ONLINE">Razorpay Online</option>
                <option value="COD">Cash on Delivery (COD)</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <option value="">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
            </select>

            {(search || methodFilter || statusFilter || dateRange) && (
              <button
                onClick={handleResetFilters}
                className="btn btn-outline"
                style={{ padding: '8px 12px', fontSize: '12.5px' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Payments Data Table */}
        <div className="card" style={{
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" color="var(--primary-600)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Loading kitchen settlements...
              </div>
            </div>
          ) : error ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <AlertCircle size={36} color="var(--status-danger)" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Failed to Load Payments
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {error}
              </div>
              <button onClick={fetchPayments} className="btn btn-outline" style={{ fontSize: '13px' }}>
                Try Again
              </button>
            </div>
          ) : payments.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <CreditCard size={44} color="var(--text-tertiary)" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '6px' }}>
                No Payment Records Found
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                {search || methodFilter || statusFilter
                  ? 'No transactions matched your search or filter criteria.'
                  : 'Settlement transactions will automatically appear here as customers place orders.'}
              </p>
              {(search || methodFilter || statusFilter) && (
                <button onClick={handleResetFilters} className="btn btn-outline" style={{ fontSize: '13px' }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    <th style={{ padding: '14px 18px' }}>Payment / Order</th>
                    <th style={{ padding: '14px 18px' }}>Customer</th>
                    <th style={{ padding: '14px 18px' }}>Method & Status</th>
                    <th style={{ padding: '14px 18px' }}>Amount</th>
                    <th style={{ padding: '14px 18px' }}>Gateway / Details</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const customerName = p.user?.name || p.order?.customerSnapshot?.name || 'Customer';
                    const customerPhone = p.user?.phone || p.order?.customerSnapshot?.phone || '—';
                    const orderNumber = p.order?.orderNumber || (p.order ? `Order #${String(p.order).slice(-6)}` : '—');
                    const orderId = p.order?._id || p.order;
                    const isPendingCod = p.method === 'COD' && p.status !== 'Paid';

                    return (
                      <tr
                        key={p._id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          fontSize: '13.5px',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        {/* Payment & Order */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {p.paymentId || `PAY-${p._id.slice(-6)}`}
                          </div>
                          <div style={{ fontSize: '12.5px' }}>
                            {orderId ? (
                              <Link
                                to={`/admin/orders/${orderId}`}
                                style={{
                                  color: 'var(--primary-700)',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                }}
                              >
                                {orderNumber}
                              </Link>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)' }}>{orderNumber}</span>
                            )}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {formatDate(p.createdAt)}
                          </div>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {customerName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            📞 {customerPhone}
                          </div>
                        </td>

                        {/* Method & Status */}
                        <td style={{ padding: '14px 18px' }}>
                          <PaymentBadge method={p.method} status={p.status} />
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '15px' }}>
                            {formatCurrency(p.amount)}
                          </div>
                        </td>

                        {/* Gateway / Settlement Info */}
                        <td style={{ padding: '14px 18px' }}>
                          {p.method === 'ONLINE' ? (
                            <div>
                              {p.gatewayPaymentId ? (
                                <div style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                                  ID: {p.gatewayPaymentId}
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Awaiting Checkout</span>
                              )}
                              {p.verifiedAt && (
                                <div style={{ fontSize: '11px', color: 'var(--veg-700)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <ShieldCheck size={12} />
                                  <span>Verified {formatDate(p.verifiedAt)}</span>
                                </div>
                              )}
                              {p.status === 'Failed' && p.failureReason && (
                                <div style={{ fontSize: '11px', color: 'var(--status-danger)', marginTop: '2px' }}>
                                  {p.failureReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              {p.status === 'Paid' ? (
                                <div style={{ fontSize: '11.5px', color: 'var(--veg-700)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={12} />
                                  <span>Cash Collected</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '600' }}>
                                  Collect on Delivery
                                </span>
                              )}
                              {p.codCollectedAt && (
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                  At: {formatDate(p.codCollectedAt)}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            {isPendingCod && (
                              <button
                                onClick={() => setSelectedPaymentForCod(p)}
                                className="btn btn-primary"
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  backgroundColor: 'var(--veg-700)',
                                  borderColor: 'var(--veg-800)',
                                }}
                              >
                                Mark Collected
                              </button>
                            )}

                            {orderId && (
                              <Link
                                to={`/admin/orders/${orderId}`}
                                className="btn btn-outline"
                                style={{
                                  padding: '6px 10px',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Eye size={13} />
                                <span>Order</span>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-card)',
            }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total payments)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COD Collection Confirmation Modal */}
      {selectedPaymentForCod && (
        <div style={{
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
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--veg-800)' }}>
                <Banknote size={22} color="var(--veg-700)" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                  Confirm Cash Collection
                </h3>
              </div>
              <button
                onClick={() => setSelectedPaymentForCod(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Confirm that the delivery partner has received the exact cash amount for this tiffin order.
            </p>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              marginBottom: '18px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Order:</span>
                <strong>{selectedPaymentForCod.order?.orderNumber || '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                <strong>{selectedPaymentForCod.user?.name || selectedPaymentForCod.order?.customerSnapshot?.name || 'Customer'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cash Collected:</span>
                <strong style={{ color: 'var(--veg-800)', fontSize: '16px' }}>
                  {formatCurrency(selectedPaymentForCod.amount)}
                </strong>
              </div>
            </div>

            {collectError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--status-danger)',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                marginBottom: '14px',
              }}>
                {collectError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedPaymentForCod(null)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCollecting}
                onClick={handleConfirmCodCollection}
                className="btn btn-primary"
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  backgroundColor: 'var(--veg-700)',
                  borderColor: 'var(--veg-800)',
                }}
              >
                {isCollecting ? 'Recording...' : 'Confirm Cash Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
