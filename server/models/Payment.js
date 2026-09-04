import mongoose from 'mongoose';
import { loadDiskCollection, saveDiskCollection } from '../config/localStore.js';

export const PAYMENT_STATUSES = [
  'Pending',
  'Processing',
  'Paid',
  'Failed',
  'Cancelled',
  'Refunded',
];

export const PAYMENT_METHODS = ['COD', 'ONLINE'];
export const PAYMENT_GATEWAYS = ['RAZORPAY', 'COD'];

/**
 * Generate human-readable collision-safe payment ID (e.g. PAY-STS-2026-0001)
 */
let paymentSequenceCounter = 1;

export const generatePaymentId = async () => {
  const currentYear = new Date().getFullYear();
  try {
    if (mongoose.connection.readyState === 1 && mongoose.models.Payment) {
      const count = await mongoose.models.Payment.countDocuments();
      const nextNum = String(count + 1).padStart(4, '0');
      return `PAY-STS-${currentYear}-${nextNum}`;
    }
  } catch (err) {
    // Fall back to sequence counter
  }
  const nextNum = String(paymentSequenceCounter++).padStart(4, '0');
  return `PAY-STS-${currentYear}-${nextNum}`;
};

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required for payment'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for payment'],
      index: true,
    },
    gateway: {
      type: String,
      enum: {
        values: PAYMENT_GATEWAYS,
        message: '{VALUE} is not a valid payment gateway',
      },
      required: true,
      default: 'COD',
    },
    gatewayOrderId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    gatewayPaymentId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    gatewaySignature: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    amountInPaise: {
      type: Number,
      required: [true, 'Amount in paise is required'],
      min: [0, 'Amount in paise cannot be negative'],
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    method: {
      type: String,
      enum: {
        values: PAYMENT_METHODS,
        message: '{VALUE} is not a valid payment method',
      },
      required: true,
      default: 'COD',
    },
    status: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: '{VALUE} is not a valid payment status',
      },
      default: 'Pending',
      index: true,
    },
    failureReason: {
      type: String,
      trim: true,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    codCollectedAt: {
      type: Date,
      default: null,
    },
    codCollectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    auditHistory: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for query optimization and tenant isolation
paymentSchema.index({ order: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Persistent disk-backed fallback store for resilient local testing
const inMemoryPayments = loadDiskCollection('payments');

class InMemoryPaymentDocument {
  constructor(data) {
    this._id = data._id || new mongoose.Types.ObjectId().toString();
    this.paymentId = data.paymentId;
    this.order = data.order;
    this.user = data.user;
    this.gateway = data.gateway || 'COD';
    this.gatewayOrderId = data.gatewayOrderId || null;
    this.gatewayPaymentId = data.gatewayPaymentId || null;
    this.gatewaySignature = data.gatewaySignature || null;
    this.amount = Number(data.amount) || 0;
    this.amountInPaise = Number(data.amountInPaise) || (this.amount * 100);
    this.currency = (data.currency || 'INR').toUpperCase();
    this.method = data.method || 'COD';
    this.status = data.status || 'Pending';
    this.failureReason = data.failureReason || '';
    this.verifiedAt = data.verifiedAt || null;
    this.codCollectedAt = data.codCollectedAt || null;
    this.codCollectedBy = data.codCollectedBy || null;
    this.auditHistory = Array.isArray(data.auditHistory) ? data.auditHistory : [];
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryPayments.set(this._id.toString(), this);
    saveDiskCollection('payments', inMemoryPayments);
    return this;
  }

  toObject() {
    return { ...this };
  }

  toJSON() {
    return { ...this };
  }
}

class InMemoryPaymentQuery {
  constructor(filter = {}) {
    this.filter = filter;
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._populate = [];
  }

  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }

  skip(num) {
    this._skip = Number(num) || 0;
    return this;
  }

  limit(num) {
    this._limit = Number(num) || null;
    return this;
  }

  populate() {
    return this;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  async exec() {
    let results = Array.from(inMemoryPayments.values()).map(
      (p) => new InMemoryPaymentDocument(p)
    );

    // Apply filters
    if (this.filter) {
      if (this.filter._id) {
        const idStr = this.filter._id.toString();
        results = results.filter((p) => p._id.toString() === idStr);
      }
      if (this.filter.paymentId) {
        if (this.filter.paymentId instanceof RegExp) {
          results = results.filter((p) => this.filter.paymentId.test(p.paymentId));
        } else {
          results = results.filter((p) => p.paymentId === this.filter.paymentId);
        }
      }
      if (this.filter.order) {
        const oIdStr = this.filter.order.toString();
        results = results.filter((p) => p.order && p.order.toString() === oIdStr);
      }
      if (this.filter.user) {
        const uIdStr = this.filter.user.toString();
        results = results.filter((p) => p.user && p.user.toString() === uIdStr);
      }
      if (this.filter.status) {
        results = results.filter((p) => p.status === this.filter.status);
      }
      if (this.filter.method) {
        results = results.filter((p) => p.method === this.filter.method);
      }
      if (this.filter.gatewayOrderId) {
        results = results.filter((p) => p.gatewayOrderId === this.filter.gatewayOrderId);
      }
      if (this.filter.gatewayPaymentId) {
        results = results.filter((p) => p.gatewayPaymentId === this.filter.gatewayPaymentId);
      }
      if (this.filter.createdAt) {
        if (this.filter.createdAt.$gte) {
          results = results.filter((p) => new Date(p.createdAt) >= new Date(this.filter.createdAt.$gte));
        }
        if (this.filter.createdAt.$lte) {
          results = results.filter((p) => new Date(p.createdAt) <= new Date(this.filter.createdAt.$lte));
        }
      }
    }

    // Sort
    if (this._sort && this._sort.createdAt === -1) {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Skip & Limit
    if (this._skip) {
      results = results.slice(this._skip);
    }
    if (this._limit !== null) {
      results = results.slice(0, this._limit);
    }

    return results;
  }
}

const DualModePayment = {
  get schema() {
    return paymentSchema;
  },

  async create(data) {
    if (mongoose.connection.readyState === 1) {
      try {
        const RealModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
        return await RealModel.create(data);
      } catch (err) {
        console.warn(`[Payment Model] MongoDB error on create, falling back to memory: ${err.message}`);
      }
    }

    const paymentId = data.paymentId || (await generatePaymentId());
    const doc = new InMemoryPaymentDocument({ ...data, paymentId });
    await doc.save();
    return doc;
  },

  async findById(id) {
    if (mongoose.connection.readyState === 1) {
      try {
        const RealModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
        const found = await RealModel.findById(id);
        if (found) return found;
      } catch (err) {
        console.warn(`[Payment Model] MongoDB error on findById, falling back to memory: ${err.message}`);
      }
    }

    const idStr = id?.toString();
    const doc = inMemoryPayments.get(idStr);
    return doc ? new InMemoryPaymentDocument(doc) : null;
  },

  findOne(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const RealModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
      const query = RealModel.findOne(filter);
      const originalExec = query.exec.bind(query);
      query.exec = async function () {
        try {
          const res = await originalExec();
          if (res) return res;
        } catch (err) {
          console.warn(`[Payment Model] MongoDB error on findOne, falling back to memory: ${err.message}`);
        }
        return (await new InMemoryPaymentQuery(filter).exec())[0] || null;
      };
      return query;
    }

    return {
      sort(s) {
        return this;
      },
      then(resolve, reject) {
        return new InMemoryPaymentQuery(filter)
          .exec()
          .then((res) => resolve(res[0] || null), reject);
      },
    };
  },

  find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      const RealModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
      const query = RealModel.find(filter);
      const originalExec = query.exec.bind(query);
      query.exec = async function () {
        try {
          return await originalExec();
        } catch (err) {
          console.warn(`[Payment Model] MongoDB error on find, falling back to memory: ${err.message}`);
          return new InMemoryPaymentQuery(filter).exec();
        }
      };
      return query;
    }

    return new InMemoryPaymentQuery(filter);
  },

  async countDocuments(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      try {
        const RealModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
        return await RealModel.countDocuments(filter);
      } catch (err) {
        console.warn(`[Payment Model] MongoDB error on countDocuments, falling back to memory: ${err.message}`);
      }
    }

    const res = await new InMemoryPaymentQuery(filter).exec();
    return res.length;
  },

  async aggregate(pipeline = []) {
    if (mongoose.connection.readyState === 1) {
      const RealModel = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
      return await RealModel.aggregate(pipeline);
    }
    return [];
  },
};

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export { Payment as MongoosePayment };
export default DualModePayment;
