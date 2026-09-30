const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const { calculateCartTotals } = require('../services/cartService');

// @desc    Validate coupon code for customer checkout
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Please provide a coupon code' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const summary = await calculateCartTotals({
      items: cart.items,
      userId: req.user._id,
      couponCode: code,
    });

    if (summary.errors && summary.errors.some((err) => err.toLowerCase().includes('coupon'))) {
      const couponErr = summary.errors.find((err) => err.toLowerCase().includes('coupon'));
      return res.status(400).json({
        success: false,
        message: couponErr,
      });
    }

    res.json({
      success: true,
      message: 'Coupon applied successfully!',
      data: summary.couponApplied,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit, isActive } =
      req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Code, discount type, value, and expiry date are required' });
    }

    const existingCode = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : 100,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update coupon (Admin)
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    if (req.body.code && req.body.code.toUpperCase().trim() !== coupon.code) {
      const existing = await Coupon.findOne({ code: req.body.code.toUpperCase().trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Coupon code already in use' });
      }
      req.body.code = req.body.code.toUpperCase().trim();
    }

    Object.assign(coupon, req.body);
    await coupon.save();

    res.json({
      success: true,
      message: 'Coupon updated successfully',
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
