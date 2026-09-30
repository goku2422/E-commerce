const express = require('express');
const router = express.Router();
const {
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.use(protect);

// Admin Order Management (MUST BE BEFORE /:id to prevent wildcard capturing)
router.get('/admin/all', adminOnly, getAllOrders);
router.put('/admin/:id/status', adminOnly, validateObjectId('id'), updateOrderStatus);

// Customer Order Management
router.get('/my-orders', getMyOrders);
router.get('/:id', validateObjectId('id'), getOrderById);
router.put('/:id/cancel', validateObjectId('id'), cancelOrder);

module.exports = router;
