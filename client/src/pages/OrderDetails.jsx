import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  ChefHat, 
  XCircle,
  HelpCircle,
  ShieldCheck,
  FileText,
  CreditCard,
  Banknote,
  Lock
} from 'lucide-react';
import { getMyOrderById, cancelMyOrder } from '../services/orderService';
import paymentService from '../services/paymentService';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import OrderTimeline from '../components/orders/OrderTimeline';
import OrderMapPreview from '../components/orders/OrderMapPreview';
import PaymentBadge from '../components/payment/PaymentBadge';
import useOrderPolling from '../hooks/useOrderPolling';
import { formatCurrency, formatDate } from '../utils';
import SEO from '../components/SEO';

export default function OrderDetails() {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [justPlaced, setJustPlaced] = useState(Boolean(location.state?.justPlaced));
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentActionMessage, setPaymentActionMessage] = useState(() => {
    if (location.state?.failureReason) {
      return { type: 'error', text: `Online payment failed: ${location.state.failureReason}. You can retry or switch to Cash on Delivery.` };
    }
    if (location.state?.message) {
      return { type: 'warning', text: location.state.message };
    }
    return { type: '', text: '' };
  });

  const fetchOrder = async () => {
    try {
      const res = await getMyOrderById(id);
      if (res.success && res.order) {
        setOrder(res.order);
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

  const handleRetryOnlinePayment = async () => {
    setIsProcessingPayment(true);
    setPaymentActionMessage({ type: '', text: '' });

    try {
      const isLoaded = await paymentService.loadRazorpayScript();
      const prepRes = await paymentService.createOnlineOrder(order._id);

      if (!prepRes.success || !prepRes.payment) {
        setPaymentActionMessage({
          type: 'error',
          text: prepRes.message || 'Unable to initialize online payment.',
        });
        setIsProcessingPayment(false);
        return;
      }

      const pInfo = prepRes.payment;
      if (!isLoaded || !window.Razorpay) {
        setPaymentActionMessage({
          type: 'error',
          text: 'Payment gateway script failed to load. Please check your internet connection.',
        });
        setIsProcessingPayment(false);
        return;
      }

      const cleanPhone = (order.deliveryAddressSnapshot?.phone || '').replace(/\D/g, '').slice(-10);
      const razorpayKey = pInfo.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '';

      const options = paymentService.buildRazorpayOptions({
        keyId: razorpayKey,
        amountInPaise: pInfo.amount,
        currency: pInfo.currency || 'INR',
        gatewayOrderId: pInfo.gatewayOrderId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerName: order.deliveryAddressSnapshot?.fullName || '',
        customerEmail: '',
        customerPhone: cleanPhone,
        deliveryAddress: `${order.deliveryAddressSnapshot?.addressLine1 || ''}, ${order.deliveryAddressSnapshot?.city || ''}`,
        onSuccess: async function (response) {
          try {
            const verifyRes = await paymentService.verifyOnlinePayment({
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setPaymentActionMessage({
                type: 'success',
                text: 'Online payment completed and verified successfully! Your order is being freshly prepared.',
              });
              fetchOrder();
            } else {
              setPaymentActionMessage({
                type: 'error',
                text: verifyRes.message || 'Payment verification failed.',
              });
              fetchOrder();
            }
          } catch (err) {
            setPaymentActionMessage({
              type: 'error',
              text: err.response?.data?.message || err.message || 'Server verification error.',
            });
            fetchOrder();
          } finally {
            setIsProcessingPayment(false);
          }
        },
        onDismiss: async function () {
          setIsProcessingPayment(false);
          setPaymentActionMessage({
            type: 'warning',
            text: 'Payment cancelled. Your order has not been charged. You can retry or switch to Cash on Delivery.',
          });
          try {
            await paymentService.recordPaymentFailure({
              orderId: order._id,
              gatewayOrderId: pInfo.gatewayOrderId,
              reason: 'Customer closed payment modal',
            });
            fetchOrder();
          } catch (e) {
            // non-critical
          }
        },
      });

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response) {
        await paymentService.recordPaymentFailure({
          orderId: order._id,
          gatewayOrderId: pInfo.gatewayOrderId,
          reason: response.error?.description || 'Payment failed',
        });
        setPaymentActionMessage({
          type: 'error',
          text: response.error?.description || 'Payment failed. Please retry or switch to Cash on Delivery.',
        });
        setIsProcessingPayment(false);
        fetchOrder();
      });
      rzp.open();
    } catch (err) {
      setPaymentActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error processing online payment.',
      });
      setIsProcessingPayment(false);
    }
  };

  const handleSwitchToCod = async () => {
    setIsProcessingPayment(true);
    setPaymentActionMessage({ type: '', text: '' });

    try {
      const res = await paymentService.selectCodPayment(order._id);
      if (res.success) {
        setPaymentActionMessage({
          type: 'success',
          text: 'Payment method successfully switched to Cash on Delivery (COD).',
        });
        fetchOrder();
      } else {
        setPaymentActionMessage({
          type: 'error',
          text: res.message || 'Could not switch to COD.',
        });
      }
    } catch (err) {
      setPaymentActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error switching to Cash on Delivery.',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    setIsCancelling(true);
    setCancelError('');

    try {
      const res = await cancelMyOrder(id, cancelReason);
      if (res.success && res.order) {
        setOrder(res.order);
        setShowCancelModal(false);
        setCancelReason('');
      } else {
        setCancelError(res.message || 'Failed to cancel order.');
      }
    } catch (err) {
      setCancelError(err.message || 'Error cancelling order.');
    } finally {
      setIsCancelling(false);
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
              {error || 'The requested tiffin order could not be located.'}
            </p>
            <Link to="/orders" className="btn btn-primary" style={{ display: 'inline-flex', padding: '10px 20px' }}>
              <ArrowLeft size={16} />
              <span>Back to My Orders</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPending = order.orderStatus === 'Pending';
  const address = order.deliveryAddressSnapshot || {};

  return (
    <div className="page-bottom-nav-pad" style={{ padding: '36px 0 80px', minHeight: '85vh', backgroundColor: 'var(--bg-subtle)' }}>
      <SEO title={`Order ${order.orderNumber || ''}`} noindex={true} />
      <div className="container" style={{ maxWidth: '1080px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/orders"
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
            <span>Back to All Orders</span>
          </Link>
        </div>

        {/* Just Placed Success Banner */}
        {justPlaced && (
          <div style={{
            backgroundColor: 'var(--veg-50)',
            border: '1px solid var(--veg-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={24} color="var(--veg-700)" />
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--veg-900)', margin: '0 0 2px 0' }}>
                  Order Successfully Placed!
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--veg-800)', margin: 0 }}>
                  Thank you! Shree Kitchen has received your order and started preparations.
                </p>
              </div>
            </div>
            <button
              onClick={() => setJustPlaced(false)}
              className="btn btn-outline"
              style={{ fontSize: '12px', padding: '4px 10px', borderColor: 'var(--veg-300)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Order Header Summary */}
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
              <span>Placed on {formatDate(order.createdAt)}</span>
              <span>•</span>
              <span>Payment Mode: <strong>{order.paymentMethod === 'ONLINE' ? 'Razorpay Online' : 'Cash on Delivery (COD)'}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={fetchOrder}
              className="btn btn-outline"
              style={{ fontSize: '13px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>Refresh Status</span>
            </button>

            {isPending && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-outline"
                style={{
                  fontSize: '13px',
                  padding: '8px 14px',
                  color: 'var(--status-danger)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Live Order Tracker Timeline */}
        <OrderTimeline order={order} />

        {/* Two-Column Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start',
        }} className="order-details-grid">
          {/* Left: Items Breakdown & Bill Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Items Card */}
            <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <ChefHat size={20} color="var(--primary-600)" />
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
                  Tiffin Items Ordered ({order.totalItems || order.items?.reduce((s, i) => s + i.quantity, 0)})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                      <img
                        src={getMealImage(item.imageSnapshot)}
                        alt={item.nameSnapshot}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          flexShrink: 0
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="veg-indicator" title="100% Pure Vegetarian" />
                          <span>{item.nameSnapshot}</span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
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
                marginTop: '20px',
                paddingTop: '18px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Items Subtotal</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(order.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--veg-700)' }}>
                  <span>Stainless Tiffin Delivery</span>
                  <span style={{ fontWeight: '700' }}>FREE</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px dashed var(--border-color)',
                  fontSize: '17px',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--primary-900)' }}>
                    {formatCurrency(order.total || order.subtotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Commitment Card */}
            <div className="card" style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--veg-50)',
              border: '1px solid var(--veg-200)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <ShieldCheck size={28} color="var(--veg-700)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px', color: 'var(--veg-900)', lineHeight: 1.4 }}>
                <strong>Shree Purity Guarantee:</strong> Prepared with double-filtered oil, farm-fresh vegetables, and delivered in hygienic food-grade insulated stainless steel containers.
              </div>
            </div>
          </div>

          {/* Right: Delivery Address & Map Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Delivery Destination Card */}
            <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <MapPin size={20} color="var(--primary-600)" />
                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
                  Delivery Destination
                </h3>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-800)',
                  fontWeight: '700',
                  fontSize: '11.5px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                }}>
                  {address.label || 'Home'}
                </div>

                <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {address.fullName}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  📞 {address.phone}
                </div>

                <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                  {address.landmark ? ` (Near ${address.landmark})` : ''}
                  <br />
                  {address.city}, {address.state} — {address.postalCode}
                </div>

                {address.deliveryInstructions && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                  }}>
                    <strong>Note:</strong> "{address.deliveryInstructions}"
                  </div>
                )}
              </div>

              {/* Map Preview */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-tertiary)', marginBottom: '6px' }}>
                  PINNED GPS LOCATION
                </div>
                <OrderMapPreview
                  latitude={address.latitude}
                  longitude={address.longitude}
                  label={address.label}
                  addressText={address.addressLine1}
                />
              </div>
            </div>

            {/* Payment Status & Actions Card */}
            <div className="card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {order.paymentMethod === 'ONLINE' ? (
                    <CreditCard size={18} color="var(--primary-600)" />
                  ) : (
                    <Banknote size={18} color="var(--veg-700)" />
                  )}
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                    Payment Summary
                  </h3>
                </div>
                <PaymentBadge method={order.paymentMethod || 'COD'} status={order.paymentStatus || 'Pending'} />
              </div>

              {/* Action alert message */}
              {paymentActionMessage.text && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '14px',
                  fontSize: '12.5px',
                  backgroundColor: paymentActionMessage.type === 'success' 
                    ? 'var(--veg-50)' 
                    : paymentActionMessage.type === 'warning'
                    ? '#fffbeb'
                    : 'rgba(239, 68, 68, 0.1)',
                  color: paymentActionMessage.type === 'success'
                    ? 'var(--veg-800)'
                    : paymentActionMessage.type === 'warning'
                    ? '#92400e'
                    : 'var(--status-danger)',
                  border: `1px solid ${
                    paymentActionMessage.type === 'success' 
                      ? 'var(--veg-200)' 
                      : paymentActionMessage.type === 'warning'
                      ? '#fde68a'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                }}>
                  {paymentActionMessage.text}
                </div>
              )}

              {/* Status details */}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                {order.paymentStatus === 'Paid' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--veg-700)', fontWeight: '600' }}>
                    <CheckCircle2 size={16} />
                    <span>
                      {order.paymentMethod === 'ONLINE'
                        ? 'Payment verified and confirmed via Razorpay.'
                        : 'Cash payment collected upon delivery.'}
                    </span>
                  </div>
                ) : order.paymentMethod === 'ONLINE' ? (
                  <div>
                    {order.paymentStatus === 'Failed' ? (
                      <span style={{ color: 'var(--status-danger)' }}>
                        Previous online payment attempt failed or was cancelled.
                      </span>
                    ) : (
                      <span>Online payment is pending completion.</span>
                    )}
                  </div>
                ) : (
                  <div>
                    <span>
                      Pay <strong>{formatCurrency(order.total)}</strong> in cash when our rider delivers your warm tiffin.
                    </span>
                  </div>
                )}
              </div>

              {/* Interactive payment actions if not yet paid and order not cancelled */}
              {order.paymentStatus !== 'Paid' && order.orderStatus !== 'Cancelled' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={handleRetryOnlinePayment}
                    disabled={isProcessingPayment}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Connecting Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={15} />
                        <span>Pay {formatCurrency(order.total)} with Razorpay</span>
                      </>
                    )}
                  </button>

                  {order.paymentMethod !== 'COD' && (
                    <button
                      onClick={handleSwitchToCod}
                      disabled={isProcessingPayment}
                      className="btn btn-outline"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Banknote size={15} />
                      <span>Switch to Cash on Delivery (COD)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Kitchen Contact & Support */}
            <div className="card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <HelpCircle size={18} color="var(--primary-600)" />
                <h4 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>
                  Kitchen Contact
                </h4>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                Have questions about your meal or delivery time? Our kitchen manager is available every day.
              </p>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                📞 Phone: <a href="tel:+919876543210" style={{ color: 'var(--primary-600)' }}>+91 98765 43210</a>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Service Hours: 11:00 AM – 10:30 PM (All 7 Days)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
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
          <div className="card modal-dialog-card" style={{ maxWidth: '440px', width: '100%', padding: 'clamp(16px, 4vw, 24px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger)', marginBottom: '12px' }}>
              <XCircle size={22} />
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Cancel Order {order.orderNumber}?
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Please let us know why you are cancelling your order. Once cancelled, this action cannot be undone.
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

            <form onSubmit={handleCancelOrder}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>
                  Cancellation Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Changed meal timing, accidental duplicate"
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
                  onClick={() => setShowCancelModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '13.5px' }}
                >
                  Keep My Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling}
                  className="btn"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13.5px',
                    backgroundColor: 'var(--status-danger)',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
