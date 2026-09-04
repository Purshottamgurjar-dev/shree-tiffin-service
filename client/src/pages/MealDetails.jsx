import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ShoppingBag, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  ChefHat,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import mealService from '../services/mealService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency, getMealImage } from '../utils';

export default function MealDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(false);
  const [guestWarning, setGuestWarning] = useState(false);

  useEffect(() => {
    const fetchMeal = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const response = await mealService.getMealById(id);
        if (response.success) {
          setMeal(response.data);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Meal not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeal();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
        <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--primary-700)' }} />
        <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Loading delicious meal details...</p>
      </div>
    );
  }

  if (errorMsg || !meal) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px' }}>
          <AlertCircle size={44} color="var(--status-danger)" style={{ margin: '0 auto 14px auto' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Meal Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {errorMsg || 'We could not find the meal you requested.'}
          </p>
          <Link to="/menu" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <ArrowLeft size={16} />
            <span>Back to All Meals</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-bottom-nav-pad" style={{ padding: '40px 20px', minHeight: '85vh' }}>
      {/* Back Link */}
      <Link
        to="/menu"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-secondary)',
          fontWeight: '600',
          fontSize: '14px',
          marginBottom: '24px',
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Menu</span>
      </Link>

      {/* Main Meal Detail Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', maxWidth: '1040px', margin: '0 auto', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(234, 88, 12, 0.12)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        }}>
          {/* Left Column: Image Banner */}
          <div style={{ position: 'relative', minHeight: '380px', maxHeight: '520px', backgroundColor: '#fdf6ec' }}>
            <img
              src={getMealImage(meal.image)}
              alt={meal.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            
            {/* Pure Veg Badge on Image */}
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              padding: '6px 10px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span className="veg-indicator" title="100% Pure Vegetarian" />
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', letterSpacing: '0.5px' }}>PURE VEG</span>
            </div>

            {meal.isFeatured && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                backgroundColor: 'var(--primary-800)',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--shadow-md)',
                zIndex: 2,
              }}>
                <Sparkles size={14} color="#fab005" />
                <span>TODAY'S SPECIAL</span>
              </div>
            )}
          </div>

          {/* Right Column: Meal Information */}
          <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Category, Rating & Availability */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span className="badge badge-primary">
                  {meal.category}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', fontSize: '14px' }}>
                    <Star size={16} color="#fab005" fill="#fab005" />
                    <span>{meal.rating || '4.8'}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', fontWeight: '400' }}>(Customer Rating)</span>
                  </div>

                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: meal.isAvailable ? 'var(--veg-700)' : 'var(--status-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {meal.isAvailable ? (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Freshly Cooked Today</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={15} />
                        <span>Currently Unavailable</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Meal Name */}
              <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                {meal.name}
              </h1>

              {/* Price Banner */}
              <div style={{
                display: 'inline-block',
                backgroundColor: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--primary-900)', fontWeight: '600' }}>Price: </span>
                <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--primary-800)' }}>
                  {formatCurrency(meal.price)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                  (inclusive of all taxes)
                </span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  Meal Description
                </h4>
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {meal.description}
                </p>
              </div>

              {/* Key Ingredients */}
              {meal.ingredients && meal.ingredients.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
                    Authentic Ingredients
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {meal.ingredients.map((ing, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '13px',
                          fontWeight: '600',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions & Cart Interaction */}
            <div style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '24px',
            }}>
              {/* Guest Warning */}
              {guestWarning && (
                <div style={{
                  backgroundColor: '#fff3bf',
                  border: '1px solid #fab005',
                  color: '#b25e00',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}>
                  <span>Please log in to add meals to your cart.</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/login" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }}>
                      Login
                    </Link>
                    <button onClick={() => setGuestWarning(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Success Notification */}
              {successFeedback && (
                <div style={{
                  backgroundColor: 'var(--veg-50)',
                  border: '1px solid var(--veg-200)',
                  color: 'var(--veg-800)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} color="var(--status-success)" />
                    <span>Added {quantity} × {meal.name} to your cart!</span>
                  </div>
                  <Link to="/cart" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12.5px' }}>
                    View Cart
                  </Link>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {/* Quantity Controls */}
                {meal.isAvailable && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                      Quantity:
                    </span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '4px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <button
                        disabled={quantity <= 1 || isAdding}
                        onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          backgroundColor: '#ffffff',
                          color: quantity <= 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={15} />
                      </button>

                      <span style={{
                        minWidth: '32px',
                        textAlign: 'center',
                        fontSize: '15px',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                      }}>
                        {quantity}
                      </span>

                      <button
                        disabled={isAdding}
                        onClick={() => setQuantity((prev) => prev + 1)}
                        style={{
                          width: '32px',
                          height: '32px',
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
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  disabled={!meal.isAvailable || isAdding}
                  onClick={async () => {
                    if (!isAuthenticated) {
                      setGuestWarning(true);
                      return;
                    }
                    setIsAdding(true);
                    const res = await addToCart(meal._id, quantity);
                    setIsAdding(false);
                    if (res.success) {
                      setSuccessFeedback(true);
                      setTimeout(() => setSuccessFeedback(false), 4000);
                    }
                  }}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 28px',
                    fontSize: '15px',
                    opacity: meal.isAvailable ? 1 : 0.5,
                    cursor: meal.isAvailable ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isAdding ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>Adding to Cart...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={17} />
                      <span>
                        {meal.isAvailable
                          ? `Add to Tiffin Order (${formatCurrency(meal.price * quantity)})`
                          : 'Sold Out for Today'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
                ⚡ Freshly prepared in hygienic stainless steel tiffins • Hot delivery guaranteed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
