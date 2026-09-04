import mongoose from 'mongoose';
import { loadDiskCollection, saveDiskCollection } from '../config/localStore.js';

export const ADDRESS_LABELS = ['Home', 'Office', 'Hostel', 'Other'];

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required for address'],
      index: true,
    },
    label: {
      type: String,
      enum: {
        values: ADDRESS_LABELS,
        message: '{VALUE} is not a valid address label',
      },
      default: 'Home',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+ -]{10,15}$/, 'Please provide a valid 10-digit phone number'],
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
      maxlength: [200, 'Address line 1 cannot exceed 200 characters'],
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [200, 'Address line 2 cannot exceed 200 characters'],
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [100, 'Landmark cannot exceed 100 characters'],
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [60, 'City cannot exceed 60 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [60, 'State cannot exceed 60 characters'],
    },
    postalCode: {
      type: String,
      required: [true, 'PIN Code is required'],
      trim: true,
      match: [/^[1-9][0-9]{5}$|^[0-9A-Za-z -]{4,10}$/, 'Please provide a valid 6-digit PIN Code'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: [300, 'Delivery instructions cannot exceed 300 characters'],
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
addressSchema.index({ user: 1 });
addressSchema.index({ user: 1, isDefault: 1 });

const MongooseAddress = mongoose.models.Address || mongoose.model('Address', addressSchema);

// Persistent disk-backed store for resilient local development
const inMemoryAddresses = loadDiskCollection('addresses'); // key: _id

class AddressDocument {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new mongoose.Types.ObjectId().toString();
    this.user = data.user ? (data.user._id ? data.user._id.toString() : data.user.toString()) : null;
    this.label = data.label || 'Home';
    this.fullName = data.fullName ? data.fullName.trim() : '';
    this.phone = data.phone ? data.phone.trim() : '';
    this.addressLine1 = data.addressLine1 ? data.addressLine1.trim() : '';
    this.addressLine2 = data.addressLine2 ? data.addressLine2.trim() : '';
    this.landmark = data.landmark ? data.landmark.trim() : '';
    this.city = data.city ? data.city.trim() : '';
    this.state = data.state ? data.state.trim() : '';
    this.postalCode = data.postalCode ? data.postalCode.trim() : '';
    this.country = data.country ? data.country.trim() : 'India';
    this.latitude = Number(data.latitude);
    this.longitude = Number(data.longitude);
    this.deliveryInstructions = data.deliveryInstructions ? data.deliveryInstructions.trim() : '';
    this.isDefault = Boolean(data.isDefault);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryAddresses.set(this._id.toString(), this);
    saveDiskCollection('addresses', inMemoryAddresses);
    return this;
  }
}

const Address = {
  find(query = {}) {
    const execute = async (sortOption = null) => {
      if (mongoose.connection.readyState === 1) {
        let q = MongooseAddress.find(query);
        if (sortOption) q = q.sort(sortOption);
        return await q;
      }

      const results = [];
      for (const addr of inMemoryAddresses.values()) {
        let match = true;
        if (query.user) {
          const qUser = query.user._id ? query.user._id.toString() : query.user.toString();
          if (addr.user !== qUser) match = false;
        }
        if (query.isDefault !== undefined && addr.isDefault !== Boolean(query.isDefault)) {
          match = false;
        }
        if (match) results.push(new AddressDocument(addr));
      }

      // Default sorting: isDefault first, then newest
      results.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      return results;
    };

    return {
      sort(sortOption) {
        return execute(sortOption);
      },
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
        return await MongooseAddress.findById(stringId);
      }
      const addr = inMemoryAddresses.get(stringId);
      return addr ? new AddressDocument(addr) : null;
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
        return await MongooseAddress.findOne(query);
      }
      for (const addr of inMemoryAddresses.values()) {
        let match = true;
        if (query._id && addr._id.toString() !== query._id.toString()) match = false;
        if (query.user) {
          const qUser = query.user._id ? query.user._id.toString() : query.user.toString();
          if (addr.user !== qUser) match = false;
        }
        if (query.isDefault !== undefined && addr.isDefault !== Boolean(query.isDefault)) match = false;
        if (match) return new AddressDocument(addr);
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
      return await MongooseAddress.create(data);
    }
    const doc = new AddressDocument(data);
    inMemoryAddresses.set(doc._id.toString(), doc);
    saveDiskCollection('addresses', inMemoryAddresses);
    return doc;
  },

  async updateMany(filter, update) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseAddress.updateMany(filter, update);
    }

    let modifiedCount = 0;
    for (const addr of inMemoryAddresses.values()) {
      let match = true;
      if (filter.user) {
        const qUser = filter.user._id ? filter.user._id.toString() : filter.user.toString();
        if (addr.user !== qUser) match = false;
      }
      if (filter._id && filter._id.$ne && addr._id.toString() === filter._id.$ne.toString()) {
        match = false;
      }
      if (match) {
        if (update.$set) {
          Object.assign(addr, update.$set);
        } else {
          Object.assign(addr, update);
        }
        addr.updatedAt = new Date();
        modifiedCount++;
      }
    }
    return { modifiedCount };
  },

  async findByIdAndDelete(id) {
    const stringId = id?.toString();
    if (mongoose.connection.readyState === 1) {
      return await MongooseAddress.findByIdAndDelete(stringId);
    }
    const existing = inMemoryAddresses.get(stringId);
    if (existing) {
      inMemoryAddresses.delete(stringId);
      saveDiskCollection('addresses', inMemoryAddresses);
      return existing;
    }
    return null;
  },

  _resetStore() {
    inMemoryAddresses.clear();
  },
};

export default Address;
