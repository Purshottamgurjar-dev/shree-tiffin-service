import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  ChefHat, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  XCircle,
  Clock,
  Bike
} from 'lucide-react';
import { getMyOrders, cancelMyOrder } from '../services/orderService';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import PaymentBadge from '../components/payment/PaymentBadge';
import useOrderPolling from '../hooks/useOrderPolling';
import { formatCurrency, formatDate } from '../utils';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await getMyOrders();
      if (res.success && Array.isArray(res.orders)) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Phase 12: Real-time periodic order refresh while user has active orders
  const hasActiveOrders = orders.some((o) =>
    ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.orderStatus)
  );
  useOrderPolling(fetchOrders, hasActiveOrders, 10000);

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalOrder) return;

    setActionLoadingId(cancelModalOrder._id);
    setCancelError('');

    try {
      const res = await cancelMyOrder(cancelModalOrder._id, cancelReason);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === res.order._id ? res.order : o))
        );
        setCancelModalOrder(null);
        setCancelReason('');
      } else {
        setCancelError(res.message || 'Failed to cancel order.');
      }
    } catch (err) {
      setCancelError(err.message || 'Could not cancel order. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter orders by category tab
  const activeOrders = orders.filter((o) =>
    ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery'].includes(o.orderStatus)
  );
  const completedOrders = orders.filter((o) => o.orderStatus === 'Delivered');
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'Cancelled');

  let filteredOrders = orders;
  if (activeTab === 'ACTIVE') filteredOrders = activeOrders;
  else if (activeTab === 'COMPLETED') filteredOrders = completedOrders;
  else if (activeTab === 'CANCELLED') filteredOrders = cancelledOrders;

  if (loading) {
    return (
      <div style={{ padding: '60px 0', minHeight: '75vh', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <RefreshCw size={36} className="animate-spin" color="var(--primary-600)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Loading your tiffin orders...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bottom-nav-pad" style={{ padding: '40px 0 80px', minHeight: '80vh', backgroundColor: 'var(--bg-subtle)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
              My Tiffin Orders
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Live tracking and complete order history for your homestyle meals.
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Category Tabs (Phase 11) */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
        }}>
          {[
            { key: 'ALL', label: `All Orders (${orders.length})` },
            { key: 'ACTIVE', label: `Active (${activeOrders.length})` },
            { key: 'COMPLETED', label: `Completed (${completedOrders.length})` },
            { key: 'CANCELLED', label: `Cancelled (${cancelledOrders.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: activeTab === tab.key ? 'var(--primary-700)' : 'var(--border-color)',
                backgroundColor: activeTab === tab.key ? 'var(--primary-700)' : '#ffffff',
                color: activeTab === tab.key ? '#ffffff' : 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Error Notice */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--status-danger)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={fetchOrders} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <ShoppingBag size={36} />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {activeTab === 'ACTIVE'
                ? 'No Active Orders Right Now'
                : activeTab === 'COMPLETED'
                ? 'No Completed Orders Yet'
                : activeTab === 'CANCELLED'
                ? 'No Cancelled Orders'
                : 'No Orders Placed Yet'}
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              {activeTab === 'ACTIVE'
                ? 'You do not have any orders being prepared or out for delivery. Hungry? Order fresh hot thalis!'
                : 'Enjoy wholesome, 100% vegetarian Indian thalis delivered hot to your doorstep daily.'}
            </p>
            <Link to="/menu" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
              <ChefHat size={18} />
              <span>Explore Homestyle Menu</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredOrders.map((order) => {
              const isPending = order.orderStatus === 'Pending';
              const itemsCount = order.totalItems || order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

              return (
                <div
                  key={order._id}
                  className="card"
                  style={{
                    padding: '22px 24px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* Order Card Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '16px',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                          {order.orderNumber}
                        </span>
                        <OrderStatusBadge status={order.orderStatus} />
                        <PaymentBadge method={order.paymentMethod || 'COD'} status={order.paymentStatus || 'Pending'} size="small" />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
                        <Calendar size={13} />
                        <span>Placed on {formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>
                        Total Amount
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-900)' }}>
                        {formatCurrency(order.total || order.subtotal)}
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}>
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'var(--bg-subtle)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px',
                          }}
                        >
                          <span className="veg-indicator" title="100% Pure Vegetarian" />
                          <span style={{ fontWeight: '700', color: 'var(--primary-700)' }}>
                            {item.quantity}×
                          </span>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                            {item.nameSnapshot}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address Summary */}
                  {order.deliveryAddressSnapshot && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      marginBottom: '18px',
                    }}>
                      <MapPin size={15} color="var(--primary-600)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Delivering to: <strong>{order.deliveryAddressSnapshot.addressLine1}</strong>
                        {order.deliveryAddressSnapshot.city ? `, ${order.deliveryAddressSnapshot.city}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}>
                    <div>
                      {isPending && (
                        <button
                          onClick={() => setCancelModalOrder(order)}
                          className="btn btn-outline"
                          style={{
                            fontSize: '12.5px',
                            padding: '6px 12px',
                            color: 'var(--status-danger)',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                          }}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>

                    <Link
                      to={`/orders/${order._id}`}
                      className="btn btn-primary"
                      style={{
                        padding: '8px 18px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Track Order</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Cancellation Modal */}
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Cancel Order {cancelModalOrder.orderNumber}?
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Pending orders can be cancelled immediately without penalty.
            </p>

            <form onSubmit={handleCancelSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Placed by mistake, changing delivery address..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                  }}
                />
              </div>

              {cancelError && (
                <div style={{
                  color: 'var(--status-danger)',
                  fontSize: '12.5px',
                  marginBottom: '12px',
                }}>
                  {cancelError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === cancelModalOrder._id}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    backgroundColor: 'var(--status-danger)',
                    borderColor: 'var(--status-danger)',
                  }}
                >
                  {actionLoadingId === cancelModalOrder._id ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
