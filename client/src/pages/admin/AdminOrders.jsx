import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle, 
  ChefHat, 
  Bike, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, cancelOrderByOwner } from '../../services/orderService';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import PaymentBadge from '../../components/payment/PaymentBadge';
import useOrderPolling from '../../hooks/useOrderPolling';
import { formatCurrency, formatDate } from '../../utils';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Cancel Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;
      if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
      if (dateRange) params.dateRange = dateRange;
      if (sortOption) params.sort = sortOption;

      const res = await getAllOrders(params);
      if (res.success) {
        setOrders(res.orders || []);
        if (res.stats) setStats(res.stats);
        if (res.pagination) {
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages);
          setTotalCount(res.pagination.total);
        }
      } else {
        setError(res.message || 'Failed to fetch orders.');
      }
    } catch (err) {
      setError(err.message || 'Server error loading orders.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 12: Real-time periodic polling with automatic cleanup
  useOrderPolling(fetchOrders, true, 12000);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentMethodFilter, paymentStatusFilter, dateRange, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  // Quick Next-Step Transition
  const handleQuickTransition = async (order) => {
    let nextStatus = '';
    let note = '';

    if (order.orderStatus === 'Pending') {
      nextStatus = 'Confirmed';
      note = 'Order confirmed by kitchen manager';
    } else if (order.orderStatus === 'Confirmed') {
      nextStatus = 'Preparing';
      note = 'Cook started preparing fresh meal';
    } else if (order.orderStatus === 'Preparing') {
      nextStatus = 'Out for Delivery';
      note = 'Handed to delivery rider in insulated container';
    } else if (order.orderStatus === 'Out for Delivery') {
      nextStatus = 'Delivered';
      note = 'Order delivered successfully to customer';
    }

    if (!nextStatus) return;

    setActionLoadingId(order._id);
    try {
      const res = await updateOrderStatus(order._id, nextStatus, note);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === res.order._id ? res.order : o))
        );
        fetchOrders(); // Refresh stats
      }
    } catch (err) {
      alert(err.message || 'Failed to advance order status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Owner Cancel Order
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalOrder) return;

    setActionLoadingId(cancelModalOrder._id);
    setCancelError('');
    try {
      const res = await cancelOrderByOwner(
        cancelModalOrder._id,
        cancelReason || 'Cancelled by kitchen manager'
      );
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === res.order._id ? res.order : o))
        );
        setCancelModalOrder(null);
        setCancelReason('');
        fetchOrders();
      } else {
        setCancelError(res.message || 'Failed to cancel order.');
      }
    } catch (err) {
      setCancelError(err.message || 'Error cancelling order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ padding: '36px 0 80px', minHeight: '85vh', backgroundColor: 'var(--bg-subtle)' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {/* Navigation & Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Link to="/admin/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft size={14} />
                <span>Dashboard</span>
              </Link>
              <span style={{ color: 'var(--text-tertiary)' }}>/</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary-700)' }}>Orders</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Kitchen Order Management
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/admin/meals" className="btn btn-outline" style={{ fontSize: '13px', padding: '8px 14px' }}>
              <ChefHat size={14} />
              <span>Menu Items</span>
            </Link>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}>
          <div
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className="card"
            style={{
              padding: '14px',
              cursor: 'pointer',
              border: !statusFilter ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              All Orders
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.total}
            </div>
          </div>

          <div
            onClick={() => { setStatusFilter('Pending'); setPage(1); }}
            className="card"
            style={{
              padding: '14px',
              cursor: 'pointer',
              border: statusFilter === 'Pending' ? '2px solid #b45309' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'Pending' ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-card)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>
              Pending
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
              {stats.pending}
            </div>
          </div>

          <div
            onClick={() => { setStatusFilter('Confirmed'); setPage(1); }}
            className="card"
            style={{
              padding: '14px',
              cursor: 'pointer',
              border: statusFilter === 'Confirmed' ? '2px solid #1d4ed8' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'Confirmed' ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-card)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase' }}>
              Confirmed
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '4px' }}>
              {stats.confirmed}
            </div>
          </div>

          <div
            onClick={() => { setStatusFilter('Preparing'); setPage(1); }}
            className="card"
            style={{
              padding: '14px',
              cursor: 'pointer',
              border: statusFilter === 'Preparing' ? '2px solid #7e22ce' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'Preparing' ? 'rgba(126, 34, 206, 0.05)' : 'var(--bg-card)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#7e22ce', textTransform: 'uppercase' }}>
              Preparing
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#7e22ce', marginTop: '4px' }}>
              {stats.preparing}
            </div>
          </div>

          <div
            onClick={() => { setStatusFilter('Out for Delivery'); setPage(1); }}
            className="card"
            style={{
              padding: '14px',
              cursor: 'pointer',
              border: statusFilter === 'Out for Delivery' ? '2px solid #c2410c' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'Out for Delivery' ? 'rgba(234, 88, 12, 0.05)' : 'var(--bg-card)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#c2410c', textTransform: 'uppercase' }}>
              Out for Delivery
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#c2410c', marginTop: '4px' }}>
              {stats.outForDelivery}
            </div>
          </div>

          <div
            onClick={() => { setStatusFilter('Delivered'); setPage(1); }}
            className="card"
            style={{
              padding: '14px',
              cursor: 'pointer',
              border: statusFilter === 'Delivered' ? '2px solid #15803d' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'Delivered' ? 'rgba(22, 163, 74, 0.05)' : 'var(--bg-card)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', textTransform: 'uppercase' }}>
              Delivered
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>
              {stats.delivered}
            </div>
          </div>

          <div
            onClick={() => { setStatusFilter('Cancelled'); setPage(1); }}
            className="card"
            style={{
              padding: '14px',
              cursor: 'pointer',
              border: statusFilter === 'Cancelled' ? '2px solid #b91c1c' : '1px solid var(--border-color)',
              backgroundColor: statusFilter === 'Cancelled' ? 'rgba(220, 38, 38, 0.05)' : 'var(--bg-card)',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase' }}>
              Cancelled
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#b91c1c', marginTop: '4px' }}>
              {stats.cancelled}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {/* Search input */}
            <div style={{ position: 'relative', flex: '1 1 240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search by Order #, Customer Name, Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                }}
              />
            </div>

            {/* Status Dropdown */}
            <div style={{ flex: '0 1 150px' }}>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div style={{ flex: '0 1 140px' }}>
              <select
                value={paymentMethodFilter}
                onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <option value="">All Methods</option>
                <option value="COD">COD</option>
                <option value="ONLINE">Online (Razorpay)</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div style={{ flex: '0 1 140px' }}>
              <select
                value={paymentStatusFilter}
                onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <option value="">Payment Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            {/* Date Range Dropdown */}
            <div style={{ flex: '0 1 130px' }}>
              <select
                value={dateRange}
                onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
              </select>
            </div>

            {/* Sort Order */}
            <div style={{ flex: '0 1 130px' }}>
              <select
                value={sortOption}
                onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '13.5px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '13.5px' }}>
              <span>Search</span>
            </button>

            {(search || statusFilter || paymentMethodFilter || paymentStatusFilter || dateRange || sortOption !== 'newest') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPaymentMethodFilter('');
                  setPaymentStatusFilter('');
                  setDateRange('');
                  setSortOption('newest');
                  setPage(1);
                }}
                className="btn btn-outline"
                style={{ padding: '9px 14px', fontSize: '13px' }}
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--status-danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '13.5px',
          }}>
            {error}
          </div>
        )}

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: 'var(--radius-lg)' }}>
            <ShoppingBag size={44} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px' }}>No Orders Found</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              No tiffin orders matched the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-secondary)' }}>Order #</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-secondary)' }}>Customer</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-secondary)' }}>Items</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-secondary)' }}>Total</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-secondary)' }}>Date</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isDeliveredOrCancelled = ['Delivered', 'Cancelled'].includes(order.orderStatus);
                    let actionLabel = '';
                    let actionIcon = null;

                    if (order.orderStatus === 'Pending') {
                      actionLabel = 'Accept';
                      actionIcon = <CheckCircle size={13} />;
                    } else if (order.orderStatus === 'Confirmed') {
                      actionLabel = 'Prepare';
                      actionIcon = <ChefHat size={13} />;
                    } else if (order.orderStatus === 'Preparing') {
                      actionLabel = 'Dispatch';
                      actionIcon = <Bike size={13} />;
                    } else if (order.orderStatus === 'Out for Delivery') {
                      actionLabel = 'Deliver';
                      actionIcon = <CheckCircle2 size={13} />;
                    }

                    return (
                      <tr key={order._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 18px', fontWeight: '800' }}>
                          <Link to={`/admin/orders/${order._id}`} style={{ color: 'var(--primary-700)', textDecoration: 'none' }}>
                            {order.orderNumber}
                          </Link>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {order.customerSnapshot?.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            📞 {order.customerSnapshot?.phone}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text-primary)', maxWidth: '240px' }}>
                            {order.items?.map((i) => `${i.quantity}x ${i.nameSnapshot}`).join(', ')}
                          </div>
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--primary-900)' }}>
                          {formatCurrency(order.total || order.subtotal)}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <OrderStatusBadge status={order.orderStatus} size="small" />
                        </td>

                        <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                          {formatDate(order.createdAt)}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            {/* Quick Next Transition Button */}
                            {!isDeliveredOrCancelled && actionLabel && (
                              <button
                                onClick={() => handleQuickTransition(order)}
                                disabled={actionLoadingId === order._id}
                                className="btn btn-primary"
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {actionIcon}
                                <span>{actionLabel}</span>
                              </button>
                            )}

                            {/* Owner Cancel Option */}
                            {!isDeliveredOrCancelled && (
                              <button
                                onClick={() => setCancelModalOrder(order)}
                                className="btn btn-outline"
                                style={{
                                  padding: '5px 8px',
                                  fontSize: '12px',
                                  color: 'var(--status-danger)',
                                  borderColor: 'rgba(239, 68, 68, 0.3)',
                                }}
                              >
                                Cancel
                              </button>
                            )}

                            {/* Customer Call & WhatsApp Actions */}
                            {order.customerSnapshot?.phone && (
                              <>
                                <a
                                  href={`tel:${order.customerSnapshot.phone.replace(/\D/g, '')}`}
                                  title="Call Customer"
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '12px', color: '#2563eb' }}
                                >
                                  <Phone size={13} />
                                </a>
                                <a
                                  href={`https://wa.me/91${order.customerSnapshot.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customerSnapshot?.name || 'Customer'}, regarding your Shree Tiffin Service order ${order.orderNumber}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="WhatsApp Customer"
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 8px', fontSize: '12px', color: '#16a34a' }}
                                >
                                  <MessageSquare size={13} />
                                </a>
                              </>
                            )}

                            <Link
                              to={`/admin/orders/${order._id}`}
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{
              padding: '14px 20px',
              backgroundColor: 'var(--bg-subtle)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              <div>
                Showing <strong>{orders.length}</strong> of <strong>{totalCount}</strong> orders (Page {page} of {totalPages})
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn btn-outline"
                  style={{ padding: '5px 10px', fontSize: '12px', opacity: page <= 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn btn-outline"
                  style={{ padding: '5px 10px', fontSize: '12px', opacity: page >= totalPages ? 0.5 : 1 }}
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Owner Cancellation Modal */}
      {cancelModalOrder && (
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
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger)', marginBottom: '12px' }}>
              <XCircle size={22} />
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Cancel Order {cancelModalOrder.orderNumber}?
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Cancelling will halt meal preparation and notify the customer audit log.
            </p>

            {cancelError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--status-danger)',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                marginBottom: '14px',
              }}>
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                  Kitchen Cancellation Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen ingredient shortage, kitchen closed"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13.5px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => { setCancelModalOrder(null); setCancelError(''); }}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '13.5px' }}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === cancelModalOrder._id}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13.5px',
                    backgroundColor: 'var(--status-danger)',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {actionLoadingId === cancelModalOrder._id ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
