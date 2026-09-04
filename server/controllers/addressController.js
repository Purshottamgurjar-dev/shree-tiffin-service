import Address, { ADDRESS_LABELS } from '../models/Address.js';

/**
 * Validate coordinates helper
 */
const validateCoordinates = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    return { valid: false, message: 'Latitude must be a valid number between -90 and 90' };
  }
  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    return { valid: false, message: 'Longitude must be a valid number between -180 and 180' };
  }
  return { valid: true, latitude, longitude };
};

/**
 * @desc    Get all saved addresses for authenticated customer
 * @route   GET /api/addresses
 * @access  Private (Customer)
 */
export const getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single address by ID
 * @route   GET /api/addresses/:id
 * @access  Private (Customer)
 */
export const getAddressById = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Ownership check
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this address',
      });
    }

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new delivery address
 * @route   POST /api/addresses
 * @access  Private (Customer)
 */
export const createAddress = async (req, res, next) => {
  try {
    const {
      label = 'Home',
      fullName,
      phone,
      addressLine1,
      addressLine2 = '',
      landmark = '',
      city,
      state,
      postalCode,
      country = 'India',
      latitude,
      longitude,
      deliveryInstructions = '',
      isDefault = false,
    } = req.body;

    // Required fields validation
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!phone || !phone.trim() || !/^[0-9+ -]{10,15}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required (10-15 digits)' });
    }
    if (!addressLine1 || !addressLine1.trim()) {
      return res.status(400).json({ success: false, message: 'Address line 1 is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, message: 'City is required' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ success: false, message: 'State is required' });
    }
    if (!postalCode || !postalCode.trim() || !/^[1-9][0-9]{5}$|^[0-9A-Za-z -]{4,10}$/.test(postalCode.trim())) {
      return res.status(400).json({ success: false, message: 'Valid PIN Code is required' });
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.valid) {
      return res.status(400).json({ success: false, message: coordValidation.message });
    }

    // Validate label
    const validLabel = ADDRESS_LABELS.includes(label) ? label : 'Home';

    // Count user's existing addresses
    const existingCount = (await Address.find({ user: req.user._id })).length;

    // If first address, force isDefault to true
    let shouldBeDefault = existingCount === 0 ? true : Boolean(isDefault);

    // If shouldBeDefault, unset all previous defaults for this user
    if (shouldBeDefault && existingCount > 0) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    const newAddress = await Address.create({
      user: req.user._id,
      label: validLabel,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : '',
      landmark: landmark ? landmark.trim() : '',
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country ? country.trim() : 'India',
      latitude: coordValidation.latitude,
      longitude: coordValidation.longitude,
      deliveryInstructions: deliveryInstructions ? deliveryInstructions.trim().slice(0, 300) : '',
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      data: newAddress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing address
 * @route   PUT /api/addresses/:id
 * @access  Private (Customer)
 */
export const updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Ownership check
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to modify this address',
      });
    }

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
      deliveryInstructions,
      isDefault,
    } = req.body;

    // Validate coordinates if provided
    if (latitude !== undefined || longitude !== undefined) {
      const coordValidation = validateCoordinates(
        latitude !== undefined ? latitude : address.latitude,
        longitude !== undefined ? longitude : address.longitude
      );
      if (!coordValidation.valid) {
        return res.status(400).json({ success: false, message: coordValidation.message });
      }
      address.latitude = coordValidation.latitude;
      address.longitude = coordValidation.longitude;
    }

    if (label && ADDRESS_LABELS.includes(label)) address.label = label;
    if (fullName && fullName.trim()) address.fullName = fullName.trim();
    if (phone && phone.trim()) {
      if (!/^[0-9+ -]{10,15}$/.test(phone.trim())) {
        return res.status(400).json({ success: false, message: 'Valid phone number is required' });
      }
      address.phone = phone.trim();
    }
    if (addressLine1 && addressLine1.trim()) address.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2.trim();
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (city && city.trim()) address.city = city.trim();
    if (state && state.trim()) address.state = state.trim();
    if (postalCode && postalCode.trim()) {
      if (!/^[1-9][0-9]{5}$|^[0-9A-Za-z -]{4,10}$/.test(postalCode.trim())) {
        return res.status(400).json({ success: false, message: 'Valid PIN Code is required' });
      }
      address.postalCode = postalCode.trim();
    }
    if (country && country.trim()) address.country = country.trim();
    if (deliveryInstructions !== undefined) {
      address.deliveryInstructions = deliveryInstructions.trim().slice(0, 300);
    }

    // Default address toggle
    if (isDefault === true && !address.isDefault) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
      address.isDefault = true;
    }

    await address.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an address
 * @route   DELETE /api/addresses/:id
 * @access  Private (Customer)
 */
export const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Ownership check
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to delete this address',
      });
    }

    const wasDefault = Boolean(address.isDefault);
    await Address.findByIdAndDelete(req.params.id);

    // If the deleted address was default, promote another saved address if available
    if (wasDefault) {
      const remaining = await Address.find({ user: req.user._id }).sort({ createdAt: -1 });
      if (remaining.length > 0) {
        remaining[0].isDefault = true;
        await remaining[0].save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Set an address as the default delivery destination
 * @route   PATCH /api/addresses/:id/default
 * @access  Private (Customer)
 */
export const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Ownership check
    if (address.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to modify this address',
      });
    }

    // Unset existing defaults for this customer
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });

    // Mark current as default
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      data: address,
    });
  } catch (error) {
    next(error);
  }
};
