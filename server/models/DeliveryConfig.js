const mongoose = require('mongoose');

const deliveryConfigSchema = new mongoose.Schema(
  {
    minAmountForFreeDelivery: {
      type: Number,
      required: true,
      default: 999,
      min: 0,
    },
    defaultDeliveryFee: {
      type: Number,
      required: true,
      default: 50,
      min: 0,
    },
    expressDeliveryFee: {
      type: Number,
      default: 100,
      min: 0,
    },
    estimatedDays: {
      type: String,
      default: '3-5 Business Days',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DeliveryConfig', deliveryConfigSchema);
