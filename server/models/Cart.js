import mongoose from 'mongoose';
import { loadDiskCollection, saveDiskCollection } from '../config/localStore.js';

const cartItemSchema = new mongoose.Schema(
  {
    meal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal',
      required: [true, 'Meal reference is required'],
    },
    nameSnapshot: {
      type: String,
      trim: true,
    },
    priceSnapshot: {
      type: Number,
      min: [0, 'Price cannot be negative'],
    },
    imageSnapshot: {
      type: String,
      default: '/src/assets/hero-thali.jpg',
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
      default: 1,
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for cart'],
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative'],
    },
    totalItems: {
      type: Number,
      default: 0,
      min: [0, 'Total items cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ 'items.meal': 1 });

const MongooseCart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

// Persistent disk-backed fallback store for resilient local development
const inMemoryCarts = loadDiskCollection('carts'); // key: userId.toString()

class CartDocument {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new mongoose.Types.ObjectId().toString();
    this.user = data.user ? data.user.toString() : null;
    this.items = Array.isArray(data.items)
      ? data.items.map((item) => ({
          _id: item._id ? item._id.toString() : new mongoose.Types.ObjectId().toString(),
          meal: item.meal ? (item.meal._id ? item.meal._id.toString() : item.meal.toString()) : null,
          nameSnapshot: item.nameSnapshot || '',
          priceSnapshot: Number(item.priceSnapshot) || 0,
          imageSnapshot: item.imageSnapshot || '/src/assets/hero-thali.jpg',
          quantity: Math.floor(Number(item.quantity)) || 1,
        }))
      : [];
    this.subtotal = Number(data.subtotal) || 0;
    this.totalItems = Number(data.totalItems) || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    if (this.user) {
      inMemoryCarts.set(this.user.toString(), this);
      saveDiskCollection('carts', inMemoryCarts);
    }
    return this;
  }
}

const Cart = {
  async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseCart.findOne(query).populate('items.meal');
    }

    if (query.user) {
      const uId = query.user._id ? query.user._id.toString() : query.user.toString();
      const existing = inMemoryCarts.get(uId);
      if (existing) {
        // Return cloned instance with populate helper
        const doc = new CartDocument(existing);
        return doc;
      }
    }
    return null;
  },

  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseCart.create(data);
    }

    const uId = data.user ? (data.user._id ? data.user._id.toString() : data.user.toString()) : null;
    if (uId && inMemoryCarts.has(uId)) {
      const err = new Error('Cart already exists for this user');
      err.code = 11000;
      throw err;
    }

    const doc = new CartDocument(data);
    if (uId) {
      inMemoryCarts.set(uId, doc);
      saveDiskCollection('carts', inMemoryCarts);
    }
    return doc;
  },

  async findOneAndDelete(query) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseCart.findOneAndDelete(query);
    }

    if (query.user) {
      const uId = query.user._id ? query.user._id.toString() : query.user.toString();
      const existing = inMemoryCarts.get(uId);
      if (existing) {
        inMemoryCarts.delete(uId);
        saveDiskCollection('carts', inMemoryCarts);
        return existing;
      }
    }
    return null;
  },

  // Reset helper for testing
  _resetStore() {
    inMemoryCarts.clear();
  },
};

export default Cart;
