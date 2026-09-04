import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChefHat, 
  Utensils, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Server, 
  RefreshCw, 
  XCircle,
  LogIn,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import heroThali from '../assets/hero-thali.jpg';
import { getMealImage } from '../utils';

export default function Home() {
  const { isAuthenticated, user, isOwner } = useAuth();
  const [serverStatus, setServerStatus] = useState('checking');
  const [serverData, setServerData] = useState(null);
  const [latency, setLatency] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Featured Meals from MongoDB
  const [featuredMeals, setFeaturedMeals] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const checkHealthAndMeals = async () => {
    setIsRefreshing(true);
    const start = performance.now();
    try {
      const response = await api.get('/health');
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      setServerData(response.data);
      setServerStatus('online');
    } catch (err) {
      setServerStatus('offline');
      setServerData(null);
    } finally {
      setIsRefreshing(false);
    }

    // Fetch Featured Meals from MongoDB
    try {
      const mealsRes = await api.get('/meals', { params: { featured: true } });
      if (mealsRes.data?.success && Array.isArray(mealsRes.data.data)) {
        setFeaturedMeals(mealsRes.data.data);
      }
    } catch (err) {
      console.warn('Featured meals load warning:', err.message);
    } finally {
      setLoadingFeatured(false);
    }
  };

  useEffect(() => {
    checkHealthAndMeals();
  }, []);

  return (
    <div style={{ padding: '40px 0' }}>
      <div className="container">
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 48px auto' }}>
          <div className="badge badge-primary" style={{ marginBottom: '16px' }}>
            <ChefHat size={14} />
            <span>Pure Vegetarian & Homestyle Delicacies</span>
          </div>
          <h1 style={{
            fontSize: '46px',
            fontWeight: '800',
            letterSpacing: '-1px',
            marginBottom: '16px',
            color: 'var(--text-primary)',
          }}>
            Ghar Jaisa Khana, <span style={{ color: 'var(--primary-800)' }}>Har Din.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
            Wholesome, freshly prepared home-style meals made with natural ingredients, delivered hot and on-time to your doorstep.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
                  <span>View My Profile</span>
                  <ArrowRight size={16} />
                </Link>
                {isOwner && (
                  <Link to="/admin/dashboard" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '15px' }}>
                    <ShieldCheck size={16} />
                    <span>Open Owner Dashboard</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}>
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </Link>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }}>
                  <LogIn size={16} />
                  <span>Customer Login</span>
                </Link>
                <Link to="/admin/login" className="btn btn-secondary" style={{ padding: '12px 20px', fontSize: '15px' }}>
                  <ShieldCheck size={16} />
                  <span>Owner Portal</span>
                </Link>
              </>
            )}
          </div>

          {/* Hero Banner Culinary Image */}
          <div style={{
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            border: '4px solid #ffffff',
            maxHeight: '380px',
            position: 'relative',
          }}>
            <img
              src={heroThali}
              alt="Shree Tiffin Service Special Deluxe Thali"
              style={{ width: '100%', height: '380px', objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              padding: '24px 28px',
              color: '#ffffff',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-gold-300)', letterSpacing: '0.5px' }}>
                TRADITIONAL HOMESTYLE COOKING
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800' }}>
                Fresh Phulkas, Fragrant Dal Tadka, Seasonal Sabzis & Paneer Delicacies
              </div>
            </div>
          </div>
        </div>

        {/* Featured Meals Section (From MongoDB) */}
        {featuredMeals.length > 0 && (
          <div style={{ marginBottom: '56px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div className="badge badge-primary" style={{ marginBottom: '6px' }}>
                  <Sparkles size={13} />
                  <span>Chef's Choice</span>
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Today's Special Tiffins & Thalis
                </h2>
              </div>
              <Link to="/menu" className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13.5px' }}>
                <span>Explore Full Menu</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: '24px',
            }}>
              {featuredMeals.map((meal) => (
                <div key={meal._id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', height: '190px' }}>
                    <img
                      src={getMealImage(meal.image)}
                      alt={meal.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span className="badge badge-primary" style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'var(--primary-800)',
                      color: '#ffffff',
                    }}>
                      {meal.category}
                    </span>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '6px' }}>
                      {meal.name}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}>
                      {meal.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '12px',
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-900)' }}>
                        ₹{meal.price}
                      </div>
                      <Link
                        to={`/menu/${meal.slug || meal._id}`}
                        className="btn btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12.5px' }}
                      >
                        <span>View Meal</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 Authentication Verification Summary Card */}
        <div className="card" style={{ maxWidth: '820px', margin: '0 auto 48px auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-800)',
              }}>
                <Server size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Full-Stack Authentication Status</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  Active JWT session and database authentication
                </p>
              </div>
            </div>

            <button
              onClick={checkHealthAndMeals}
              disabled={isRefreshing}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Verify Health</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}>
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Server Health</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '15px' }}>
                {serverStatus === 'online' ? (
                  <>
                    <CheckCircle2 size={16} color="var(--status-success)" />
                    <span style={{ color: 'var(--status-success)' }}>200 OK (Online)</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} color="var(--status-danger)" />
                    <span style={{ color: 'var(--status-danger)' }}>Offline</span>
                  </>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>API Latency</div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                {latency !== null ? `${latency} ms` : '—'}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Session Status</div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)' }}>
                {isAuthenticated ? (
                  <span style={{ color: 'var(--status-success)' }}>Logged In ({user?.role})</span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>Guest (Logged Out)</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
