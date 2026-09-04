import mongoose from 'mongoose';
import { loadDiskCollection, saveDiskCollection } from '../config/localStore.js';

export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const orderItemSchema = new mongoose.Schema(
  {
    meal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal',
      required: true,
    },
    nameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    imageSnapshot: {
      type: String,
      default: '/src/assets/hero-thali.jpg',
    },
    priceSnapshot: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    itemTotal: {
      type: Number,
      required: true,
      min: [0, 'Item total cannot be negative'],
    },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length > 0,
        'Order must contain at least one item',
      ],
    },
    totalItems: {
      type: Number,
      required: true,
      min: [1, 'Total items must be at least 1'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: [0, 'Delivery fee cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    customerSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    deliveryAddressSnapshot: {
      label: { type: String, default: 'Home' },
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      landmark: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      deliveryInstructions: { type: String, default: '' },
    },
    orderStatus: {
      type: String,
      enum: {
        values: ORDER_STATUSES,
        message: '{VALUE} is not a valid order status',
      },
      default: 'Pending',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    paymentMethod: {
      type: String,
      default: null,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for fast queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const MongooseOrder = mongoose.models.Order || mongoose.model('Order', orderSchema);

// Persistent disk-backed store for resilient local dev testing
const inMemoryOrders = loadDiskCollection('orders');
let orderCounter = 0;

/**
 * Generate human-readable safe order number: STS-2026-0001
 */
export const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  let count = 0;

  if (mongoose.connection.readyState === 1) {
    count = await MongooseOrder.countDocuments();
  } else {
    count = inMemoryOrders.size;
  }

  const nextSeq = count + 1;
  const padded = String(nextSeq).padStart(4, '0');
  let orderNumber = `STS-${year}-${padded}`;

  // Collision check & retry
  let collision = true;
  let attempt = 0;
  while (collision && attempt < 50) {
    if (mongoose.connection.readyState === 1) {
      const exists = await MongooseOrder.findOne({ orderNumber });
      if (!exists) collision = false;
      else {
        attempt++;
        orderNumber = `STS-${year}-${String(nextSeq + attempt).padStart(4, '0')}`;
      }
    } else {
      let found = false;
      for (const ord of inMemoryOrders.values()) {
        if (ord.orderNumber === orderNumber) {
          found = true;
          break;
        }
      }
      if (!found) collision = false;
      else {
        attempt++;
        orderNumber = `STS-${year}-${String(nextSeq + attempt).padStart(4, '0')}`;
      }
    }
  }

  return orderNumber;
};

class OrderDocument {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new mongoose.Types.ObjectId().toString();
    this.orderNumber = data.orderNumber;
    this.user = data.user ? (data.user._id ? data.user._id.toString() : data.user.toString()) : null;
    this.idempotencyKey = data.idempotencyKey || null;
    this.items = Array.isArray(data.items)
      ? data.items.map((i) => ({
          _id: i._id ? i._id.toString() : new mongoose.Types.ObjectId().toString(),
          meal: i.meal ? (i.meal._id ? i.meal._id.toString() : i.meal.toString()) : null,
          nameSnapshot: i.nameSnapshot,
          imageSnapshot: i.imageSnapshot || '/src/assets/hero-thali.jpg',
          priceSnapshot: Number(i.priceSnapshot),
          quantity: Number(i.quantity),
          itemTotal: Number(i.itemTotal),
        }))
      : [];
    this.totalItems = Number(data.totalItems);
    this.subtotal = Number(data.subtotal);
    this.deliveryFee = Number(data.deliveryFee || 0);
    this.total = Number(data.total);
    this.customerSnapshot = { ...data.customerSnapshot };
    this.deliveryAddressSnapshot = { ...data.deliveryAddressSnapshot };
    this.orderStatus = data.orderStatus || 'Pending';
    this.statusHistory = Array.isArray(data.statusHistory)
      ? data.statusHistory.map((h) => ({
          _id: h._id ? h._id.toString() : new mongoose.Types.ObjectId().toString(),
          status: h.status,
          changedAt: h.changedAt ? new Date(h.changedAt) : new Date(),
          changedBy: h.changedBy ? h.changedBy.toString() : null,
          note: h.note || '',
        }))
      : [];
    this.paymentStatus = data.paymentStatus || 'Pending';
    this.paymentMethod = data.paymentMethod || null;
    this.payment = data.payment ? data.payment.toString() : null;
    this.cancelledAt = data.cancelledAt || null;
    this.cancelledBy = data.cancelledBy ? data.cancelledBy.toString() : null;
    this.cancellationReason = data.cancellationReason || '';
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryOrders.set(this._id.toString(), this);
    saveDiskCollection('orders', inMemoryOrders);
    return this;
  }
}

const Order = {
  find(query = {}) {
    const execute = async (sortOption = null, skip = 0, limit = 0) => {
      if (mongoose.connection.readyState === 1) {
        let q = MongooseOrder.find(query);
        if (sortOption) q = q.sort(sortOption);
        if (skip) q = q.skip(skip);
        if (limit) q = q.limit(limit);
        return await q;
      }

      const results = [];
      for (const ord of inMemoryOrders.values()) {
        let match = true;
        if (query.user) {
          if (typeof query.user === 'object' && Array.isArray(query.user.$in)) {
            const allowedUsers = query.user.$in.map((u) => u?.toString());
            if (!allowedUsers.includes(ord.user?.toString())) match = false;
          } else {
            const qUser = query.user._id ? query.user._id.toString() : query.user.toString();
            if (ord.user !== qUser) match = false;
          }
        }
        if (query.orderStatus) {
          if (typeof query.orderStatus === 'object' && Array.isArray(query.orderStatus.$in)) {
            if (!query.orderStatus.$in.includes(ord.orderStatus)) match = false;
          } else if (ord.orderStatus !== query.orderStatus) {
            match = false;
          }
        }
        if (query.paymentMethod && ord.paymentMethod !== query.paymentMethod) match = false;
        if (query.paymentStatus && ord.paymentStatus !== query.paymentStatus) match = false;

        if (query.createdAt) {
          if (query.createdAt.$gte && new Date(ord.createdAt) < new Date(query.createdAt.$gte)) match = false;
          if (query.createdAt.$lte && new Date(ord.createdAt) > new Date(query.createdAt.$lte)) match = false;
        }
        if (query.$or) {
          // search filter across orderNumber, customer name, email, phone
          const orMatches = query.$or.some((condition) => {
            if (condition.orderNumber && condition.orderNumber.$regex) {
              return condition.orderNumber.$regex.test(ord.orderNumber);
            }
            if (condition['customerSnapshot.name'] && condition['customerSnapshot.name'].$regex) {
              return condition['customerSnapshot.name'].$regex.test(ord.customerSnapshot.name);
            }
            if (condition['customerSnapshot.email'] && condition['customerSnapshot.email'].$regex) {
              return condition['customerSnapshot.email'].$regex.test(ord.customerSnapshot.email);
            }
            if (condition['customerSnapshot.phone'] && condition['customerSnapshot.phone'].$regex) {
              return condition['customerSnapshot.phone'].$regex.test(ord.customerSnapshot.phone);
            }
            return false;
          });
          if (!orMatches) match = false;
        }

        if (match) results.push(new OrderDocument(ord));
      }

      // Sort order
      if (sortOpt && (sortOpt.createdAt === 1 || sortOpt === 'createdAt')) {
        results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else {
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (skip || limit) {
        const start = skip || 0;
        const end = limit ? start + limit : results.length;
        return results.slice(start, end);
      }

      return results;
    };

    let sortOpt = null;
    let skipCount = 0;
    let limitCount = 0;

    const chainable = {
      sort(opt) {
        sortOpt = opt;
        return chainable;
      },
      skip(count) {
        skipCount = count;
        return chainable;
      },
      limit(count) {
        limitCount = count;
        return chainable;
      },
      then(resolve, reject) {
        return execute(sortOpt, skipCount, limitCount).then(resolve, reject);
      },
      catch(reject) {
        return execute(sortOpt, skipCount, limitCount).catch(reject);
      },
    };

    return chainable;
  },

  async countDocuments(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseOrder.countDocuments(query);
    }
    const list = await this.find(query);
    return list.length;
  },

  findById(id) {
    const stringId = id?.toString();
    const execute = async () => {
      if (mongoose.connection.readyState === 1) {
        return await MongooseOrder.findById(stringId);
      }
      const ord = inMemoryOrders.get(stringId);
      return ord ? new OrderDocument(ord) : null;
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

  findOne(query) {
    const execute = async () => {
      if (mongoose.connection.readyState === 1) {
        return await MongooseOrder.findOne(query);
      }
      for (const ord of inMemoryOrders.values()) {
        let match = true;
        if (query._id && ord._id.toString() !== query._id.toString()) match = false;
        if (query.orderNumber && ord.orderNumber !== query.orderNumber) match = false;
        if (query.idempotencyKey && ord.idempotencyKey !== query.idempotencyKey) match = false;
        if (query.user) {
          const qUser = query.user._id ? query.user._id.toString() : query.user.toString();
          if (ord.user !== qUser) match = false;
        }
        if (match) return new OrderDocument(ord);
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

  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseOrder.create(data);
    }
    const doc = new OrderDocument(data);
    inMemoryOrders.set(doc._id.toString(), doc);
    saveDiskCollection('orders', inMemoryOrders);
    return doc;
  },

  async aggregate(pipeline = []) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseOrder.aggregate(pipeline);
    }
    // Fallback if not connected to MongoDB
    return [];
  },

  _resetStore() {
    inMemoryOrders.clear();
  },
};

export { MongooseOrder };
export default Order;
