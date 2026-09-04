import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ChefHat, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getMealImage } from '../utils';

export default function Cart() {
  const { 
    items, 
    totalItems, 
    subtotal, 
    total, 
    loading, 
    actionLoading, 
    error, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState(false);

  // Check if any meal is unavailable
  const hasUnavailableMeals = items.some((item) => item.meal && !item.meal.isAvailable);

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '40px 0 80px', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '560px', textAlign: 'center' }}>
          <div className="card" style={{ padding: 'clamp(32px, 6vw, 48px) clamp(16px, 4vw, 32px)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
            }}>
              <ShoppingBag size={30} />
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 5.5vw, 26px)', fontWeight: '800', marginBottom: '10px' }}>
              Your Homestyle Food Cart
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Please login or create an account to view and manage your saved tiffin orders. Your cart will sync across all your devices.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '11px 24px', fontSize: '14px' }}>
                <span>Login to Account</span>
                <ArrowRight size={15} />
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '11px 20px', fontSize: '14px' }}>
                <span>Register as New</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper" style={{ padding: 'clamp(20px, 4vw, 36px) 0 60px', minHeight: '85vh' }}>
      <div className="container">
        
        {/* Page Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <ChefHat size={13} />
              <span>Ghar Jaisa Khana, Har Din</span>
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 5.5vw, 32px)', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Your Shopping Cart
            </h1>
          </div>

          <Link
            to="/menu"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--primary-800)',
              fontWeight: '700',
              fontSize: '13.5px',
              textDecoration: 'none',
              padding: '6px 14px',
              backgroundColor: 'var(--primary-50)',
              borderRadius: 'var(--radius-sm)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <ArrowLeft size={15} />
            <span>Add More Meals</span>
          </Link>
        </div>

        {/* Global Error Banner if any */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(250, 82, 82, 0.1)',
            border: '1px solid var(--status-danger)',
            color: 'var(--status-danger)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && items.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--primary-700)' }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Loading your cart from server...</div>
          </div>
        ) : items.length === 0 ? (
          /* Empty Cart State */
          <div className="card" style={{ padding: 'clamp(36px, 8vw, 64px) clamp(16px, 4vw, 32px)', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              color: 'var(--text-tertiary)',
            }}>
              <ShoppingBag size={34} />
            </div>
            <h2 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: '800', marginBottom: '8px' }}>
              Your cart is empty
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Add some delicious ghar-jaisa khana to get started.<br />
              Fresh homestyle meals cooked with wholesome ingredients are waiting for you!
            </p>
            <Link to="/menu" className="btn btn-primary" style={{ padding: '11px 26px', fontSize: '14.5px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ChefHat size={16} />
              <span>Browse Menu</span>
            </Link>
          </div>
        ) : (
          /* Active Cart Layout */
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 340px',
            gap: '28px',
            alignItems: 'start',
          }} className="cart-grid">

            {/* Left Column: Cart Items List */}
            <div>
              {/* Unavailable Items Warning Banner */}
              {hasUnavailableMeals && (
                <div style={{
                  backgroundColor: '#fff3bf',
                  border: '1px solid #fab005',
                  color: '#e67700',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>
                    One or more meals in your cart are currently out of stock or unavailable today. Please remove them to proceed.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {items.map((item) => {
                  const meal = item.meal;
                  const isItemUpdating = actionLoading === `updating-${meal._id}`;
                  const isItemRemoving = actionLoading === `removing-${meal._id}`;
                  const isMealUnavailable = meal && !meal.isAvailable;

                  return (
                    <div
                      key={item._id || meal._id}
                      className="card cart-item-card"
                      style={{
                        border: isMealUnavailable ? '1.5px solid var(--status-danger)' : '1px solid var(--border-subtle)',
                        opacity: isItemRemoving ? 0.4 : 1,
                      }}
                    >
                      {/* Main Info: Thumbnail + Details */}
                      <div className="cart-item-main">
                        {/* Meal Thumbnail */}
                        <img
                          src={getMealImage(meal.image)}
                          alt={meal.name}
                          className="cart-item-thumb"
                        />

                        {/* Meal Details */}
                        <div className="cart-item-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className="badge badge-primary" style={{ fontSize: '10.5px', padding: '1px 8px' }}>
                              {meal.category || 'Daily Tiffin'}
                            </span>
                            {isMealUnavailable && (
                              <span className="badge" style={{ backgroundColor: 'var(--status-danger)', color: '#ffffff', fontSize: '10.5px', padding: '1px 8px' }}>
                                Unavailable
                              </span>
                            )}
                          </div>

                          <h3 className="cart-item-title">
                            {meal.name}
                          </h3>

                          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600' }}>
                            {formatCurrency(meal.price)} per tiffin
                          </div>
                        </div>
                      </div>

                      {/* Actions: Stepper + Price & Remove Button */}
                      <div className="cart-item-actions">
                        {/* Quantity Controls */}
                        <div className="cart-stepper">
                          <button
                            disabled={item.quantity <= 1 || isItemUpdating || actionLoading !== null}
                            onClick={() => updateQuantity(meal._id, item.quantity - 1)}
                            className="cart-stepper-btn"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="cart-stepper-qty">
                            {isItemUpdating ? (
                              <RefreshCw size={13} className="animate-spin" style={{ margin: '0 auto' }} />
                            ) : (
                              item.quantity
                            )}
                          </span>

                          <button
                            disabled={isItemUpdating || actionLoading !== null}
                            onClick={() => updateQuantity(meal._id, item.quantity + 1)}
                            className="cart-stepper-btn"
                            aria-label="Increase quantity"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        {/* Price & Trash Action */}
                        <div className="cart-item-price-actions">
                          <div className="cart-item-total">
                            {formatCurrency(item.itemTotal || meal.price * item.quantity)}
                          </div>

                          <button
                            onClick={() => removeFromCart(meal._id)}
                            disabled={isItemRemoving || actionLoading !== null}
                            className="cart-remove-btn"
                            title="Remove meal from cart"
                            aria-label={`Remove ${meal.name}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions: Clear Cart & Back to Menu */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <Link to="/menu" className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} />
                  <span>Add Another Tiffin</span>
                </Link>

                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    disabled={actionLoading !== null}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--status-danger)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px',
                      touchAction: 'manipulation',
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Clear Cart</span>
                  </button>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(250, 82, 82, 0.08)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--status-danger)' }}>
                      Are you sure?
                    </span>
                    <button
                      onClick={async () => {
                        await clearCart();
                        setShowClearConfirm(false);
                      }}
                      className="btn"
                      style={{
                        backgroundColor: 'var(--status-danger)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="card" style={{ padding: 'clamp(18px, 4vw, 24px)', position: 'sticky', top: '96px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '18px', color: 'var(--text-primary)' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>Total Items ({totalItems} {totalItems === 1 ? 'tiffin' : 'tiffins'})</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{totalItems}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>Items Subtotal</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  <span>Delivery & Packaging</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '16px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Cart Total</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-900)' }}>
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Checkout CTA Button */}
              <button
                disabled={hasUnavailableMeals || items.length === 0}
                onClick={() => navigate('/checkout')}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '15px',
                  justifyContent: 'center',
                  opacity: hasUnavailableMeals ? 0.5 : 1,
                  cursor: hasUnavailableMeals ? 'not-allowed' : 'pointer',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
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
                <span>100% Pure Vegetarian & Hygienic Cooking</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Floating Sticky Mobile Checkout Bar (<= 768px) */}
      {items.length > 0 && (
        <div className="cart-mobile-sticky-bar">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total ({totalItems} {totalItems === 1 ? 'tiffin' : 'tiffins'})
            </span>
            <span style={{ fontSize: '19px', fontWeight: '800', color: 'var(--primary-900)' }}>
              {formatCurrency(total)}
            </span>
          </div>

          <button
            disabled={hasUnavailableMeals || items.length === 0}
            onClick={() => navigate('/checkout')}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '14.5px',
              fontWeight: '700',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: hasUnavailableMeals ? 0.5 : 1,
              cursor: hasUnavailableMeals ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(194, 65, 12, 0.25)',
              touchAction: 'manipulation',
            }}
          >
            <span>Checkout</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
