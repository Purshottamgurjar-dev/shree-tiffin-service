import mongoose from 'mongoose';

const businessHourSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    openTime: {
      type: String,
      default: '07:00',
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid openTime format. Expected HH:MM (24h)'],
    },
    closeTime: {
      type: String,
      default: '22:00',
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid closeTime format. Expected HH:MM (24h)'],
    },
  },
  { _id: false }
);

const defaultBusinessHours = [
  { day: 'Monday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
  { day: 'Tuesday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
  { day: 'Wednesday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
  { day: 'Thursday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
  { day: 'Friday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
  { day: 'Saturday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
  { day: 'Sunday', isOpen: true, openTime: '07:00', closeTime: '22:00' },
];

const businessSettingsSchema = new mongoose.Schema(
  {
    singletonId: {
      type: String,
      default: 'default_settings',
      unique: true,
      required: true,
      index: true,
    },
    businessInfo: {
      name: {
        type: String,
        default: 'Shree Tiffin Service',
        trim: true,
        maxlength: 100,
      },
      tagline: {
        type: String,
        default: 'Ghar Jaisa Khana, Har Din.',
        trim: true,
        maxlength: 150,
      },
      phone: {
        type: String,
        default: '8120414836',
        trim: true,
      },
      email: {
        type: String,
        default: 'shreetiffinservice09@gmail.com',
        trim: true,
        lowercase: true,
      },
      address: {
        type: String,
        default: 'Scheme No 78, Vijay Nagar',
        trim: true,
      },
      city: {
        type: String,
        default: 'Indore',
        trim: true,
      },
      state: {
        type: String,
        default: 'Madhya Pradesh',
        trim: true,
      },
      postalCode: {
        type: String,
        default: '452010',
        trim: true,
      },
    },
    delivery: {
      deliveryFee: {
        type: Number,
        default: 0,
        min: [0, 'Delivery fee cannot be negative'],
      },
      minimumOrderValue: {
        type: Number,
        default: 0,
        min: [0, 'Minimum order value cannot be negative'],
      },
      deliveryRadius: {
        type: Number,
        default: 15,
        min: [0, 'Delivery radius cannot be negative'],
      },
      instructions: {
        type: String,
        default: 'Hot homestyle meals delivered fresh in insulated carriers.',
        trim: true,
        maxlength: 500,
      },
    },
    businessHours: {
      type: [businessHourSchema],
      default: defaultBusinessHours,
    },
    ordering: {
      isAcceptingOrders: {
        type: Boolean,
        default: true,
      },
      pausedMessage: {
        type: String,
        default: 'Online ordering is currently unavailable.',
        trim: true,
        maxlength: 250,
      },
      maintenanceMode: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Static helper to retrieve or initialize the singleton settings document
 */
businessSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ singletonId: 'default_settings' });
  if (!settings) {
    settings = await this.create({ singletonId: 'default_settings' });
  }
  return settings;
};

/**
 * Instance helper to calculate delivery fee
 */
businessSettingsSchema.methods.calculateDeliveryFee = function (subtotal = 0) {
  return Number(this.delivery?.deliveryFee || 0);
};

const BusinessSettings = mongoose.model('BusinessSettings', businessSettingsSchema);

export default BusinessSettings;
