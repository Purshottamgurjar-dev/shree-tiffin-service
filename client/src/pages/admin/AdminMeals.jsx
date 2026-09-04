import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft,
  Utensils,
  Layers
} from 'lucide-react';
import mealService, { MEAL_CATEGORIES } from '../../services/mealService';
import MealForm from '../../components/admin/MealForm';
import { formatCurrency } from '../../utils';

export default function AdminMeals() {
  const [meals, setMeals] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, unavailable: 0, featured: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal & Edit State
  const [formOpen, setFormOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);

  // Delete Confirmation State
  const [deletingMeal, setDeletingMeal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert Feedback
  const [feedback, setFeedback] = useState(null);

  const fetchMealsData = async () => {
    setLoading(true);
    try {
      const [mealsRes, statsRes] = await Promise.all([
        mealService.getMeals({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: searchQuery.trim() || undefined,
        }),
        mealService.getMealStats(),
      ]);

      if (mealsRes.success) {
        setMeals(mealsRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to fetch meals' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMealsData();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMealsData();
  };

  // Toggle Availability
  const handleToggleAvailability = async (meal) => {
    try {
      const res = await mealService.toggleAvailability(meal._id);
      if (res.success) {
        setMeals((prev) =>
          prev.map((m) => (m._id === meal._id ? { ...m, isAvailable: res.data.isAvailable } : m))
        );
        fetchMealsData(); // update stats
        setFeedback({
          type: 'success',
          message: `"${meal.name}" is now ${res.data.isAvailable ? 'Available' : 'Unavailable'}.`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update availability.' });
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (meal) => {
    try {
      const res = await mealService.toggleFeatured(meal._id);
      if (res.success) {
        setMeals((prev) =>
          prev.map((m) => (m._id === meal._id ? { ...m, isFeatured: res.data.isFeatured } : m))
        );
        fetchMealsData();
        setFeedback({
          type: 'success',
          message: `"${meal.name}" featured status updated.`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update featured status.' });
    }
  };

  // Save Meal (Add or Update)
  const handleSaveMeal = async (mealData) => {
    if (editingMeal) {
      const res = await mealService.updateMeal(editingMeal._id, mealData);
      setFeedback({ type: 'success', message: `Meal "${mealData.name}" updated successfully!` });
    } else {
      const res = await mealService.createMeal(mealData);
      setFeedback({ type: 'success', message: `Meal "${mealData.name}" created successfully!` });
    }
    fetchMealsData();
  };

  // Delete Meal
  const confirmDelete = async () => {
    if (!deletingMeal) return;
    setIsDeleting(true);
    try {
      await mealService.deleteMeal(deletingMeal._id);
      setFeedback({ type: 'success', message: `Meal "${deletingMeal.name}" was deleted.` });
      setDeletingMeal(null);
      fetchMealsData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete meal.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>
          <Link
            to="/admin/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Kitchen Menu Management
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            Real-time control over active meals, pricing, ingredients, and daily availability
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMeal(null);
            setFormOpen(true);
          }}
          className="btn btn-primary"
          style={{ padding: '10px 22px', fontSize: '14px' }}
        >
          <Plus size={16} />
          <span>Add New Meal</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div style={{
          backgroundColor: feedback.type === 'success' ? 'var(--veg-50)' : 'rgba(250, 82, 82, 0.1)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--veg-100)' : 'rgba(250, 82, 82, 0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: feedback.type === 'success' ? 'var(--veg-700)' : 'var(--status-danger)',
          fontSize: '13.5px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ color: 'inherit' }}>
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600', marginBottom: '6px' }}>
            TOTAL MENU ITEMS
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {stats.total}
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--veg-700)', fontWeight: '600', marginBottom: '6px' }}>
            AVAILABLE TODAY
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--veg-700)' }}>
            {stats.available}
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--status-danger)', fontWeight: '600', marginBottom: '6px' }}>
            OUT OF STOCK
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--status-danger)' }}>
            {stats.unavailable}
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: 'var(--accent-gold-700)', fontWeight: '600', marginBottom: '6px' }}>
            TODAY'S SPECIALS
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--accent-gold-700)' }}>
            {stats.featured}
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="card" style={{ padding: '18px 22px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          {/* Category selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13.5px',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
            >
              {MEAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-tertiary)" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search meal name or ingredient..."
                style={{
                  width: '100%',
                  padding: '8px 14px 8px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13.5px',
                  outline: 'none',
                }}
              />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Meals Table */}
      <div className="card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div>Loading live meal records from database...</div>
          </div>
        ) : meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Utensils size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>No meals found</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Try adjusting your search query or add a new meal to the menu.
            </p>
            <button
              onClick={() => {
                setEditingMeal(null);
                setFormOpen(true);
              }}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              <Plus size={14} />
              <span>Add Your First Meal</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 14px' }}>Item</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Price</th>
                  <th style={{ padding: '12px 14px' }}>Availability</th>
                  <th style={{ padding: '12px 14px' }}>Special</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {meals.map((meal) => (
                  <tr key={meal._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {/* Item with Thumbnail */}
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={meal.image || '/src/assets/hero-thali.jpg'}
                          alt={meal.name}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {meal.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {meal.description}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '14px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                        {meal.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {formatCurrency(meal.price)}
                    </td>

                    {/* Availability Switch */}
                    <td style={{ padding: '14px' }}>
                      <button
                        onClick={() => handleToggleAvailability(meal)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: meal.isAvailable ? 'var(--veg-50)' : 'rgba(250, 82, 82, 0.1)',
                          color: meal.isAvailable ? 'var(--veg-700)' : 'var(--status-danger)',
                          border: `1px solid ${meal.isAvailable ? 'var(--veg-100)' : 'rgba(250, 82, 82, 0.2)'}`,
                          cursor: 'pointer',
                        }}
                      >
                        {meal.isAvailable ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Featured Toggle */}
                    <td style={{ padding: '14px' }}>
                      <button
                        onClick={() => handleToggleFeatured(meal)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: meal.isFeatured ? 'var(--accent-gold-50)' : 'var(--bg-subtle)',
                          color: meal.isFeatured ? 'var(--accent-gold-700)' : 'var(--text-tertiary)',
                          border: `1px solid ${meal.isFeatured ? 'var(--accent-gold-300)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={13} />
                        <span>{meal.isFeatured ? "Today's Special" : 'Standard'}</span>
                      </button>
                    </td>

                    {/* Actions (Edit / Delete) */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingMeal(meal);
                            setFormOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12.5px' }}
                          title="Edit meal details"
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingMeal(meal)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--status-danger)',
                            backgroundColor: 'rgba(250, 82, 82, 0.1)',
                          }}
                          title="Delete meal"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Meal Modal */}
      <MealForm
        isOpen={formOpen}
        initialData={editingMeal}
        onClose={() => {
          setFormOpen(false);
          setEditingMeal(null);
        }}
        onSave={handleSaveMeal}
      />

      {/* Delete Confirmation Modal */}
      {deletingMeal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: '32px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(250, 82, 82, 0.1)',
              color: 'var(--status-danger)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
              Confirm Meal Deletion
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to permanently delete <strong>"{deletingMeal.name}"</strong>? This will remove it from the customer menu.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={() => setDeletingMeal(null)}
                className="btn btn-secondary"
                style={{ padding: '9px 20px', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn"
                style={{
                  backgroundColor: 'var(--status-danger)',
                  color: '#ffffff',
                  padding: '9px 22px',
                  fontSize: '14px',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Meal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
