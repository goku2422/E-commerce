const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin protected routes
router.post('/', protect, adminOnly, createCategory);
router.put('/:id', protect, adminOnly, validateObjectId('id'), updateCategory);
router.delete('/:id', protect, adminOnly, validateObjectId('id'), deleteCategory);

module.exports = router;
