import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  ChefHat, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Phone, 
  User, 
  Mail, 
  MapPin,
  CreditCard,
  Banknote,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import checkoutService from '../services/checkoutService';
import { createOrder } from '../services/orderService';
import paymentService from '../services/paymentService';
import settingsService from '../services/settingsService';
import AddressSelector from '../components/address/AddressSelector';
import { formatCurrency, getMealImage } from '../utils';

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalItems, subtotal, total, loading: cartLoading, loadCart } = useCart();
  const navigate = useNavigate();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'COD'
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [businessSettings, setBusinessSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsService.getPublicSettings();
        if (res.success && res.settings) {
          setBusinessSettings(res.settings);
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const deliveryFee = businessSettings?.delivery?.deliveryFee ?? 0;
  const minimumOrderValue = businessSettings?.delivery?.minimumOrderValue ?? 0;
  const isAcceptingOrders = businessSettings?.ordering?.isAcceptingOrders ?? true;
  const pausedMessage = businessSettings?.ordering?.pausedMessage || 'Online ordering is currently unavailable.';
  const finalTotal = subtotal + deliveryFee;
  const isBelowMinimum = minimumOrderValue > 0 && subtotal < minimumOrderValue;

  // Check if any meal is unavailable
  const hasUnavailableMeals = items.some((item) => item.meal && !item.meal.isAvailable);

  // Handle server-side order creation and payment
  const handlePlaceOrder = async () => {
    setOrderError('');

    if (!isAcceptingOrders) {
      setOrderError(pausedMessage);
      return;
    }

    if (isBelowMinimum) {
      setOrderError(`Minimum order value of ₹${minimumOrderValue} is required to place an order. Your current subtotal is ₹${subtotal}.`);
      return;
    }

    if (!selectedAddress) {
      setOrderError('Please select or add a delivery address to place your order.');
      return;
    }

    if (!selectedAddress.latitude || !selectedAddress.longitude) {
      setOrderError('Please ensure your delivery address has pinned GPS coordinates on the map.');
      return;
    }

    if (hasUnavailableMeals) {
      setOrderError('Some meals in your cart are currently unavailable. Please remove them before ordering.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const idempotencyKey = `sts_order_${user?._id || 'cust'}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // 1. Create Real Order in MongoDB
      const res = await createOrder(
        {
          addressId: selectedAddress._id,
          deliveryInstructions: deliveryNotes,
        },
        idempotencyKey
      );

      if (!res.success || !res.order) {
        setOrderError(res.message || 'Failed to place order. Please try again.');
        setIsPlacingOrder(false);
        return;
      }

      const createdOrder = res.order;

      // 2a. Cash on Delivery (COD) Flow
      if (paymentMethod === 'COD') {
        try {
          await paymentService.selectCodPayment(createdOrder._id);
        } catch (codErr) {
          console.warn('COD selection notice:', codErr);
        }
        await loadCart();
        navigate(`/orders/${createdOrder._id}`, {
          state: { justPlaced: true, orderNumber: createdOrder.orderNumber, paymentMethod: 'COD' },
        });
        return;
      }

      // 2b. Online Payment (Razorpay) Flow
      try {
        const gatewayRes = await paymentService.createOnlineOrder(createdOrder._id);
        const pInfo = gatewayRes.payment;

        // Try to load external Razorpay checkout script with timeout safeguard
        const isLoaded = await paymentService.loadRazorpayScript(9000);

        if (isLoaded && window.Razorpay) {
          const cleanPhone = (user?.phone || selectedAddress?.phone || '').replace(/\D/g, '').slice(-10);
          const razorpayKey = pInfo.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '';

          const options = paymentService.buildRazorpayOptions({
            keyId: razorpayKey,
            amountInPaise: pInfo.amount,
            currency: pInfo.currency || 'INR',
            gatewayOrderId: pInfo.gatewayOrderId,
            orderId: createdOrder._id,
            orderNumber: createdOrder.orderNumber,
            customerName: user?.name || selectedAddress?.fullName || '',
            customerEmail: user?.email || '',
            customerPhone: cleanPhone,
            deliveryAddress: `${selectedAddress?.addressLine1 || ''}, ${selectedAddress?.city || ''}`,
            onSuccess: async (response) => {
              try {
                // Mandatory Server-Side Cryptographic Verification
                await paymentService.verifyOnlinePayment({
                  orderId: createdOrder._id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                await loadCart();
                navigate(`/orders/${createdOrder._id}`, {
                  state: { justPlaced: true, orderNumber: createdOrder.orderNumber, paidOnline: true },
                });
              } catch (verErr) {
                setOrderError(verErr.response?.data?.message || verErr.message || 'Payment verification failed on server.');
                await loadCart();
                navigate(`/orders/${createdOrder._id}`);
              } finally {
                setIsPlacingOrder(false);
              }
            },
            onDismiss: async () => {
              setIsPlacingOrder(false);
              setOrderError('Payment cancelled. Your order has not been charged.');
              try {
                await paymentService.recordPaymentFailure({
                  orderId: createdOrder._id,
                  gatewayOrderId: pInfo.gatewayOrderId,
                  reason: 'Customer cancelled or dismissed Razorpay payment popup',
                });
              } catch (e) {
                // non-critical
              }
              await loadCart();
              navigate(`/orders/${createdOrder._id}`, {
                state: { justPlaced: true, paymentPending: true, message: 'Payment cancelled. Your order has not been charged. You can retry or choose Cash on Delivery.' },
              });
            },
          });

          const rzpInstance = new window.Razorpay(options);
          rzpInstance.on('payment.failed', async (response) => {
            setIsPlacingOrder(false);
            const failureReason = response.error?.description || 'Online payment could not be completed';
            setOrderError(`Online payment failed: ${failureReason}. You can retry or choose Cash on Delivery.`);
            try {
              await paymentService.recordPaymentFailure({
                orderId: createdOrder._id,
                gatewayOrderId: pInfo.gatewayOrderId,
                reason: failureReason,
              });
            } catch (e) {
              // non-critical
            }
            await loadCart();
            navigate(`/orders/${createdOrder._id}`, {
              state: { justPlaced: true, paymentFailed: true, failureReason },
            });
          });
          rzpInstance.open();
        } else {
          // In environments where Razorpay CDN script cannot load
          setIsPlacingOrder(false);
          setOrderError('Unable to connect to the online payment gateway. Please check your internet connection or choose Cash on Delivery.');
          await loadCart();
          navigate(`/orders/${createdOrder._id}`, {
            state: { justPlaced: true, orderNumber: createdOrder.orderNumber, paymentMethod: 'ONLINE', paymentPending: true },
          });
        }
      } catch (onlineErr) {
        setIsPlacingOrder(false);
        setOrderError(onlineErr.response?.data?.message || onlineErr.message || 'Failed to initiate online payment. Order saved as Pending.');
        await loadCart();
        navigate(`/orders/${createdOrder._id}`);
      }
    } catch (err) {
      setOrderError(err.message || 'Server error while placing order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Empty cart guard
  if (!cartLoading && items.length === 0) {
    return (
      <div style={{ padding: '60px 0', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div className="card" style={{ padding: '48px 32px' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}>
              <ShoppingBag size={34} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>
              Your cart is empty
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Please add fresh homestyle meals from our menu before proceeding to checkout.
            </p>
            <Link to="/menu" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
              <ChefHat size={16} />
              <span>Browse Homestyle Menu</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0', minHeight: '85vh' }}>
      <div className="container">
        
        {/* Checkout Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: '8px' }}>
              <ChefHat size={13} />
              <span>Pure Vegetarian & Fast Delivery</span>
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)' }}>
              Checkout & Delivery Details
            </h1>
          </div>

          <Link
            to="/cart"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary-800)',
              fontWeight: '700',
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Cart</span>
          </Link>
        </div>

        {/* Global Error Notice */}
        {orderError && (
          <div style={{
            backgroundColor: 'rgba(250, 82, 82, 0.1)',
            border: '1px solid var(--status-danger)',
            color: 'var(--status-danger)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: '600',
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{orderError}</span>
          </div>
        )}

        {/* Two-Column Checkout Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '32px',
          alignItems: 'start',
        }} className="checkout-grid">

          {/* Left Column: Delivery Details */}
          <div>
            
            {/* Section 1: Customer Contact Info Card */}
            <div className="card" style={{ padding: '22px 24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <User size={18} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Customer Contact
                </h2>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                backgroundColor: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
              }}>
                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: '600' }}>Full Name</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {user?.name || 'Customer'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: '600' }}>Mobile Number</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={13} color="var(--primary-800)" />
                    <span>{user?.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: '600' }}>Email Address</div>
                  <div style={{ fontSize: '14.5px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={13} color="var(--primary-800)" />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Address Selector with Map & Form */}
            <AddressSelector
              selectedAddress={selectedAddress}
              onSelectAddress={(addr) => {
                setSelectedAddress(addr);
                setOrderError('');
              }}
            />

            {/* Section 3: Delivery Notes */}
            <div className="card" style={{ padding: '22px 24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Rider Delivery Instructions
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Any special drop-off instructions for our delivery partner?
              </p>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Leave at flat door, call upon gate arrival, buzzer is #402"
                className="input-field"
                rows={2}
                maxLength={250}
              />
            </div>

            {/* Section 4: Choose Payment Method */}
            <div className="card" style={{ padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    Payment Method
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Select how you would like to pay for your pure veg tiffins
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Option 1: Online Payment (Razorpay) */}
                <div
                  onClick={() => setPaymentMethod('ONLINE')}
                  className="payment-option-card"
                  style={{
                    border: paymentMethod === 'ONLINE' ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
                    backgroundColor: paymentMethod === 'ONLINE' ? 'rgba(234, 88, 12, 0.04)' : 'var(--bg-card)',
                    boxShadow: paymentMethod === 'ONLINE' ? '0 2px 10px rgba(234, 88, 12, 0.1)' : 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={() => setPaymentMethod('ONLINE')}
                    style={{ marginTop: '3px', accentColor: 'var(--primary-600)', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Online Payment (Razorpay)
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        Instant Kitchen Dispatch
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                      Pay instantly with UPI (PhonePe, Google Pay, Paytm, BHIM), Debit/Credit Cards, or Netbanking.
                    </p>
                    
                    {/* Visual Supported UPI & Payment Instruments Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '700', border: '1px solid #bfdbfe' }}>
                        PhonePe
                      </span>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f0fdf4', color: '#15803d', fontSize: '11px', fontWeight: '700', border: '1px solid #bbf7d0' }}>
                        Google Pay
                      </span>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#faf5ff', color: '#7e22ce', fontSize: '11px', fontWeight: '700', border: '1px solid #e9d5ff' }}>
                        Paytm
                      </span>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#fff7ed', color: '#c2410c', fontSize: '11px', fontWeight: '700', border: '1px solid #fed7aa' }}>
                        BHIM / UPI
                      </span>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f8fafc', color: '#475569', fontSize: '11px', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                        Cards & Netbanking
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                      <Lock size={12} />
                      <span>256-bit Encrypted • Direct app opening on mobile via Razorpay</span>
                    </div>
                  </div>
                </div>

                {/* Option 2: Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className="payment-option-card"
                  style={{
                    border: paymentMethod === 'COD' ? '2px solid #b45309' : '1px solid var(--border-color)',
                    backgroundColor: paymentMethod === 'COD' ? 'rgba(245, 158, 11, 0.04)' : 'var(--bg-card)',
                    boxShadow: paymentMethod === 'COD' ? '0 2px 10px rgba(180, 83, 9, 0.1)' : 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    style={{ marginTop: '3px', accentColor: '#b45309', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        Cash on Delivery (COD)
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        color: '#b45309',
                        fontWeight: '700',
                      }}>
                        Pay at Doorstep
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      Pay cash when your fresh, piping hot tiffin is delivered to your doorstep.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Checkout Verification */}
          <div className="card" style={{ padding: '24px', position: 'sticky', top: '96px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '18px', color: 'var(--text-primary)' }}>
              Order Summary ({totalItems} tiffins)
            </h2>

            {/* Items Breakdown */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '260px',
              overflowY: 'auto',
              marginBottom: '18px',
              paddingRight: '4px',
            }}>
              {items.map((item) => {
                const meal = item.meal;
                const isUnavailable = meal && !meal.isAvailable;
                return (
                  <div
                    key={item._id || meal._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      fontSize: '13.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <img
                        src={getMealImage(meal.image)}
                        alt={meal.name}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {meal.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                          Qty: {item.quantity} × {formatCurrency(meal.price)}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      fontWeight: '800',
                      color: isUnavailable ? 'var(--status-danger)' : 'var(--primary-900)',
                      whiteSpace: 'nowrap',
                    }}>
                      {isUnavailable ? 'Sold Out' : formatCurrency(item.itemTotal || meal.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cost Breakdown */}
            <div style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                <span>Delivery & Packaging</span>
                <span style={{ color: deliveryFee === 0 ? 'var(--veg-700)' : 'var(--text-primary)', fontWeight: '600' }}>
                  {deliveryFee === 0 ? 'Free Delivery' : formatCurrency(deliveryFee)}
                </span>
              </div>

              <div style={{
                borderTop: '1px dashed var(--border-subtle)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Total to Pay</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-900)' }}>
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            {/* Minimum Order Value Warning */}
            {isBelowMinimum && (
              <div style={{
                backgroundColor: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '14px',
                fontSize: '12.5px',
                color: '#c2410c',
                fontWeight: '600',
              }}>
                ⚠️ Minimum order value is ₹{minimumOrderValue}. Please add ₹{minimumOrderValue - subtotal} more to place your order.
              </div>
            )}

            {/* Store Paused Banner */}
            {!isAcceptingOrders && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '14px',
                fontSize: '12.5px',
                color: '#991b1b',
                fontWeight: '600',
              }}>
                ⏸️ {pausedMessage}
              </div>
            )}

            {/* Selected Address Indicator */}
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '18px',
              fontSize: '12.5px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Delivering to:
              </div>
              {selectedAddress ? (
                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  📍 {selectedAddress.label} — {selectedAddress.addressLine1}, {selectedAddress.city} ({selectedAddress.postalCode})
                </div>
              ) : (
                <div style={{ color: 'var(--status-danger)', fontWeight: '600' }}>
                  ⚠️ No delivery address selected
                </div>
              )}
            </div>

            {/* Error Message */}
            {orderError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--status-danger)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '13px',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{orderError}</span>
              </div>
            )}

            {/* Order Notice */}
            <div style={{
              backgroundColor: 'var(--veg-50)',
              border: '1px solid var(--veg-200)',
              color: 'var(--veg-800)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              fontSize: '12.5px',
              lineHeight: 1.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '2px' }}>
                <Sparkles size={14} color="var(--veg-700)" />
                <span>Real Kitchen Order</span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--veg-900)' }}>
                Your order will be instantly received by Shree Kitchen and prepared hot in fresh stainless steel tiffins.
              </p>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              disabled={hasUnavailableMeals || items.length === 0 || isPlacingOrder || !selectedAddress || !isAcceptingOrders || isBelowMinimum}
              onClick={handlePlaceOrder}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                justifyContent: 'center',
                opacity: hasUnavailableMeals || items.length === 0 || isPlacingOrder || !selectedAddress || !isAcceptingOrders || isBelowMinimum ? 0.6 : 1,
                cursor: hasUnavailableMeals || items.length === 0 || isPlacingOrder || !selectedAddress || !isAcceptingOrders || isBelowMinimum ? 'not-allowed' : 'pointer',
                marginBottom: '14px',
                boxShadow: 'var(--shadow-primary)',
              }}
            >
              {isPlacingOrder ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>
                    {paymentMethod === 'ONLINE' ? 'Connecting to Secure Gateway...' : 'Confirming COD Order...'}
                  </span>
                </>
              ) : (
                <>
                  {paymentMethod === 'ONLINE' ? (
                    <>
                      <CreditCard size={18} />
                      <span>Pay {formatCurrency(finalTotal)} & Place Order</span>
                    </>
                  ) : (
                    <>
                      <Banknote size={18} />
                      <span>Confirm Order (Cash on Delivery)</span>
                    </>
                  )}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--veg-700)',
              fontWeight: '600',
            }}>
              <ShieldCheck size={14} />
              <span>100% Pure Vegetarian & Hot Stainless Tiffins</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
