const express = require('express');
const router = express.Router();
const { getCheckoutSummary } = require('../controllers/checkoutController');
const { protect } = require('../middleware/authMiddleware');

router.post('/summary', protect, getCheckoutSummary);

module.exports = router;
