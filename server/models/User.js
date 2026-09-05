import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { loadDiskCollection, saveDiskCollection } from '../config/localStore.js';

// Define Mongoose Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please provide your mobile number'],
      trim: true,
      match: [
        /^[0-9+\s-]{10,15}$/,
        'Please provide a valid phone number (10 to 15 digits)',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'owner'],
        message: '{VALUE} is not a supported role',
      },
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password with bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Generate and hash password reset token (15 mins expiry)
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  return resetToken;
};

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

// Persistent disk-backed store for resilient local dev testing when MongoDB Atlas/Local is not reachable
const inMemoryUsers = loadDiskCollection('users');

class UserDocument {
  constructor(data) {
    this._id = data._id || new mongoose.Types.ObjectId().toString();
    this.name = data.name;
    this.email = data.email?.toLowerCase().trim();
    this.phone = data.phone?.trim();
    this.password = data.password; // hashed password
    this.role = data.role || 'customer';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.resetPasswordToken = data.resetPasswordToken || null;
    this.resetPasswordExpire = data.resetPasswordExpire || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  getResetPasswordToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  async save() {
    this.updatedAt = new Date();
    inMemoryUsers.set(this._id.toString(), this);
    saveDiskCollection('users', inMemoryUsers);
    return this;
  }
}

// Unified User Proxy: uses live Mongoose if connected, else falls back to resilient in-memory store
const User = {
  async create(data) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseUser.create(data);
    }

    // In-memory real bcrypt hashing and persistence
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const userDoc = new UserDocument({
      ...data,
      password: hashedPassword,
    });
    inMemoryUsers.set(userDoc._id.toString(), userDoc);
    saveDiskCollection('users', inMemoryUsers);
    return userDoc;
  },

  findOne(query) {
    let includePassword = false;

    const execute = async () => {
      if (mongoose.connection.readyState === 1) {
        let q = MongooseUser.findOne(query);
        if (includePassword) q = q.select('+password');
        return await q;
      }

      for (const user of inMemoryUsers.values()) {
        let match = true;
        if (query.email && user.email !== query.email.toLowerCase().trim()) match = false;
        if (query.role && user.role !== query.role) match = false;
        if (query._id && user._id.toString() !== query._id.toString()) match = false;
        if (query.$or) {
          const orMatch = query.$or.some((condition) => {
            if (condition.email && user.email === condition.email.toLowerCase().trim()) return true;
            if (condition.role && user.role === condition.role) return true;
            return false;
          });
          if (!orMatch) match = false;
        }

        if (match) {
          const copy = new UserDocument(user);
          if (!includePassword) {
            delete copy.password;
          }
          return copy;
        }
      }
      return null;
    };

    return {
      select(field) {
        if (field === '+password') includePassword = true;
        return execute();
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
    let excludePassword = true;

    const execute = async () => {
      if (mongoose.connection.readyState === 1) {
        let q = MongooseUser.findById(stringId);
        if (excludePassword) {
          q = q.select('-password');
        } else {
          q = q.select('+password');
        }
        return await q;
      }
      const user = inMemoryUsers.get(stringId);
      if (!user) return null;
      const copy = new UserDocument(user);
      if (excludePassword) {
        delete copy.password;
      }
      return copy;
    };

    return {
      select(field) {
        if (field === '-password') excludePassword = true;
        if (field === '+password') excludePassword = false;
        return {
          then: (resolve, reject) => execute().then(resolve, reject),
          catch: (reject) => execute().catch(reject),
        };
      },
      then(resolve, reject) {
        return execute().then(resolve, reject);
      },
      catch(reject) {
        return execute().catch(reject);
      },
    };
  },

  find(query = {}) {
    let excludePassword = true;

    const execute = async () => {
      if (mongoose.connection.readyState === 1) {
        let q = MongooseUser.find(query);
        if (excludePassword) q = q.select('-password');
        return await q;
      }
      let results = [];
      for (const user of inMemoryUsers.values()) {
        let match = true;
        if (query.role && user.role !== query.role) match = false;
        if (query.email && user.email !== query.email.toLowerCase().trim()) match = false;
        if (query.$or) {
          const orMatch = query.$or.some((cond) => {
            if (cond.name && cond.name.$regex && cond.name.$regex.test(user.name)) return true;
            if (cond.email && cond.email.$regex && cond.email.$regex.test(user.email)) return true;
            if (cond.phone && cond.phone.$regex && cond.phone.$regex.test(user.phone)) return true;
            return false;
          });
          if (!orMatch) match = false;
        }
        if (match) {
          const copy = new UserDocument(user);
          if (excludePassword) delete copy.password;
          results.push(copy);
        }
      }
      if (sortOpt && sortOpt.createdAt === -1) {
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      return results;
    };

    const queryObj = {
      select(field) {
        if (field === '-password') excludePassword = true;
        return queryObj;
      },
      sort(sortField) {
        sortOpt = sortField;
        return queryObj;
      },
      skip(count) {
        skipCount = count;
        return queryObj;
      },
      limit(count) {
        limitCount = count;
        return queryObj;
      },
      then(resolve, reject) {
        return execute().then(resolve, reject);
      },
      catch(reject) {
        return execute().catch(reject);
      },
    };

    let sortOpt = null;
    let skipCount = 0;
    let limitCount = 0;

    const origExecute = execute;
    const chainedExecute = async () => {
      if (mongoose.connection.readyState === 1) {
        let q = MongooseUser.find(query);
        if (excludePassword) q = q.select('-password');
        if (sortOpt) q = q.sort(sortOpt);
        if (skipCount) q = q.skip(skipCount);
        if (limitCount) q = q.limit(limitCount);
        return await q;
      }
      let results = await origExecute();
      if (skipCount) results = results.slice(skipCount);
      if (limitCount) results = results.slice(0, limitCount);
      return results;
    };

    queryObj.then = (resolve, reject) => chainedExecute().then(resolve, reject);
    queryObj.catch = (reject) => chainedExecute().catch(reject);

    return queryObj;
  },

  async countDocuments(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseUser.countDocuments(query);
    }
    let count = 0;
    for (const user of inMemoryUsers.values()) {
      let match = true;
      if (query.role && user.role !== query.role) match = false;
      if (query.email && user.email !== query.email.toLowerCase().trim()) match = false;
      if (query.$or) {
        const orMatch = query.$or.some((cond) => {
          if (cond.name && cond.name.$regex && cond.name.$regex.test(user.name)) return true;
          if (cond.email && cond.email.$regex && cond.email.$regex.test(user.email)) return true;
          if (cond.phone && cond.phone.$regex && cond.phone.$regex.test(user.phone)) return true;
          return false;
        });
        if (!orMatch) match = false;
      }
      if (match) count++;
    }
    return count;
  },

  async aggregate(pipeline = []) {
    if (mongoose.connection.readyState === 1) {
      return await MongooseUser.aggregate(pipeline);
    }
    return [];
  },
};

export { MongooseUser };
export default User;
