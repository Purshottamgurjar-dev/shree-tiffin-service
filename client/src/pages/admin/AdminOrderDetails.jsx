import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChefHat, 
  Bike, 
  ShieldCheck, 
  XCircle,
  FileText,
  CreditCard,
  Banknote,
  Lock,
  MessageSquare,
  Navigation
} from 'lucide-react';
import { getOrderById, updateOrderStatus, cancelOrderByOwner } from '../../services/orderService';
import paymentService from '../../services/paymentService';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import OrderTimeline from '../../components/orders/OrderTimeline';
import OrderMapPreview from '../../components/orders/OrderMapPreview';
import PaymentBadge from '../../components/payment/PaymentBadge';
import useOrderPolling from '../../hooks/useOrderPolling';
import { formatCurrency, formatDate } from '../../utils';

const VALID_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Preparing', 'Cancelled'],
  Preparing: ['Out for Delivery'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

export default function AdminOrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNextStatus, setSelectedNextStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });
  const [isCollectingCod, setIsCollectingCod] = useState(false);
  const [codMessage, setCodMessage] = useState({ type: '', text: '' });

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getOrderById(id);
      if (res.success && res.order) {
        setOrder(res.order);
        const allowed = VALID_TRANSITIONS[res.order.orderStatus] || [];
        setSelectedNextStatus(allowed[0] || '');
      } else {
        setError(res.message || 'Order not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Phase 12: Real-time periodic order refresh while active
  const isOrderActive = order && !['Delivered', 'Cancelled'].includes(order.orderStatus);
  useOrderPolling(fetchOrder, isOrderActive, 10000);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedNextStatus) return;

    setIsUpdatingStatus(true);
    setUpdateMessage({ type: '', text: '' });

    try {
      const res = await updateOrderStatus(id, selectedNextStatus, statusNote);
      if (res.success && res.order) {
        setOrder(res.order);
        const allowed = VALID_TRANSITIONS[res.order.orderStatus] || [];
        setSelectedNextStatus(allowed[0] || '');
        setStatusNote('');
        setUpdateMessage({ type: 'success', text: `Status updated to "${res.order.orderStatus}" successfully!` });
      } else {
        setUpdateMessage({ type: 'error', text: res.message || 'Failed to update status.' });
      }
    } catch (err) {
      setUpdateMessage({ type: 'error', text: err.message || 'Error updating order status.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCollectCod = async () => {
    setIsCollectingCod(true);
    setCodMessage({ type: '', text: '' });
    try {
      const paymentTargetId = order.payment?._id || order.payment || order._id;
      const res = await paymentService.collectCodPayment(paymentTargetId);
      if (res.success) {
        setCodMessage({
          type: 'success',
          text: `Cash on Delivery payment of ₹${order.total} marked as collected successfully!`,
        });
        fetchOrder();
      } else {
        setCodMessage({
          type: 'error',
          text: res.message || 'Failed to collect payment.',
        });
      }
    } catch (err) {
      setCodMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error collecting Cash on Delivery payment.',
      });
    } finally {
      setIsCollectingCod(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', minHeight: '80vh', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <RefreshCw size={36} className="animate-spin" color="var(--primary-600)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Loading order details...</h3>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ padding: '60px 0', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div className="card" style={{ padding: '40px 24px' }}>
            <AlertCircle size={44} color="var(--status-danger)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
              Order Not Found
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              {error || 'Unable to retrieve kitchen order.'}
            </p>
            <Link to="/admin/orders" className="btn btn-primary" style={{ display: 'inline-flex', padding: '10px 20px' }}>
              <ArrowLeft size={16} />
              <span>Back to Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[order.orderStatus] || [];
  const address = order.deliveryAddressSnapshot || {};
  const customer = order.customerSnapshot || {};

  return (
    <div style={{ padding: '36px 0 80px', minHeight: '85vh', backgroundColor: 'var(--bg-subtle)' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        {/* Navigation Breadcrumbs */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/admin/orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Order Management</span>
          </Link>
        </div>

        {/* Top Header Card */}
        <div className="card" style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.orderStatus} size="large" />
              <PaymentBadge method={order.paymentMethod || 'COD'} status={order.paymentStatus || 'Pending'} size="medium" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
              <Calendar size={14} />
              <span>Received on {formatDate(order.createdAt)}</span>
              <span>•</span>
              <span>Payment Mode: <strong>{order.paymentMethod === 'ONLINE' ? 'Razorpay Online' : 'Cash on Delivery (COD)'}</strong></span>
            </div>
          </div>

          <button
            onClick={fetchOrder}
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>Refresh Order</span>
          </button>
        </div>

        {/* Live Order Tracker */}
        <OrderTimeline order={order} />

        {/* Status Transition Control Card */}
        <div className="card" style={{
          padding: '22px 24px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          border: '1px solid var(--border-color)',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-primary)' }}>
            Kitchen Status Workflow Control
          </h3>

          {updateMessage.text && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '14px',
              fontSize: '13px',
              backgroundColor: updateMessage.type === 'success' ? 'var(--veg-50)' : 'rgba(239, 68, 68, 0.1)',
              color: updateMessage.type === 'success' ? 'var(--veg-800)' : 'var(--status-danger)',
              border: `1px solid ${updateMessage.type === 'success' ? 'var(--veg-200)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}>
              {updateMessage.text}
            </div>
          )}

          {allowedTransitions.length > 0 ? (
            <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
              <div style={{ flex: '0 1 200px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                  Next Workflow State
                </label>
                <select
                  value={selectedNextStatus}
                  onChange={(e) => setSelectedNextStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13.5px',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  {allowedTransitions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 320px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                  Kitchen Note / Dispatch Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Assigned to rider Rajesh, freshly packed"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13.5px',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingStatus || !selectedNextStatus}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontSize: '13.5px' }}
              >
                {isUpdatingStatus ? 'Updating...' : 'Advance Order State'}
              </button>
            </form>
          ) : (
            <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              This order has reached its final state (<strong>{order.orderStatus}</strong>). No further state transitions are permitted.
            </div>
          )}
        </div>

        {/* Two-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }} className="order-details-grid">
          {/* Left: Items breakdown & Status History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Ordered Items Card */}
            <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px' }}>
                Meals in this Order ({order.totalItems})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.imageSnapshot ? (
                        <img
                          src={item.imageSnapshot}
                          alt={item.nameSnapshot}
                          style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          🍲
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {item.nameSnapshot}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          {formatCurrency(item.priceSnapshot)} × {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {formatCurrency(item.itemTotal || item.priceSnapshot * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div style={{
                marginTop: '18px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: '800',
              }}>
                <span>Total Bill</span>
                <span style={{ color: 'var(--primary-900)' }}>{formatCurrency(order.total || order.subtotal)}</span>
              </div>
            </div>

            {/* Audit Trail Status History */}
            <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FileText size={18} color="var(--primary-600)" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                  Audit Trail & Status History
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {order.statusHistory?.map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {h.status}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '11.5px' }}>
                        {formatDate(h.changedAt)}
                      </span>
                    </div>
                    {h.note && (
                      <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{h.note}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Payment Settlement, Customer Info, Address & Map */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Payment & Settlement Card */}
            <div className="card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {order.paymentMethod === 'ONLINE' ? (
                    <CreditCard size={18} color="var(--primary-600)" />
                  ) : (
                    <Banknote size={18} color="var(--veg-700)" />
                  )}
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Payment & Settlement</h3>
                </div>
                <PaymentBadge method={order.paymentMethod || 'COD'} status={order.paymentStatus || 'Pending'} />
              </div>

              {codMessage.text && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '14px',
                  fontSize: '12.5px',
                  backgroundColor: codMessage.type === 'success' ? 'var(--veg-50)' : 'rgba(239, 68, 68, 0.1)',
                  color: codMessage.type === 'success' ? 'var(--veg-800)' : 'var(--status-danger)',
                  border: `1px solid ${codMessage.type === 'success' ? 'var(--veg-200)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}>
                  {codMessage.text}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Method:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {order.paymentMethod === 'ONLINE' ? 'Razorpay Online' : 'Cash on Delivery (COD)'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Bill Total:</span>
                  <strong style={{ color: 'var(--primary-900)', fontSize: '15px' }}>
                    {formatCurrency(order.total)}
                  </strong>
                </div>
                {order.payment?.gatewayPaymentId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Razorpay Payment ID:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {order.payment.gatewayPaymentId}
                    </span>
                  </div>
                )}
                {order.payment?.gatewayOrderId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Gateway Order ID:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {order.payment.gatewayOrderId}
                    </span>
                  </div>
                )}
              </div>

              {/* Action for Owner: Mark COD as Collected */}
              {order.paymentMethod === 'COD' && order.paymentStatus !== 'Paid' && order.orderStatus !== 'Cancelled' && (
                <div style={{ paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                  <button
                    onClick={handleCollectCod}
                    disabled={isCollectingCod}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--veg-700)',
                      borderColor: 'var(--veg-800)',
                    }}
                  >
                    {isCollectingCod ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Recording Collection...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Mark COD as Collected ({formatCurrency(order.total)})</span>
                      </>
                    )}
                  </button>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '6px' }}>
                    Click when delivery rider hands over cash collected from customer.
                  </div>
                </div>
              )}

              {order.paymentStatus === 'Paid' && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--veg-50)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--veg-800)',
                  fontWeight: '600',
                }}>
                  <CheckCircle2 size={16} color="var(--veg-700)" />
                  <span>Settlement Complete — Payment Received & Verified</span>
                </div>
              )}
            </div>

            {/* Customer Details Card */}
            <div className="card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <User size={18} color="var(--primary-600)" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Customer Info</h3>
              </div>
              <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {customer.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <Phone size={13} />
                <a href={`tel:${customer.phone}`} style={{ color: 'var(--primary-700)', textDecoration: 'none' }}>
                  {customer.phone}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Mail size={13} />
                <a href={`mailto:${customer.email}`} style={{ color: 'var(--primary-700)', textDecoration: 'none' }}>
                  {customer.email}
                </a>
              </div>

              {/* Mobile-friendly Call & WhatsApp Actions */}
              {customer.phone && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                  <a
                    href={`tel:${customer.phone.replace(/\D/g, '')}`}
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: '#2563eb',
                    }}
                  >
                    <Phone size={14} />
                    <span>Call Customer</span>
                  </a>

                  <a
                    href={`https://wa.me/91${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      order.orderStatus === 'Confirmed'
                        ? `Hello ${customer.name || 'Customer'}, your Shree Tiffin Service order ${order.orderNumber} has been confirmed. Thank you!`
                        : order.orderStatus === 'Out for Delivery'
                        ? `Hello ${customer.name || 'Customer'}, your Shree Tiffin Service order ${order.orderNumber} is out for delivery.`
                        : order.orderStatus === 'Delivered'
                        ? `Hello ${customer.name || 'Customer'}, your Shree Tiffin Service order ${order.orderNumber} has been delivered. Thank you for choosing Shree Tiffin Service.`
                        : `Hello ${customer.name || 'Customer'}, regarding your Shree Tiffin Service order ${order.orderNumber}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '12.5px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: '#16a34a',
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Delivery Destination & GPS Map Card */}
            <div className="card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <MapPin size={18} color="var(--primary-600)" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Delivery Address</h3>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-800)',
                  fontWeight: '700',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}>
                  {address.label || 'Home'}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Recipient: {address.fullName} ({address.phone})
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                  {address.landmark ? ` (Near ${address.landmark})` : ''}
                  <br />
                  {address.city}, {address.state} — {address.postalCode}
                </div>
                {address.deliveryInstructions && (
                  <div style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                  }}>
                    <strong>Delivery Note:</strong> "{address.deliveryInstructions}"
                  </div>
                )}
              </div>

              {/* Map Preview */}
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Customer GPS Pin & Navigation
                </div>
                {address.latitude && address.longitude ? (
                  <div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '12.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: '#0369a1',
                        borderColor: '#bae6fd',
                        textDecoration: 'none',
                        marginBottom: '12px',
                      }}
                    >
                      <Navigation size={14} />
                      <span>Open Directions (Google Maps)</span>
                    </a>
                    <OrderMapPreview
                      latitude={address.latitude}
                      longitude={address.longitude}
                      label={`Delivery: ${order.orderNumber}`}
                      addressText={`${address.addressLine1}, ${address.city}`}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px', textAlign: 'center' }}>
                    No GPS coordinates available for this delivery address.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
