import Meal, { MEAL_CATEGORIES } from '../models/Meal.js';
import { generateSlug } from '../utils/slugify.js';

// @desc    Get all meals with category, search, featured & availability filters
// @route   GET /api/meals
// @access  Public
export const getMeals = async (req, res, next) => {
  try {
    const { category, search, featured, available, sort } = req.query;

    const query = {};

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Featured filter
    if (featured !== undefined) {
      query.isFeatured = featured === 'true' || featured === true;
    }

    // Availability filter (e.g. for customer menu)
    if (available !== undefined) {
      query.isAvailable = available === 'true' || available === true;
    }

    // Search query (matches name, description, or ingredients)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { ingredients: { $in: [searchRegex] } },
      ];
    }

    // Sorting option
    let sortOption = '-createdAt';
    if (sort === 'price_asc') sortOption = 'price';
    if (sort === 'price_desc') sortOption = '-price';
    if (sort === 'rating') sortOption = '-rating';
    if (sort === 'newest') sortOption = '-createdAt';

    const meals = await Meal.find(query).sort(sortOption);

    return res.status(200).json({
      success: true,
      count: meals.length,
      data: meals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single meal by ID or Slug
// @route   GET /api/meals/:id
// @access  Public
export const getMealById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let meal = null;

    // Check if ID is a valid 24-char hex MongoDB ObjectId
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        meal = await Meal.findById(id);
      } catch (err) {
        meal = null;
      }
    }

    // If not found by ID, try searching by slug
    if (!meal) {
      meal = await Meal.findOne({ slug: id });
    }

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: `Meal with ID or slug "${id}" was not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: meal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new meal
// @route   POST /api/meals
// @access  Private/Owner
export const createMeal = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      ingredients,
      isAvailable,
      isFeatured,
      rating,
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid meal name.',
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a meal description.',
      });
    }

    if (price === undefined || price === null || isNaN(price) || Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid non-negative price.',
      });
    }

    if (!category || !MEAL_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Please select a valid category. Options: ${MEAL_CATEGORIES.join(', ')}`,
      });
    }

    // Clean ingredients
    let cleanedIngredients = [];
    if (Array.isArray(ingredients)) {
      cleanedIngredients = ingredients.map((i) => i.trim()).filter(Boolean);
    } else if (typeof ingredients === 'string') {
      cleanedIngredients = ingredients.split(',').map((i) => i.trim()).filter(Boolean);
    }

    const meal = await Meal.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      image: image?.trim() || '/src/assets/hero-thali.jpg',
      ingredients: cleanedIngredients,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
      rating: rating !== undefined ? Number(rating) : 4.8,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Meal created successfully.',
      data: meal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing meal
// @route   PUT /api/meals/:id
// @access  Private/Owner
export const updateMeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      image,
      ingredients,
      isAvailable,
      isFeatured,
      rating,
    } = req.body;

    const meal = await Meal.findById(id);
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: `Meal not found with ID "${id}".`,
      });
    }

    // Validate price if provided
    if (price !== undefined && (isNaN(price) || Number(price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative.',
      });
    }

    // Validate category if provided
    if (category && !MEAL_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${MEAL_CATEGORIES.join(', ')}`,
      });
    }

    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (price !== undefined) updates.price = Number(price);
    if (category) updates.category = category;
    if (image !== undefined) updates.image = image.trim();
    if (isAvailable !== undefined) updates.isAvailable = Boolean(isAvailable);
    if (isFeatured !== undefined) updates.isFeatured = Boolean(isFeatured);
    if (rating !== undefined) updates.rating = Number(rating);

    if (ingredients !== undefined) {
      if (Array.isArray(ingredients)) {
        updates.ingredients = ingredients.map((i) => i.trim()).filter(Boolean);
      } else if (typeof ingredients === 'string') {
        updates.ingredients = ingredients.split(',').map((i) => i.trim()).filter(Boolean);
      }
    }

    const updatedMeal = await Meal.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Meal updated successfully.',
      data: updatedMeal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a meal
// @route   DELETE /api/meals/:id
// @access  Private/Owner
export const deleteMeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findById(id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found.',
      });
    }

    await Meal.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Meal "${meal.name}" was deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle meal availability
// @route   PATCH /api/meals/:id/availability
// @access  Private/Owner
export const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findById(id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found.',
      });
    }

    const newStatus =
      req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : !meal.isAvailable;

    const updated = await Meal.findByIdAndUpdate(id, { isAvailable: newStatus }, { new: true });

    return res.status(200).json({
      success: true,
      message: `Meal availability set to ${newStatus ? 'Available' : 'Unavailable'}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle meal featured status
// @route   PATCH /api/meals/:id/featured
// @access  Private/Owner
export const toggleFeatured = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findById(id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found.',
      });
    }

    const newStatus =
      req.body.isFeatured !== undefined ? Boolean(req.body.isFeatured) : !meal.isFeatured;

    const updated = await Meal.findByIdAndUpdate(id, { isFeatured: newStatus }, { new: true });

    return res.status(200).json({
      success: true,
      message: `Meal featured status set to ${newStatus ? 'Featured' : 'Standard'}.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get owner meal inventory metrics
// @route   GET /api/meals/admin/stats
// @access  Private/Owner
export const getMealStats = async (req, res, next) => {
  try {
    const allMeals = await Meal.find({});

    const total = allMeals.length;
    const available = allMeals.filter((m) => m.isAvailable).length;
    const unavailable = total - available;
    const featured = allMeals.filter((m) => m.isFeatured).length;

    return res.status(200).json({
      success: true,
      data: {
        total,
        available,
        unavailable,
        featured,
      },
    });
  } catch (error) {
    next(error);
  }
};
