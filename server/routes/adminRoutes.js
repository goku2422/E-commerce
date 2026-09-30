const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  toggleUserBlock,
  getDeliveryConfig,
  updateDeliveryConfig,
  getAllPayments,
} = require('../controllers/adminController');
const { getAdminProducts } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

// Public read for checkout calculation
router.get('/delivery-config', getDeliveryConfig);

// Admin protected routes
router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-block', validateObjectId('id'), toggleUserBlock);

router.get('/products', getAdminProducts);
router.put('/delivery-config', updateDeliveryConfig);
router.get('/payments', getAllPayments);

module.exports = router;
