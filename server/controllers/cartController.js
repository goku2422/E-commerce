const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { calculateCartTotals } = require('../services/cartService');

// Helper to retrieve or create cart
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// @desc    Get current user's shopping cart with recalculated totals
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const couponCode = req.query.couponCode || null;

    const summary = await calculateCartTotals({
      items: cart.items,
      userId: req.user._id,
      couponCode,
    });

    res.json({
      success: true,
      data: {
        cartId: cart._id,
        ...summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to cart
// @route   POST /api/cart/items
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isEnabled) {
      return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
    }

    const cart = await getOrCreateCart(req.user._id);

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    let newQuantity = quantity;
    if (existingItemIndex > -1) {
      newQuantity = cart.items[existingItemIndex].quantity + quantity;
    }

    // Stock validation (Requirement 3 & 9 & Test Case 9)
    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Cannot add requested quantity. Only ${product.stock} units available in stock.`,
      });
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity: newQuantity });
    }

    await cart.save();

    const summary = await calculateCartTotals({
      items: cart.items,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: 'Item added to cart',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/items/:productId
// @access  Private
const updateCartQuantity = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${product.stock} available).`,
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const summary = await calculateCartTotals({
      items: cart.items,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: 'Cart updated',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:productId
// @access  Private
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.user._id);

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    const summary = await calculateCartTotals({
      items: cart.items,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        subtotal: 0,
        discount: 0,
        deliveryFee: 0,
        totalPayable: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};
