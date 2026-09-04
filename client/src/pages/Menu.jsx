import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  Star, 
  Utensils, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ShoppingBag,
  RefreshCw,
  ChefHat
} from 'lucide-react';
import mealService, { MEAL_CATEGORIES } from '../services/mealService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency, getMealImage } from '../utils';

export default function Menu() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [errorMsg, setErrorMsg] = useState('');
  const [addingMealId, setAddingMealId] = useState(null);
  const [feedbackMealId, setFeedbackMealId] = useState(null);
  const [guestNotice, setGuestNotice] = useState(false);

  const fetchMeals = async (cat = selectedCategory, search = searchQuery) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (cat && cat !== 'All') params.category = cat;
      if (search && search.trim()) params.search = search.trim();

      const response = await mealService.getMeals(params);
      if (response.success) {
        setMeals(response.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals(selectedCategory, searchQuery);
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMeals(selectedCategory, searchQuery);
  };

  const handleAddToCart = async (meal) => {
    if (!isAuthenticated) {
      setGuestNotice(true);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setAddingMealId(meal._id);
    const res = await addToCart(meal._id, 1);
    setAddingMealId(null);

    if (res.success) {
      setFeedbackMealId(meal._id);
      setTimeout(() => setFeedbackMealId(null), 2000);
    }
  };

  return (
    <div style={{ padding: '40px 0', minHeight: '85vh' }}>
      <div className="container">
        
        {/* Guest Authentication Prompt Banner */}
        {guestNotice && (
          <div style={{
            backgroundColor: '#fff3bf',
            border: '1px solid #fab005',
            color: '#b25e00',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600' }}>
              <ShoppingBag size={20} />
              <span>Please login or register to add wholesome tiffins to your cart.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                Login Now
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '13px' }}>
                Create Account
              </Link>
              <button
                onClick={() => setGuestNotice(false)}
                className="btn btn-secondary"
                style={{ padding: '6px 10px', fontSize: '13px' }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Menu Hero Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 36px auto' }}>
          <div className="badge badge-primary" style={{ marginBottom: '14px' }}>
            <ChefHat size={14} />
            <span>Pure Vegetarian & Homestyle Cooking</span>
          </div>
          <h1 style={{ fontSize: '38px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' }}>
            Our Daily Homestyle Menu
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Prepared fresh each morning using wholesome whole-wheat phulkas, desi ghee, farm-fresh vegetables, and traditional spices.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: '36px' }}>
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ marginBottom: '18px' }}>
            <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="var(--text-tertiary)" style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search meals by name (e.g. Paneer, Deluxe Thali, Dal)..."
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14.5px',
                    outline: 'none',
                    backgroundColor: 'var(--bg-cream)',
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)' }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {MEAL_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    backgroundColor: isActive ? 'var(--primary-800)' : 'var(--bg-subtle)',
                    color: isActive ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: isActive ? 'var(--shadow-warm)' : 'none',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(250, 82, 82, 0.1)',
            border: '1px solid rgba(250, 82, 82, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: 'var(--status-danger)',
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--primary-700)' }} />
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Fetching freshly prepared meals...</div>
          </div>
        ) : meals.length === 0 ? (
          /* Empty State */
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', maxWidth: '540px', margin: '0 auto' }}>
            <Utensils size={44} color="var(--text-tertiary)" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>No meals found</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              We couldn't find any dishes matching "{searchQuery}" in category "{selectedCategory}".
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                fetchMeals('All', '');
              }}
              className="btn btn-secondary"
              style={{ padding: '10px 22px' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Meal Cards Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '28px',
          }}>
            {meals.map((meal) => (
              <div
                key={meal._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  position: 'relative',
                  border: meal.isFeatured ? '2px solid var(--accent-gold-300)' : '1px solid var(--border-subtle)',
                }}
              >
                {/* Featured Ribbon */}
                {meal.isFeatured && (
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    zIndex: 2,
                    backgroundColor: 'var(--primary-800)',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}>
                    <Sparkles size={12} />
                    <span>TODAY'S SPECIAL</span>
                  </div>
                )}

                {/* Meal Image */}
                <div style={{ position: 'relative', height: '210px', overflow: 'hidden' }}>
                  <img
                    src={getMealImage(meal.image)}
                    alt={meal.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform var(--transition-smooth)',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '12px',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <Star size={12} color="#fab005" fill="#fab005" />
                    <span>{meal.rating || '4.8'}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Category & Availability */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                      {meal.category}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: meal.isAvailable ? 'var(--veg-700)' : 'var(--status-danger)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {meal.isAvailable ? (
                        <>
                          <CheckCircle2 size={13} />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} />
                          <span>Sold Out</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Meal Title */}
                  <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {meal.name}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1,
                  }}>
                    {meal.description}
                  </p>

                  {/* Ingredients Preview */}
                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '18px' }}>
                      {meal.ingredients.slice(0, 3).map((ing, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          {ing}
                        </span>
                      ))}
                      {meal.ingredients.length > 3 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                          +{meal.ingredients.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price & Action Buttons */}
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Price</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-900)' }}>
                        {formatCurrency(meal.price)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to={`/menu/${meal.slug || meal._id}`}
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '13px' }}
                      >
                        <span>Details</span>
                      </Link>

                      <button
                        disabled={!meal.isAvailable || addingMealId === meal._id}
                        onClick={() => handleAddToCart(meal)}
                        className="btn btn-primary"
                        style={{
                          padding: '8px 14px',
                          fontSize: '13px',
                          opacity: meal.isAvailable ? 1 : 0.5,
                          cursor: meal.isAvailable ? 'pointer' : 'not-allowed',
                          backgroundColor: feedbackMealId === meal._id ? 'var(--veg-700)' : undefined,
                          borderColor: feedbackMealId === meal._id ? 'var(--veg-700)' : undefined,
                        }}
                        title={meal.isAvailable ? 'Add to Tiffin Order' : 'Item is sold out'}
                      >
                        {addingMealId === meal._id ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : feedbackMealId === meal._id ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={14} />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
