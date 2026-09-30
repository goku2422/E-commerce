const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.use(protect);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.post('/items', addToCart);

router.route('/items/:productId')
  .put(validateObjectId('productId'), updateCartQuantity)
  .delete(validateObjectId('productId'), removeFromCart);

module.exports = router;
