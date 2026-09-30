const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  SKU: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, default: '' },
  total: { type: Number, required: true },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'],
    required: true,
  },
  note: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    deliveryAddress: {
      fullName: { type: String, required: true },
      mobile: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
      addressType: { type: String, default: 'Home' },
    },
    status: {
      type: String,
      enum: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'],
      default: 'PLACED',
      index: true,
    },
    statusHistory: [statusHistorySchema],
    subtotal: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    couponApplied: {
      code: { type: String },
      discountAmount: { type: Number, default: 0 },
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    },
    paymentInfo: {
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      status: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING',
      },
      method: { type: String, default: 'Razorpay' },
      paidAt: { type: Date },
      refundInfo: { type: mongoose.Schema.Types.Mixed },
    },
    isInventoryDeducted: {
      type: Boolean,
      default: false,
    },
    isInventoryRestored: {
      type: Boolean,
      default: false,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
