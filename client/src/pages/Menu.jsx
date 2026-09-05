import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  ChefHat,
  X,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  Clock,
  HeartHandshake,
  Plus,
  Minus
} from 'lucide-react';
import mealService, { MEAL_CATEGORIES } from '../services/mealService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatCurrency, getMealImage } from '../utils';

// Popular quick search suggestion chips
const POPULAR_SUGGESTIONS = [
  { label: 'Paneer Thali', query: 'Paneer', icon: '🧀' },
  { label: 'Deluxe Lunch', query: 'Deluxe', icon: '🍱' },
  { label: 'Daily Tiffin', query: 'Daily', icon: '🍲' },
  { label: 'Shahi Feast', query: 'Shahi', icon: '👑' },
  { label: 'Dinner Box', query: 'Dinner', icon: '🌙' },
  { label: 'Indori Poha', query: 'Poha', icon: '🌾' },
  { label: 'Desi Phulka', query: 'Phulka', icon: '🫓' },
  { label: 'Masala Chaas', query: 'Chaas', icon: '🥛' },
];

// Rich Category Filter Tabs with emojis
const CATEGORY_TABS = [
  { key: 'All', label: 'All Dishes', icon: '🍱' },
  { key: 'Daily Tiffin', label: 'Daily Tiffin', icon: '🍛' },
  { key: 'Lunch', label: 'Lunch Meals', icon: '🥘' },
  { key: 'Dinner', label: 'Dinner Boxes', icon: '🌙' },
  { key: 'Special Thali', label: 'Special Thali', icon: '👑' },
  { key: 'Breakfast', label: 'Breakfast', icon: '🥞' },
  { key: 'Extra Items', label: 'Beverages & Extras', icon: '🥛' },
  { key: 'Add-ons', label: 'Roti & Add-ons', icon: '🫓' },
];

export default function Menu() {
  const { isAuthenticated } = useAuth();
  const { items, totalItems, addToCart, updateQuantity, removeFromCart } = useCart();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);
  const [activeSuggestion, setActiveSuggestion] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [categoryCounts, setCategoryCounts] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [addingMealId, setAddingMealId] = useState(null);
  const [feedbackMealId, setFeedbackMealId] = useState(null);
  const [guestNotice, setGuestNotice] = useState(false);

  const searchInputRef = useRef(null);

  // Load all meals initially to compute category counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const res = await mealService.getMeals({});
        if (res.success && Array.isArray(res.data)) {
          const counts = { All: res.data.length };
          res.data.forEach((m) => {
            if (m.category) {
              counts[m.category] = (counts[m.category] || 0) + 1;
            }
          });
          setCategoryCounts(counts);
        }
      } catch (e) {
        // Non-critical
      }
    };
    loadCounts();
  }, []);

  // Fetch meals based on current filters
  const fetchMeals = async (cat = selectedCategory, search = searchQuery, sort = sortBy) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (cat && cat !== 'All') params.category = cat;
      if (search && search.trim()) params.search = search.trim();
      if (sort) params.sort = sort;

      const response = await mealService.getMeals(params);
      if (response.success) {
        setMeals(response.data || []);
      } else {
        setMeals([]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load menu items.');
      setMeals([]);
    } finally {
      setLoading(false);
    }
  };

  // Live search debounce (300ms) for instant filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMeals(selectedCategory, searchQuery, sortBy);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, sortBy]);

  // Clickable Suggestion Chip handler (toggleable & instant)
  const handleSuggestionClick = (query) => {
    if (activeSuggestion.toLowerCase() === query.toLowerCase()) {
      // Deselect if already selected
      setActiveSuggestion('');
      setSearchQuery('');
    } else {
      setActiveSuggestion(query);
      setSearchQuery(query);
    }
  };

  // Form submit handler
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchMeals(selectedCategory, searchQuery, sortBy);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSuggestion('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Add to cart handler
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
    <div className="page-bottom-nav-pad" style={{ padding: 'clamp(20px, 4vw, 40px) 0 80px', minHeight: '85vh' }}>
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
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700' }}>
              <ShoppingBag size={20} />
              <span>Please login or register to add wholesome tiffins to your cart.</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }}>
                Login Now
              </Link>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '13px' }}>
                Create Account
              </Link>
              <button
                onClick={() => setGuestNotice(false)}
                className="btn btn-secondary"
                style={{ padding: '7px 10px', fontSize: '13px' }}
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Menu Hero Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 32px auto' }}>
          <div className="badge badge-primary" style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px' }}>
            <ChefHat size={14} />
            <span>Ghar Jaisa Khana, Har Din</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(26px, 6vw, 42px)',
            fontWeight: '800',
            marginBottom: '10px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}>
            Fresh Homestyle Tiffin Menu
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 3.5vw, 16px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '660px',
            margin: '0 auto 18px auto',
          }}>
            Cooked fresh each morning in pure desi cow ghee, whole-wheat soft phulkas, farm-fresh vegetables, and comforting homestyle spices.
          </p>

          {/* Quick Value Pillars */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px 18px',
            fontSize: '12.5px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <div className="veg-indicator"><div className="veg-indicator-dot" /></div>
              <span>100% Pure Vegetarian</span>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--primary-800)' }}>
              <Flame size={14} />
              <span>Desi Cow Ghee Cooking</span>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} color="var(--primary-700)" />
              <span>Hot Doorstep Delivery</span>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--veg-700)' }}>
              <ShieldCheck size={14} />
              <span>Hygienic Kitchen</span>
            </span>
          </div>
        </div>

        {/* Search & Suggestions Card */}
        <div className="card" style={{
          padding: 'clamp(16px, 4vw, 24px)',
          marginBottom: '28px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-subtle)',
        }}>
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit}>
            <div style={{
              position: 'relative',
              maxWidth: '680px',
              margin: '0 auto',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={19}
                  color="var(--primary-700)"
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeSuggestion && e.target.value.toLowerCase() !== activeSuggestion.toLowerCase()) {
                      setActiveSuggestion('');
                    }
                  }}
                  placeholder="Search meals (e.g. Paneer, Deluxe Thali, Dal, Poha)..."
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 42px',
                    borderRadius: 'var(--radius-full)',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '14.5px',
                    outline: 'none',
                    backgroundColor: 'var(--bg-cream)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary-600)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
                />

                {/* Clear Button inside Input */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                    }}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '11px 24px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '700',
                  fontSize: '14px',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Search size={15} />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Clickable Quick Suggestions (Workable & Instant) */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <span style={{
              fontSize: '12.5px',
              fontWeight: '700',
              color: 'var(--primary-800)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginRight: '4px',
            }}>
              <Flame size={14} color="var(--primary-600)" />
              <span>Suggested:</span>
            </span>

            {POPULAR_SUGGESTIONS.map((sug) => {
              const isSelected = activeSuggestion.toLowerCase() === sug.query.toLowerCase() ||
                (searchQuery.trim().toLowerCase() === sug.query.toLowerCase());

              return (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => handleSuggestionClick(sug.query)}
                  className={`menu-suggestion-pill ${isSelected ? 'active' : ''}`}
                  title={`Filter by ${sug.label}`}
                >
                  <span style={{ fontSize: '13px' }}>{sug.icon}</span>
                  <span>{sug.label}</span>
                  {isSelected && <X size={12} style={{ marginLeft: '2px' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Filter Pills (Scrollable & Responsive) */}
        <div style={{ marginBottom: '28px' }}>
          <div className="category-scroll-container">
            {CATEGORY_TABS.map((cat) => {
              const isActive = selectedCategory === cat.key;
              const count = categoryCounts[cat.key];

              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`category-tab-btn ${isActive ? 'active' : ''}`}
                >
                  <span style={{ fontSize: '15px' }}>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {count !== undefined && (
                    <span className="category-tab-count">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Metadata Bar & Sort Filter */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
          padding: '0 4px',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{meals.length}</strong> {meals.length === 1 ? 'fresh meal' : 'fresh meals'}
            {selectedCategory !== 'All' && (
              <span> in <strong style={{ color: 'var(--primary-800)' }}>{selectedCategory}</strong></span>
            )}
            {searchQuery && (
              <span> matching "<strong style={{ color: 'var(--primary-800)' }}>{searchQuery}</strong>"</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={15} color="var(--text-tertiary)" />
            <label htmlFor="menu-sort" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Sort:
            </label>
            <select
              id="menu-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <option value="rating">Top Rated ⭐</option>
              <option value="featured">Today's Specials ✨</option>
              <option value="price_asc">Price: Low to High ₹</option>
              <option value="price_desc">Price: High to Low ₹</option>
              <option value="newest">Newest Additions</option>
            </select>
          </div>
        </div>

        {/* Error Alert if any */}
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

        {/* Loading Skeletons */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
            gap: '24px',
          }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
                <div className="skeleton-box" style={{ height: '200px', width: '100%' }} />
                <div style={{ padding: '18px' }}>
                  <div className="skeleton-box" style={{ height: '20px', width: '65%', marginBottom: '12px' }} />
                  <div className="skeleton-box" style={{ height: '14px', width: '90%', marginBottom: '8px' }} />
                  <div className="skeleton-box" style={{ height: '14px', width: '75%', marginBottom: '18px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton-box" style={{ height: '24px', width: '70px' }} />
                    <div className="skeleton-box" style={{ height: '34px', width: '90px', borderRadius: '20px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : meals.length === 0 ? (
          /* Empty Search Results State */
          <div className="card" style={{ textAlign: 'center', padding: '56px 20px', maxWidth: '520px', margin: '0 auto' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <Utensils size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
              No dishes found
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              We couldn't find any meals matching <strong>"{searchQuery}"</strong> in <strong>{selectedCategory}</strong>.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                setActiveSuggestion('');
                fetchMeals('All', '', 'rating');
              }}
              className="btn btn-primary"
              style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)' }}
            >
              <span>Reset Filters & Show All Meals</span>
            </button>
          </div>
        ) : (
          /* Meal Cards Grid */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
            gap: '24px',
          }}>
            {meals.map((meal) => {
              const cartItem = items.find((i) => i.meal?._id === meal._id || i.meal === meal._id);
              const inCartQty = cartItem ? cartItem.quantity : 0;
              const isAdding = addingMealId === meal._id;

              return (
                <div
                  key={meal._id}
                  className="food-card"
                  style={{
                    border: meal.isFeatured ? '2px solid var(--accent-gold-400)' : '1px solid rgba(234, 88, 12, 0.1)',
                  }}
                >
                  {/* Today's Special / Featured Ribbon */}
                  {meal.isFeatured && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 3,
                      backgroundColor: 'var(--primary-800)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                      letterSpacing: '0.4px',
                    }}>
                      <Sparkles size={12} color="#fab005" />
                      <span>TODAY'S SPECIAL</span>
                    </div>
                  )}

                  {/* Meal Thumbnail Banner with Zoom Effect */}
                  <div className="food-card-img-wrapper">
                    <img
                      src={getMealImage(meal.image)}
                      alt={meal.name}
                      className="food-card-img"
                    />

                    {/* Pure Veg Badge on Image */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      zIndex: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '4px 6px',
                      borderRadius: '6px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span className="veg-indicator" title="100% Pure Vegetarian" />
                      <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#16a34a' }}>VEG</span>
                    </div>

                    {/* Star Rating Badge */}
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.78)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      zIndex: 2
                    }}>
                      <Star size={12} color="#fab005" fill="#fab005" />
                      <span>{meal.rating || '4.8'}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Category & Availability Line */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {meal.category}
                      </span>

                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: meal.isAvailable ? 'var(--veg-700)' : 'var(--status-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {meal.isAvailable ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Fresh Today</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Sold Out</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Meal Name */}
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '800',
                      marginBottom: '6px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.35,
                    }}>
                      {meal.name}
                    </h3>

                    {/* Appetizing Description */}
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}>
                      {meal.description}
                    </p>

                    {/* Ingredients Pills */}
                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                        {meal.ingredients.slice(0, 3).map((ing, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-secondary)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-xs)',
                              fontWeight: '500',
                            }}
                          >
                            {ing}
                          </span>
                        ))}
                        {meal.ingredients.length > 3 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                            +{meal.ingredients.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer: Price & Action Buttons */}
                    <div style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginTop: 'auto',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '600' }}>Price</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-900)' }}>
                          {formatCurrency(meal.price)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Link
                          to={`/menu/${meal.slug || meal._id}`}
                          className="btn btn-secondary"
                          style={{ padding: '7px 12px', fontSize: '12.5px', borderRadius: 'var(--radius-sm)' }}
                        >
                          <span>Details</span>
                        </Link>

                        {inCartQty > 0 ? (
                          <div className="qty-stepper" title="Update Quantity in Cart">
                            <button
                              type="button"
                              onClick={() => {
                                if (inCartQty === 1) {
                                  removeFromCart(meal._id);
                                } else {
                                  updateQuantity(meal._id, inCartQty - 1);
                                }
                              }}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span>{inCartQty}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(meal._id, inCartQty + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={!meal.isAvailable || isAdding}
                            onClick={() => handleAddToCart(meal)}
                            className="btn btn-primary"
                            style={{
                              padding: '7px 14px',
                              fontSize: '12.5px',
                              borderRadius: 'var(--radius-sm)',
                              opacity: meal.isAvailable ? 1 : 0.5,
                              cursor: meal.isAvailable ? 'pointer' : 'not-allowed',
                              boxShadow: 'var(--shadow-xs)',
                              touchAction: 'manipulation',
                            }}
                            title={meal.isAvailable ? 'Add to Tiffin Order' : 'Item is sold out'}
                          >
                            {isAdding ? (
                              <>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Adding...</span>
                              </>
                            ) : feedbackMealId === meal._id ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Added!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag size={13} />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Floating View Cart Pill for Mobile when cart has items */}
      {totalItems > 0 && (
        <Link
          to="/cart"
          className="floating-mobile-cart-bar"
          title="Open your cart"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} />
            <span style={{ fontWeight: '700', fontSize: '14px' }}>
              {totalItems} {totalItems === 1 ? 'tiffin' : 'tiffins'} added
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '14.5px' }}>
            <span>View Cart</span>
            <ArrowRight size={16} />
          </div>
        </Link>
      )}
    </div>
  );
}
