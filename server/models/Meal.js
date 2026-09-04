import mongoose from 'mongoose';
import { loadDiskCollection, saveDiskCollection } from '../config/localStore.js';
import { generateSlug } from '../utils/slugify.js';

export const MEAL_CATEGORIES = [
  'Daily Tiffin',
  'Lunch',
  'Dinner',
  'Special Thali',
  'Breakfast',
  'Extra Items',
  'Add-ons',
];

const mealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide meal name'],
      trim: true,
      maxlength: [100, 'Meal name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a meal description'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide meal price'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Please select a meal category'],
      enum: {
        values: MEAL_CATEGORIES,
        message: '{VALUE} is not a valid meal category',
      },
      index: true,
    },
    image: {
      type: String,
      default: '/src/assets/hero-thali.jpg',
    },
    ingredients: {
      type: [String],
      default: [],
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate slug if name is modified or slug not present
mealSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = generateSlug(this.name);
  }
  next();
});

const MongooseMeal = mongoose.models.Meal || mongoose.model('Meal', mealSchema);

// Persistent disk-backed store for development resilience
const inMemoryMeals = loadDiskCollection('meals');

class MealDocument {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new mongoose.Types.ObjectId().toString();
    this.name = data.name?.trim();
    this.slug = data.slug || generateSlug(this.name);
    this.description = data.description?.trim();
    this.price = Number(data.price);
    this.category = data.category;
    this.image = data.image || '/src/assets/hero-thali.jpg';
    this.ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
    this.isAvailable = data.isAvailable !== undefined ? Boolean(data.isAvailable) : true;
    this.isFeatured = data.isFeatured !== undefined ? Boolean(data.isFeatured) : false;
    this.rating = data.rating !== undefined ? Number(data.rating) : 4.8;
    this.totalOrders = data.totalOrders !== undefined ? Number(data.totalOrders) : 0;
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    if (!this.slug) {
      this.slug = generateSlug(this.name);
    }
    inMemoryMeals.set(this._id.toString(), this);
    saveDiskCollection('meals', inMemoryMeals);
    return this;
  }
}

const Meal = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeal.create(data);
    }

    let slug = generateSlug(data.name);
    let counter = 1;
    for (const m of inMemoryMeals.values()) {
      if (m.slug === slug) {
        slug = `${generateSlug(data.name)}-${++counter}`;
      }
    }

    const doc = new MealDocument({
      ...data,
      slug,
    });
    inMemoryMeals.set(doc._id.toString(), doc);
    saveDiskCollection('meals', inMemoryMeals);
    return doc;
  },

  findOne(query) {
    const execute = async () => {
      if (mongoose.connection.readyState === 1) {
        return await MongooseMeal.findOne(query);
      }
      for (const meal of inMemoryMeals.values()) {
        let match = true;
        if (query.slug && meal.slug !== query.slug) match = false;
        if (query._id && meal._id.toString() !== query._id.toString()) match = false;
        if (query.name && meal.name.toLowerCase() !== query.name.toLowerCase()) match = false;
        if (match) return new MealDocument(meal);
      }
      return null;
    };

    return {
      then(resolve, reject) {
        return execute().then(resolve, reject);
      },
      catch(reject) {
        return execute().catch(reject);
      },
    };
  },

  findById(id) {
    const stringId = id?.toString();
    const execute = async () => {
      if (mongoose.connection.readyState === 1) {
        return await MongooseMeal.findById(stringId);
      }
      const meal = inMemoryMeals.get(stringId);
      return meal ? new MealDocument(meal) : null;
    };

    return {
      then(resolve, reject) {
        return execute().then(resolve, reject);
      },
      catch(reject) {
        return execute().catch(reject);
      },
    };
  },

  find(query = {}) {
    const execute = async (sortOption = null) => {
      if (mongoose.connection.readyState === 1) {
        let q = MongooseMeal.find(query);
        if (sortOption) q = q.sort(sortOption);
        return await q;
      }

      let results = [];
      for (const meal of inMemoryMeals.values()) {
        let match = true;

        if (query.category && query.category !== 'All' && meal.category !== query.category) {
          match = false;
        }

        if (query.isFeatured !== undefined && meal.isFeatured !== query.isFeatured) {
          match = false;
        }

        if (query.isAvailable !== undefined && meal.isAvailable !== query.isAvailable) {
          match = false;
        }

        if (query.$or) {
          const matchedOr = query.$or.some((cond) => {
            if (cond.name?.$regex && cond.name.$regex.test(meal.name)) {
              return true;
            }
            if (cond.description?.$regex && cond.description.$regex.test(meal.description)) {
              return true;
            }
            if (cond.ingredients?.$in && Array.isArray(meal.ingredients)) {
              const regex = Array.isArray(cond.ingredients.$in)
                ? cond.ingredients.$in[0]
                : cond.ingredients.$in;
              if (regex && regex.test) {
                return meal.ingredients.some((ing) => regex.test(ing));
              }
            }
            return false;
          });
          if (!matchedOr) match = false;
        }

        if (match) {
          results.push(new MealDocument(meal));
        }
      }

      // Handle in-memory sorting
      if (sortOption) {
        if (typeof sortOption === 'string') {
          if (sortOption === '-createdAt') {
            results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          } else if (sortOption === 'price') {
            results.sort((a, b) => a.price - b.price);
          } else if (sortOption === '-price') {
            results.sort((a, b) => b.price - a.price);
          } else if (sortOption === '-rating') {
            results.sort((a, b) => b.rating - a.rating);
          }
        }
      }

      return results;
    };

    let chosenSort = null;
    const queryObj = {
      sort(opt) {
        chosenSort = opt;
        return queryObj;
      },
      then(resolve, reject) {
        return execute(chosenSort).then(resolve, reject);
      },
      catch(reject) {
        return execute(chosenSort).catch(reject);
      },
    };
    return queryObj;
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const stringId = id?.toString();
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeal.findByIdAndUpdate(stringId, update, options);
    }

    const meal = inMemoryMeals.get(stringId);
    if (!meal) return null;

    if (update.name) {
      meal.name = update.name.trim();
      meal.slug = generateSlug(update.name);
    }
    if (update.description !== undefined) meal.description = update.description.trim();
    if (update.price !== undefined) meal.price = Number(update.price);
    if (update.category !== undefined) meal.category = update.category;
    if (update.image !== undefined) meal.image = update.image;
    if (update.ingredients !== undefined) meal.ingredients = update.ingredients;
    if (update.isAvailable !== undefined) meal.isAvailable = Boolean(update.isAvailable);
    if (update.isFeatured !== undefined) meal.isFeatured = Boolean(update.isFeatured);
    if (update.rating !== undefined) meal.rating = Number(update.rating);

    meal.updatedAt = new Date();
    inMemoryMeals.set(stringId, meal);
    saveDiskCollection('meals', inMemoryMeals);
    return new MealDocument(meal);
  },

  async findByIdAndDelete(id) {
    const stringId = id?.toString();
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeal.findByIdAndDelete(stringId);
    }
    const meal = inMemoryMeals.get(stringId);
    if (!meal) return null;
    inMemoryMeals.delete(stringId);
    saveDiskCollection('meals', inMemoryMeals);
    return meal;
  },

  async countDocuments(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeal.countDocuments(query);
    }
    const list = await this.find(query);
    return list.length;
  },

  async aggregate(pipeline = []) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseMeal.aggregate(pipeline);
    }
    return [];
  },
};

export { MongooseMeal };
export default Meal;
