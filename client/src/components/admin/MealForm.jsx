import React, { useState, useEffect } from 'react';
import { X, Plus, Save, AlertCircle, Sparkles, Utensils } from 'lucide-react';
import { MEAL_CATEGORIES } from '../../services/mealService';

const AVAILABLE_CATEGORIES = MEAL_CATEGORIES.filter((c) => c !== 'All');

export default function MealForm({ initialData = null, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Lunch',
    image: '/assets/hero-thali.jpg',
    ingredients: [],
    isAvailable: true,
    isFeatured: false,
  });

  const [ingredientInput, setIngredientInput] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price !== undefined ? initialData.price : '',
        category: initialData.category || 'Lunch',
        image: (initialData.image && !initialData.image.includes('/src/assets/')) ? initialData.image : '/assets/hero-thali.jpg',
        ingredients: Array.isArray(initialData.ingredients) ? [...initialData.ingredients] : [],
        isAvailable: initialData.isAvailable !== undefined ? initialData.isAvailable : true,
        isFeatured: initialData.isFeatured !== undefined ? initialData.isFeatured : false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Lunch',
        image: '/assets/hero-thali.jpg',
        ingredients: ['Fresh Spices', 'Whole Wheat', 'Pure Desi Ghee'],
        isAvailable: true,
        isFeatured: false,
      });
    }
    setFormError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      const trimmed = ingredientInput.trim();
      if (!formData.ingredients.includes(trimmed)) {
        setFormData((prev) => ({
          ...prev,
          ingredients: [...prev.ingredients, trimmed],
        }));
      }
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (ingToRemove) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((i) => i !== ingToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please provide a meal name.');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Please provide a meal description.');
      return;
    }

    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      setFormError('Please provide a valid non-negative price.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        price: Number(formData.price),
      });
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to save meal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div className="card modal-dialog-card" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: '#ffffff',
        padding: 'clamp(16px, 4vw, 32px)',
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Utensils size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '19px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {initialData ? 'Edit Meal Item' : 'Add New Meal Item'}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
                {initialData ? 'Update recipe, pricing or availability' : 'Create a fresh meal for the customer menu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              color: 'var(--text-tertiary)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div style={{
            backgroundColor: 'rgba(250, 82, 82, 0.1)',
            border: '1px solid rgba(250, 82, 82, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            color: 'var(--status-danger)',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          {/* Meal Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Meal Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Special Punjabi Paneer Thali"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of sabzis, rotis, rice, dal, and accompaniments..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13.5px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Price & Category in 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                step="1"
                value={formData.price}
                onChange={handleChange}
                placeholder="140"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                {AVAILABLE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Image URL / Path
            </label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="/assets/hero-thali.jpg or https://..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
          </div>

          {/* Dynamic Ingredients */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              Key Ingredients
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIngredient();
                  }
                }}
                placeholder="e.g. Fresh Paneer, Desi Ghee"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleAddIngredient}
                className="btn btn-secondary"
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </div>

            {/* Ingredients Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {formData.ingredients.map((ing) => (
                <span
                  key={ing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--bg-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span>{ing}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(ing)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-tertiary)',
                      padding: 0,
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Toggles (Available & Featured) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--bg-subtle)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600' }}>
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: 'var(--veg-700)' }}
              />
              <span>In Stock / Available</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '600' }}>
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-gold-700)' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={14} color="var(--accent-gold-700)" />
                <span>Today's Special</span>
              </span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '9px 18px', fontSize: '14px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '9px 24px', fontSize: '14px' }}
            >
              <Save size={16} />
              <span>{isSubmitting ? 'Saving...' : initialData ? 'Update Meal' : 'Create Meal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
