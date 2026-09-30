const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductByIdentifier,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.get('/', getProducts);
router.get('/:identifier', getProductByIdentifier);

// Admin protected routes
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, validateObjectId('id'), updateProduct);
router.patch('/:id/toggle-status', protect, adminOnly, validateObjectId('id'), toggleProductStatus);
router.delete('/:id', protect, adminOnly, validateObjectId('id'), deleteProduct);

module.exports = router;
