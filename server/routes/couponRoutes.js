const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.post('/validate', protect, validateCoupon);

// Admin routes
router.use(protect, adminOnly);
router.route('/')
  .get(getCoupons)
  .post(createCoupon);

router.route('/:id')
  .put(validateObjectId('id'), updateCoupon)
  .delete(validateObjectId('id'), deleteCoupon);

module.exports = router;
