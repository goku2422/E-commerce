const express = require('express');
const router = express.Router();
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validateMiddleware');

router.use(protect);

router.route('/')
  .get(getAddresses)
  .post(addAddress);

router.route('/:id')
  .put(validateObjectId('id'), updateAddress)
  .delete(validateObjectId('id'), deleteAddress);

router.patch('/:id/default', validateObjectId('id'), setDefaultAddress);

module.exports = router;
