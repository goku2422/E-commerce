const Cart = require('../models/Cart');
const Address = require('../models/Address');
const { calculateCartTotals } = require('../services/cartService');

// @desc    Prepare and recalculate order summary for checkout
// @route   POST /api/checkout/summary
// @access  Private
const getCheckoutSummary = async (req, res, next) => {
  try {
    const { addressId, couponCode } = req.body;

    // Retrieve user cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty. Cannot checkout.' });
    }

    // Validate delivery address if passed
    let address = null;
    if (addressId) {
      address = await Address.findOne({ _id: addressId, user: req.user._id });
    } else {
      // Pick default address if available
      address = await Address.findOne({ user: req.user._id, isDefault: true });
      if (!address) {
        address = await Address.findOne({ user: req.user._id });
      }
    }

    // Backend-side price, coupon, stock, delivery fee recalculation
    const totals = await calculateCartTotals({
      items: cart.items,
      userId: req.user._id,
      couponCode,
    });

    if (totals.errors && totals.errors.length > 0 && totals.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: totals.errors.join(' | '),
        errors: totals.errors,
      });
    }

    res.json({
      success: true,
      data: {
        address: address || null,
        items: totals.items,
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        standardDeliveryFee: totals.standardDeliveryFee,
        expressDeliveryFee: totals.expressDeliveryFee,
        minAmountForFreeDelivery: totals.minAmountForFreeDelivery,
        isFreeDelivery: totals.isFreeDelivery,
        totalPayable: totals.totalPayable,
        couponApplied: totals.couponApplied,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCheckoutSummary };
