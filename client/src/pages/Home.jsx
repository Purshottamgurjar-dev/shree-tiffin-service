import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Utensils, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Star,
  Flame,
  Clock,
  Truck,
  Heart,
  Award,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Leaf,
  Check,
  PhoneCall,
  CalendarCheck,
  LogIn,
  UserPlus,
  HelpCircle,
  CheckCircle,
  Smile
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import heroThali from '../assets/hero-thali.jpg';
import { getMealImage, formatCurrency } from '../utils';

// FAQ Content
const FAQ_ITEMS = [
  {
    q: "Which areas in Indore do you deliver fresh tiffins to?",
    a: "We deliver across all prime localities including Vijay Nagar, Bhawarkua, Old & New Palasia, Geeta Bhawan, Annapurna, Saket, LIG Colony, Rajendra Nagar, and Super Corridor. Both home and office deliveries are available on time."
  },
  {
    q: "Do you offer pure Jain food without onion & garlic?",
    a: "Yes, 100%! We maintain dedicated cookware and prep zones for our Jain customers. All Jain tiffins are prepared strictly without onion, garlic, or root vegetables, adhering to authentic satvik traditions with fresh paneer and pure spices."
  },
  {
    q: "What are your ordering cutoff times for Lunch & Dinner?",
    a: "For Afternoon Lunch, please place your order by 12:30 PM (delivery between 12:45 PM – 1:45 PM). For Evening Dinner, please order by 7:30 PM (delivery between 7:45 PM – 9:00 PM)."
  },
  {
    q: "Are the meals packed in hot insulated stainless steel tiffins?",
    a: "Yes! Subscribers receive their meals in multi-tiered, food-grade stainless steel insulated tiffins that lock in heat for over 2 hours without harmful plastic contact. Single orders arrive in food-grade recyclable containers."
  },
  {
    q: "Can I pause my monthly meal subscription when I travel?",
    a: "Absolutely! You have complete freedom. You can pause, skip, or resume your subscription with 1 click from your Profile page or by WhatsApp before 9:00 AM without losing any of your subscription balance."
  }
];

// Testimonials
const TESTIMONIALS = [
  {
    name: "Rohan Sharma",
    role: "Software Engineer",
    location: "Vijay Nagar, Indore",
    rating: 5,
    tag: "Monthly Subscriber",
    quote: "Living away from home, finding healthy, non-greasy food was impossible until I subscribed to Shree Tiffin. The dal tadka, soft phulkas, and fresh seasonal sabzi taste exactly like my mom cooked them in Rajasthan. 100% desi ghee, zero heavy restaurant oil!"
  },
  {
    name: "Priya Patel",
    role: "UPSC Aspirant",
    location: "Bhawarkua, Indore",
    rating: 5,
    tag: "Daily Lunch & Dinner",
    quote: "Affordable, always steaming hot, and delivered strictly before 1:00 PM every single day. Eating clean homestyle food keeps my energy high for 10-hour study sessions. The Deluxe Paneer Thali is unbeatable!"
  },
  {
    name: "Dr. Vikram Verma",
    role: "Physician",
    location: "Palasia, Indore",
    rating: 5,
    tag: "Health Conscious",
    quote: "As a doctor, hygiene, low acidity, and quality of cooking medium are paramount. Shree Tiffin's use of pure cow ghee, no artificial preservatives, and stainless steel insulated containers makes them the benchmark daily food service in Indore."
  }
];

// Trust Pillars
const TRUST_PILLARS = [
  {
    icon: Flame,
    color: '#ea580c',
    bg: '#fff7ed',
    title: "100% Shuddh Desi Ghee",
    desc: "Every dish is tempered in pure desi cow ghee. We never use cheap palm oil or artificial food coloring."
  },
  {
    icon: Utensils,
    color: '#d97706',
    bg: '#fef3c7',
    title: "Tawa-Fresh Sharbati Phulkas",
    desc: "Soft, hot rotis rolled from MP Sehore Sharbati wheat, packed straight off the iron tawa with a light brush of ghee."
  },
  {
    icon: Leaf,
    color: '#16a34a',
    bg: '#f0fdf4',
    title: "100% Pure Veg & Jain Safe",
    desc: "Strictly vegetarian kitchen with separate utensils and special satvik Jain meal options without onion or garlic."
  },
  {
    icon: ShieldCheck,
    color: '#0284c7',
    bg: '#f0f9ff',
    title: "Eco Stainless Steel Tiffins",
    desc: "No hot plastic contamination. We deliver meals in high-grade insulated multi-tier stainless tiffins that preserve nutrition."
  },
  {
    icon: Clock,
    color: '#9333ea',
    bg: '#faf5ff',
    title: "Punctual Doorstep Delivery",
    desc: "Rain or shine, our dedicated delivery fleet ensures your lunch and dinner arrive right on time, hot and appetizing."
  },
  {
    icon: Award,
    color: '#e11d48',
    bg: '#fff1f2',
    title: "Flexible Meal Pausing",
    desc: "Travelling or eating out? Easily pause your tiffin plan with 1-click on your profile without losing your balance."
  }
];

// 3-Step Journey
const STEPS = [
  {
    step: "1",
    title: "Select Your Homestyle Meal",
    desc: "Choose from our daily rotating menu of Standard Ghar Ki Thali, Deluxe Maharaja Thali, or Satvik Jain meals."
  },
  {
    step: "2",
    title: "Cooked Fresh Every Morning",
    desc: "Handcrafted fresh each morning by seasoned homestyle cooks with hand-ground spices and pure desi ghee."
  },
  {
    step: "3",
    title: "Delivered Steaming Hot",
    desc: "Dispatched straight from the tawa in insulated thermal containers right to your home or office desk on time."
  }
];

// Fallback curated meals if DB is loading or empty
const FALLBACK_SPECIALS = [
  {
    _id: "deluxe-paneer-thali",
    name: "Deluxe Paneer Maharaja Thali",
    category: "Special Thali",
    price: 160,
    description: "Shahi Shuddh Ghee Paneer, Homestyle Dal Tadka, Seasonal Sukhi Sabzi, 4 Tawa Phulkas with Desi Ghee, Jeera Rice, Fresh Salad & Gulab Jamun.",
    rating: 4.9,
    image: heroThali
  },
  {
    _id: "standard-ghar-thali",
    name: "Ghar Ki Shuddh Tiffin Thali",
    category: "Daily Tiffin",
    price: 110,
    description: "Aloo Gobhi Matar Masala, Yellow Dal Fry, 4 Tawa Phulkas, Steamed Rice, Fried Papad, Green Chilli Pickle and Cucumber Salad.",
    rating: 4.8,
    image: heroThali
  },
  {
    _id: "satvik-jain-thali",
    name: "Special Satvik Jain Thali",
    category: "Lunch",
    price: 140,
    description: "Prepared strictly without onion or garlic: Malai Kofta, Moong Dal Tadka, 4 Soft Phulkas, Jeera Rice, Boondi Raita & Sweet of the day.",
    rating: 4.9,
    image: heroThali
  }
];

export default function Home() {
  const { isAuthenticated, user, isOwner } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [featuredMeals, setFeaturedMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [openFaq, setOpenFaq] = useState(0);
  const [addingMealId, setAddingMealId] = useState(null);
  const [feedbackMealId, setFeedbackMealId] = useState(null);
  const [guestToast, setGuestToast] = useState(false);

  // Fetch Featured Meals from MongoDB
  useEffect(() => {
    let isMounted = true;
    const fetchMeals = async () => {
      try {
        const res = await api.get('/meals', { params: { featured: true } });
        if (isMounted) {
          if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
            setFeaturedMeals(res.data.data.slice(0, 3));
          } else {
            // Fetch any available meals if no featured tag
            const allRes = await api.get('/meals');
            if (allRes.data?.success && Array.isArray(allRes.data.data) && allRes.data.data.length > 0) {
              setFeaturedMeals(allRes.data.data.slice(0, 3));
            } else {
              setFeaturedMeals(FALLBACK_SPECIALS);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setFeaturedMeals(FALLBACK_SPECIALS);
        }
      } finally {
        if (isMounted) setLoadingMeals(false);
      }
    };

    fetchMeals();
    return () => { isMounted = false; };
  }, []);

  // Handle Add to Cart
  const handleAddToCart = async (meal) => {
    if (!isAuthenticated) {
      setGuestToast(true);
      setTimeout(() => setGuestToast(false), 4500);
      return;
    }

    setAddingMealId(meal._id);
    const res = await addToCart(meal._id, 1);
    setAddingMealId(null);

    if (res.success) {
      setFeedbackMealId(meal._id);
      setTimeout(() => setFeedbackMealId(null), 2500);
    }
  };

  return (
    <div className="page-bottom-nav-pad" style={{ backgroundColor: 'var(--bg-primary)', paddingBottom: '60px' }}>
      
      {/* 1. Festive Announcement Top Ribbon */}
      <div style={{
        background: 'linear-gradient(90deg, #9a3412 0%, #ea580c 50%, #c2410c 100%)',
        color: '#ffffff',
        padding: '10px 16px',
        textAlign: 'center',
        fontSize: '13.5px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(154, 52, 18, 0.25)',
        letterSpacing: '0.2px'
      }}>
        <Sparkles size={16} className="text-amber-300" />
        <span>
          Ghar Jaisa Swad in Indore • 100% Desi Cow Ghee • Book Lunch by 12:30 PM & Dinner by 7:30 PM
        </span>
        <span style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '700',
          marginLeft: '4px'
        }}>
          FREE DELIVERY
        </span>
      </div>

      {/* Guest Toast Notification */}
      {guestToast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: '#9a3412',
          color: '#ffffff',
          padding: '12px 22px',
          borderRadius: '9999px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: '600',
          maxWidth: '90vw'
        }}>
          <Sparkles size={18} color="#fde047" />
          <span>Please login to add meals to your cart!</span>
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#ffffff',
              color: '#9a3412',
              border: 'none',
              padding: '5px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Login Now →
          </button>
        </div>
      )}

      <div className="container" style={{ paddingTop: '28px' }}>
        
        {/* 2. Hero Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: ' clamp(32px, 5vw, 56px)',
          alignItems: 'center',
          marginBottom: '56px'
        }}>
          
          {/* Left Hero Content */}
          <div>
            {/* Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffedd5',
              border: '1px solid #fdba74',
              borderRadius: '9999px',
              padding: '6px 16px',
              marginBottom: '18px',
              color: '#9a3412',
              fontSize: '13px',
              fontWeight: '700'
            }}>
              <ChefHat size={16} color="#c2410c" />
              <span>Authentic Homestyle Kitchen in Indore</span>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: '900',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              color: 'var(--text-primary)',
              marginBottom: '18px'
            }}>
              Ghar Jaisa Khana, <br />
              <span className="home-gradient-text">Har Roz Garma-Garam.</span>
            </h1>

            {/* Sub-Headline */}
            <p style={{
              fontSize: 'clamp(15px, 2.5vw, 17.5px)',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              marginBottom: '28px',
              maxWidth: '540px'
            }}>
              Freshly cooked homestyle thalis prepared daily in <strong>100% Shuddh Desi Cow Ghee</strong> with soft, tawa-hot Sharbati phulkas and fragrant dal tadka. Delivered on time in insulated stainless steel tiffins across Indore.
            </p>

            {/* CTA Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <Link 
                to="/menu" 
                className="btn btn-primary home-pulse-glow"
                style={{ 
                  padding: '14px 30px', 
                  fontSize: '16px', 
                  fontWeight: '700',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(194, 65, 12, 0.35)'
                }}
              >
                <ShoppingBag size={18} />
                <span>Order Fresh Tiffin Now</span>
                <ArrowRight size={18} />
              </Link>

              {isAuthenticated ? (
                <Link 
                  to="/profile" 
                  className="btn btn-secondary" 
                  style={{ padding: '14px 24px', fontSize: '15px', fontWeight: '600' }}
                >
                  <span>My Profile & Orders</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="btn btn-secondary" 
                  style={{ padding: '14px 24px', fontSize: '15px', fontWeight: '600' }}
                >
                  <LogIn size={16} />
                  <span>Customer Login</span>
                </Link>
              )}
            </div>

            {/* Micro Trust Bullets */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: ' clamp(12px, 3vw, 20px)',
              flexWrap: 'wrap',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: '600'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                No Added Preservatives
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                Pure Desi Cow Ghee
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                Free Prompt Delivery
              </span>
            </div>
          </div>

          {/* Right Hero Image Container with Floating Badges */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px', margin: '0 auto' }}>
            
            {/* Glow backdrop aura */}
            <div style={{
              position: 'absolute',
              inset: '-12px',
              background: 'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, rgba(245, 158, 11, 0.1) 60%, transparent 80%)',
              filter: 'blur(20px)',
              borderRadius: '32px',
              zIndex: 0
            }} />

            {/* Main Hero Card Container */}
            <div style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 45px rgba(154, 52, 18, 0.2)',
              border: '4px solid #ffffff',
              zIndex: 2,
              height: 'clamp(280px, 45vw, 420px)',
              backgroundColor: '#fed7aa'
            }}>
              <img
                src={heroThali}
                alt="Shree Tiffin Service Special Deluxe Maharaja Thali"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.5s ease'
                }}
              />
              
              {/* Image Gradient Banner Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                padding: '24px',
                color: '#ffffff'
              }}>
                <div style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#fde047',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}>
                  Authentic Indore Swad
                </div>
                <div style={{ fontSize: 'clamp(16px, 3.5vw, 20px)', fontWeight: '800', lineHeight: 1.3 }}>
                  Shahi Paneer, Dal Tadka, Seasonal Sabzi & Hot Desi Ghee Phulkas
                </div>
              </div>
            </div>

            {/* Floating Badge 1: Top-Left (Desi Ghee) */}
            <div 
              className="home-floating-badge home-hero-badge-overlay"
              style={{ top: '24px', left: '-18px' }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#fff7ed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Flame size={16} color="#ea580c" />
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#c2410c' }}>100% Desi Cow Ghee</span>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>No Refined Palm Oil</span>
              </div>
            </div>

            {/* Floating Badge 2: Top-Right (Pure Veg & Jain) */}
            <div 
              className="home-floating-badge-rev home-hero-badge-overlay"
              style={{ top: '28px', right: '-18px' }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Leaf size={16} color="#16a34a" />
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a' }}>Pure Veg & Jain Safe</span>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>Separate Cookware</span>
              </div>
            </div>

            {/* Floating Badge 3: Bottom-Right (Rating) */}
            <div 
              className="home-floating-badge home-hero-badge-overlay"
              style={{ bottom: '48px', right: '-16px' }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Star size={16} color="#d97706" fill="#d97706" />
              </div>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#92400e' }}>4.9 / 5.0 Star Rating</span>
                <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>1,200+ Happy Foodies</span>
              </div>
            </div>

            {/* Mobile Fallback Container for Badges if screen is tiny */}
            <div className="home-badges-mobile-container" style={{ display: 'none' }}>
              <span className="badge badge-primary">🧈 100% Desi Cow Ghee</span>
              <span className="badge badge-success">🌿 Pure Veg & Jain Safe</span>
              <span className="badge badge-warning">⭐ 4.9/5 Rating (1,200+ Reviews)</span>
            </div>

          </div>
        </div>

        {/* 3. Live Kitchen Pulse & Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '16px',
          marginBottom: '64px'
        }}>
          
          <div className="home-stat-box">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#fff7ed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c2410c'
            }}>
              <Utensils size={22} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                50,000+
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Hot Tiffins Served
              </div>
            </div>
          </div>

          <div className="home-stat-box">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706'
            }}>
              <Flame size={22} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                100%
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Desi Cow Ghee Used
              </div>
            </div>
          </div>

          <div className="home-stat-box">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a'
            }}>
              <Truck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                30 Mins
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Prompt Hot Dispatch
              </div>
            </div>
          </div>

          <div className="home-stat-box">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: '#faf5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9333ea'
            }}>
              <Star size={22} fill="#9333ea" />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                4.9 / 5.0
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Customer Satisfaction
              </div>
            </div>
          </div>

        </div>

        {/* Quick Food Categories Bar */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(20px, 3.5vw, 26px)', fontWeight: '900', color: 'var(--text-primary)' }}>
                What are you craving today?
              </h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                Freshly cooked homestyle dishes prepared in 100% Shuddh Desi Cow Ghee
              </p>
            </div>
            <Link to="/menu" style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View All Menu</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '10px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}>
            {[
              { label: 'Daily Tiffin', emoji: '🍛', count: 'From ₹110', cat: 'Daily Tiffin' },
              { label: 'Special Thali', emoji: '👑', count: 'From ₹160', cat: 'Special Thali' },
              { label: 'Lunch Meals', emoji: '🥘', count: 'From ₹120', cat: 'Lunch' },
              { label: 'Dinner Boxes', emoji: '🌙', count: 'From ₹110', cat: 'Dinner' },
              { label: 'Breakfast', emoji: '🥞', count: 'From ₹60', cat: 'Breakfast' },
              { label: 'Beverages & Extras', emoji: '🥛', count: 'From ₹25', cat: 'Extra Items' },
            ].map((c, i) => (
              <Link
                key={i}
                to={`/menu?category=${encodeURIComponent(c.cat)}`}
                style={{
                  minWidth: '150px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid var(--border-subtle)',
                  borderRadius: '18px',
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--primary-300)';
                  e.currentTarget.style.boxShadow = '0 10px 24px rgba(194, 65, 12, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                }}
              >
                <span style={{ fontSize: '32px', marginBottom: '8px' }}>{c.emoji}</span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', textAlign: 'center' }}>
                  {c.label}
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--primary-700)', marginTop: '2px' }}>
                  {c.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 4. How It Works - 3-Step Culinary Journey */}
        <div style={{
          backgroundColor: '#fffbf7',
          border: '1px solid #fed7aa',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(28px, 5vw, 44px)',
          marginBottom: '64px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffedd5',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#c2410c',
              marginBottom: '10px'
            }}>
              <Sparkles size={14} />
              <span>Simple & Convenient</span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '900', color: 'var(--text-primary)' }}>
              How Shree Tiffin Works
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Fresh homestyle meals from our motherly kitchen to your dining table in three easy steps.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            gap: '24px'
          }}>
            {STEPS.map((s) => (
              <div 
                key={s.step} 
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #ffedd5',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 20px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div className="home-step-circle">{s.step}</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Today's Chef Specials & Featured Thalis */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#fef3c7',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#b45309',
                marginBottom: '8px'
              }}>
                <Sparkles size={14} />
                <span>Handpicked Today</span>
              </div>
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '900', color: 'var(--text-primary)' }}>
                Today's Special Tiffins & Thalis
              </h2>
              <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Cooked fresh this morning with farm vegetables and pure spices.
              </p>
            </div>

            <Link to="/menu" className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600' }}>
              <span>Explore Complete Menu</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Meals Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
            gap: '24px'
          }}>
            {featuredMeals.map((meal) => {
              const isAdding = addingMealId === meal._id;
              const isAdded = feedbackMealId === meal._id;

              return (
                <div 
                  key={meal._id} 
                  className="food-card" 
                >
                  {/* Meal Image */}
                  <div className="food-card-img-wrapper">
                    <img
                      src={getMealImage(meal.image)}
                      alt={meal.name}
                      className="food-card-img"
                    />
                    
                    {/* Category badge */}
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(154, 52, 18, 0.92)',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      backdropFilter: 'blur(4px)',
                      letterSpacing: '0.3px',
                      zIndex: 2
                    }}>
                      {meal.category || 'Special'}
                    </span>

                    {/* FSSAI Pure Veg Green Indicator */}
                    <span 
                      className="veg-indicator" 
                      title="100% Pure Vegetarian"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 2,
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                      }} 
                    />

                    {/* Rating Pill */}
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: '800',
                      color: '#b45309',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      zIndex: 2
                    }}>
                      <Star size={13} fill="#b45309" />
                      <span>{meal.rating || '4.9'}</span>
                    </div>
                  </div>

                  {/* Meal Content */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.25 }}>
                        {meal.name}
                      </h3>
                    </div>

                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: '18px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1
                    }}>
                      {meal.description}
                    </p>

                    {/* Price & Action Row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '14px',
                      marginTop: 'auto'
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block', fontWeight: '600' }}>
                          Per Tiffin
                        </span>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--primary-900)' }}>
                          ₹{meal.price}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          to={`/menu/${meal.slug || meal._id}`}
                          className="btn btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '12px', fontWeight: '600' }}
                          title="View detailed menu"
                        >
                          Details
                        </Link>

                        <button
                          onClick={() => handleAddToCart(meal)}
                          disabled={isAdding}
                          className="btn btn-primary"
                          style={{
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: '700',
                            backgroundColor: isAdded ? '#16a34a' : undefined,
                            borderColor: isAdded ? '#16a34a' : undefined
                          }}
                        >
                          {isAdded ? (
                            <>
                              <Check size={14} />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={14} />
                              <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Why Choose Shree Tiffin (6 Pillars of Trust) */}
        <div style={{ marginBottom: '64px' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 36px auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffedd5',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#c2410c',
              marginBottom: '10px'
            }}>
              <ShieldCheck size={15} />
              <span>Unmatched Quality & Care</span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '900', color: 'var(--text-primary)' }}>
              Why Indore Loves Shree Tiffin Service
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              We cook with the same purity, care, and attention that your mother does at home.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))',
            gap: '20px'
          }}>
            {TRUST_PILLARS.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <div key={idx} className="home-trust-card">
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: p.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: p.color,
                    marginBottom: '16px'
                  }}>
                    <IconComp size={24} />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                    {p.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7. Real Customer Reviews & Wall of Love */}
        <div style={{
          backgroundColor: '#fffbf7',
          border: '1px solid #fed7aa',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(28px, 5vw, 44px)',
          marginBottom: '64px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#fef3c7',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#b45309',
              marginBottom: '10px'
            }}>
              <Heart size={14} fill="#ea580c" color="#ea580c" />
              <span>Real Customer Stories</span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: '900', color: 'var(--text-primary)' }}>
              Loved by Students, Doctors & Professionals
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Over 1,200 foodies across Indore depend on us for their daily nourishing meals.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '24px'
          }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="home-review-card">
                <div>
                  {/* Star Rating */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
                    {[...Array(t.rating)].map((_, rIdx) => (
                      <Star key={rIdx} size={16} fill="#f59e0b" color="#f59e0b" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '20px' }}>
                    "{t.quote}"
                  </p>
                </div>

                {/* Customer Info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {t.role} • {t.location}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor: '#ffedd5',
                    color: '#9a3412',
                    padding: '3px 8px',
                    borderRadius: '9999px'
                  }}>
                    {t.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 8. Interactive FAQ Accordion */}
        <div style={{ maxWidth: '800px', margin: '0 auto 64px auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffedd5',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#c2410c',
              marginBottom: '10px'
            }}>
              <HelpCircle size={15} />
              <span>Got Questions?</span>
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: '900', color: 'var(--text-primary)' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Everything you need to know about our daily tiffin delivery in Indore.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className="home-faq-toggle"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                    <span style={{ fontSize: '15.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {item.q}
                    </span>
                    <div style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      color: 'var(--text-secondary)'
                    }}>
                      <ChevronDown size={18} />
                    </div>
                  </div>
                  {isOpen && (
                    <p style={{
                      marginTop: '12px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      borderTop: '1px dashed var(--border-subtle)',
                      paddingTop: '10px'
                    }}>
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 9. Bottom Hero Call to Action Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(32px, 6vw, 56px) clamp(20px, 4vw, 40px)',
          color: '#ffffff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(154, 52, 18, 0.3)'
        }}>
          {/* Subtle decorative circles in background */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.08)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.06)'
          }} />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '16px',
              backdropFilter: 'blur(6px)'
            }}>
              <Flame size={16} color="#fde047" />
              <span>Fresh Tiffins Dispatched Daily</span>
            </div>

            <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '900', lineHeight: 1.2, marginBottom: '16px' }}>
              Craving Ghar Ka Swad Today?
            </h2>

            <p style={{ fontSize: 'clamp(15px, 2.5vw, 17px)', opacity: 0.9, lineHeight: 1.6, marginBottom: '32px' }}>
              Skip heavy restaurant oils and cooking chores. Subscribe to healthy, hygienic, home-cooked food delivered right to your doorstep.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                to="/menu"
                className="btn home-pulse-glow"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#9a3412',
                  padding: '14px 32px',
                  fontSize: '16px',
                  fontWeight: '800',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}
              >
                <ShoppingBag size={18} />
                <span>Order Hot Tiffin Now</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="https://wa.me/919876543210?text=Hello%20Shree%20Tiffin%20Service%2C%20I%20want%20to%20know%20more%20about%20your%20daily%20meals"
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-md)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <PhoneCall size={16} />
                <span>WhatsApp Helpline</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
