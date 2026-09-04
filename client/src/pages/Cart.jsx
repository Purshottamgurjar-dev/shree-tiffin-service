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
import { formatCurrency } from '../utils';

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
      <div style={{ padding: '60px 0', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div className="card" style={{ padding: '48px 32px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
            }}>
              <ShoppingBag size={32} />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>
              Your Homestyle Food Cart
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              Please login or create an account to view and manage your saved tiffin orders. Your cart will sync across all your devices.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '12px 28px' }}>
                <span>Login to Account</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
                <span>Register as New Customer</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 0', minHeight: '85vh' }}>
      <div className="container">
        
        {/* Page Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '14px',
        }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: '8px' }}>
              <ChefHat size={13} />
              <span>Ghar Jaisa Khana, Har Din</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
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
              fontSize: '14.5px',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} />
            <span>Add More Meals from Menu</span>
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
          <div className="card" style={{ padding: '64px 32px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <div style={{
              width: '76px',
              height: '76px',
              borderRadius: '24px',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: 'var(--text-tertiary)',
            }}>
              <ShoppingBag size={38} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '10px' }}>
              Your cart is empty
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              Add some delicious ghar-jaisa khana to get started.<br />
              Fresh homestyle meals cooked with wholesome ingredients are waiting for you!
            </p>
            <Link to="/menu" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {items.map((item) => {
                  const meal = item.meal;
                  const isItemUpdating = actionLoading === `updating-${meal._id}`;
                  const isItemRemoving = actionLoading === `removing-${meal._id}`;
                  const isMealUnavailable = meal && !meal.isAvailable;

                  return (
                    <div
                      key={item._id || meal._id}
                      className="card"
                      style={{
                        padding: '18px 20px',
                        display: 'flex',
                        gap: '18px',
                        alignItems: 'center',
                        position: 'relative',
                        border: isMealUnavailable ? '1.5px solid var(--status-danger)' : '1px solid var(--border-subtle)',
                        opacity: isItemRemoving ? 0.4 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Meal Thumbnail */}
                      <img
                        src={meal.image || '/src/assets/hero-thali.jpg'}
                        alt={meal.name}
                        style={{
                          width: '84px',
                          height: '84px',
                          borderRadius: 'var(--radius-md)',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />

                      {/* Meal Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="badge badge-primary" style={{ fontSize: '10.5px', padding: '1px 8px' }}>
                            {meal.category || 'Daily Tiffin'}
                          </span>
                          {isMealUnavailable && (
                            <span className="badge" style={{ backgroundColor: 'var(--status-danger)', color: '#ffffff', fontSize: '10.5px', padding: '1px 8px' }}>
                              Currently Unavailable
                            </span>
                          )}
                        </div>

                        <h3 style={{
                          fontSize: '16.5px',
                          fontWeight: '800',
                          color: 'var(--text-primary)',
                          marginBottom: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {meal.name}
                        </h3>

                        <div style={{ fontSize: '13.5px', color: 'var(--text-tertiary)', fontWeight: '600' }}>
                          {formatCurrency(meal.price)} per tiffin
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '4px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        <button
                          disabled={item.quantity <= 1 || isItemUpdating || actionLoading !== null}
                          onClick={() => updateQuantity(meal._id, item.quantity - 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: '#ffffff',
                            color: item.quantity <= 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>

                        <span style={{
                          minWidth: '28px',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: '800',
                          color: 'var(--text-primary)',
                        }}>
                          {isItemUpdating ? (
                            <RefreshCw size={13} className="animate-spin" style={{ margin: '0 auto' }} />
                          ) : (
                            item.quantity
                          )}
                        </span>

                        <button
                          disabled={isItemUpdating || actionLoading !== null}
                          onClick={() => updateQuantity(meal._id, item.quantity + 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: '#ffffff',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div style={{
                        minWidth: '85px',
                        textAlign: 'right',
                        fontSize: '17px',
                        fontWeight: '800',
                        color: 'var(--primary-900)',
                      }}>
                        {formatCurrency(item.itemTotal || meal.price * item.quantity)}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(meal._id)}
                        disabled={isItemRemoving || actionLoading !== null}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--text-tertiary)',
                          padding: '6px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--status-danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                        title="Remove meal from cart"
                        aria-label={`Remove ${meal.name}`}
                      >
                        <Trash2 size={18} />
                      </button>
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
                <Link to="/menu" className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 16px' }}>
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
            <div className="card" style={{ padding: '24px', position: 'sticky', top: '96px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '18px', color: 'var(--text-primary)' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span>Total Items ({totalItems} tiffins)</span>
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
                  marginBottom: '12px',
                }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>

              {/* Notice for Step 5 */}
              {checkoutNotice && (
                <div style={{
                  backgroundColor: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  color: 'var(--primary-900)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12.5px',
                  lineHeight: 1.5,
                  marginBottom: '14px',
                  textAlign: 'center',
                }}>
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  <strong>Checkout coming next!</strong> Step 5 will activate Customer Delivery Address, GPS verification, and Payment options.
                </div>
              )}

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
    </div>
  );
}
