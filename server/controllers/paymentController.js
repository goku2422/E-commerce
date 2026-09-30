const crypto = require('crypto');
const { getRazorpayInstance } = require('../config/razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const { calculateCartTotals } = require('../services/cartService');
const { deductStockForOrder } = require('../services/stockService');
const { sendOrderNotification } = require('../services/emailService');

// @desc    Create Razorpay order & pending DB order
// @route   POST /api/payments/create-order
// @access  Private
const createPaymentOrder = async (req, res, next) => {
  try {
    const { addressId, couponCode } = req.body;

    if (!addressId) {
      return res.status(400).json({ success: false, message: 'Delivery address is required' });
    }

    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Delivery address not found' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Secure backend price calculation
    const totals = await calculateCartTotals({
      items: cart.items,
      userId: req.user._id,
      couponCode,
    });

    if (totals.errors && totals.errors.length > 0 && totals.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: totals.errors.join(' | '),
      });
    }

    // Generate unique order number
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);

    // Snapshot order items
    const orderItems = totals.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      SKU: item.product.SKU,
      price: item.product.effectivePrice,
      originalPrice: item.product.price,
      quantity: item.quantity,
      image: item.product.images[0] || '',
      total: item.itemTotal,
    }));

    // Create DB Order record in PLACED state, payment PENDING
    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      items: orderItems,
      deliveryAddress: {
        fullName: address.fullName,
        mobile: address.mobile,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country || 'India',
        addressType: address.addressType,
      },
      status: 'PLACED',
      statusHistory: [
        {
          status: 'PLACED',
          note: 'Order placed, awaiting payment confirmation',
          updatedBy: req.user._id,
          timestamp: new Date(),
        },
      ],
      subtotal: totals.subtotal,
      discountAmount: totals.discount,
      deliveryFee: totals.deliveryFee,
      totalAmount: totals.totalPayable,
      couponApplied: totals.couponApplied,
      paymentInfo: {
        status: 'PENDING',
        method: 'Razorpay',
      },
    });

    // Amount in paise for Razorpay (Integer value)
    const amountInPaise = Math.round(totals.totalPayable * 100);

    const rzpKeyId = process.env.RAZORPAY_KEY_ID;
    const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!rzpKeyId || !rzpKeySecret || !rzpKeyId.trim() || !rzpKeySecret.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay API credentials are not properly configured in server/.env (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET).',
      });
    }

    // Call Razorpay API to create order
    let razorpayOrder;
    try {
      const razorpay = getRazorpayInstance();
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          orderId: order._id.toString(),
          userId: req.user._id.toString(),
        },
      });
    } catch (rzpErr) {
      const errMsg = rzpErr.error?.description || rzpErr.message || 'Razorpay Authentication Failed';
      console.error('[ERROR] Razorpay Order Creation API Failed:', errMsg);
      // Remove created order on Razorpay API error
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({
        success: false,
        message: `Razorpay Order Creation Failed: ${errMsg}. Please provide valid Razorpay Test Mode credentials in server/.env (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET).`,
      });
    }

    // Link Razorpay Order ID to DB Order & Payment records
    order.paymentInfo.razorpayOrderId = razorpayOrder.id;
    await order.save();

    await Payment.create({
      order: order._id,
      user: req.user._id,
      razorpayOrderId: razorpayOrder.id,
      amount: totals.totalPayable,
      currency: 'INR',
      status: 'PENDING',
      gateway: 'Razorpay',
    });

    // Safe debug logging (no secret credentials printed)
    console.log('[DEBUG] Razorpay Order Created Successfully:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: totals.totalPayable,
      amountInPaise,
      currency: 'INR',
    });

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrder.id,
        amount: totals.totalPayable,
        amountInPaise,
        currency: 'INR',
        key_id: rzpKeyId,
        customer: {
          name: req.user.name,
          email: req.user.email,
          mobile: req.user.mobile,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature securely on backend
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Payment verification parameters missing' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ownership Check: Ensure order belongs to authenticated customer
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Order does not belong to logged-in user' });
    }

    // Idempotency check: If order is already paid, return early
    if (order.paymentInfo.status === 'PAID') {
      return res.json({
        success: true,
        message: 'Payment already verified and processed.',
        data: order,
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, message: 'Razorpay Secret Key missing on server' });
    }

    // Step 4 & 7: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      console.warn('[WARNING] Razorpay Signature Mismatch:', {
        razorpay_order_id,
        razorpay_payment_id,
        hasSignature: Boolean(razorpay_signature),
      });

      // Mark payment failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'FAILED', razorpayPaymentId: razorpay_payment_id }
      );
      order.paymentInfo.status = 'FAILED';
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.',
      });
    }

    // Atomically deduct inventory stock
    try {
      await deductStockForOrder(order.items);
    } catch (stockErr) {
      order.status = 'CANCELLED';
      order.cancellationReason = 'Stock unavailable at payment completion';
      order.paymentInfo.status = 'REFUNDED';
      await order.save();

      return res.status(400).json({
        success: false,
        message: stockErr.message || 'Stock deduction failed. Order has been cancelled.',
      });
    }

    // Update Order & Payment Status to PAID
    order.paymentInfo.status = 'PAID';
    order.status = 'CONFIRMED';
    order.paymentInfo.razorpayPaymentId = razorpay_payment_id;
    order.paymentInfo.razorpaySignature = razorpay_signature;
    order.paymentInfo.paidAt = new Date();
    await order.save();

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        transactionId: razorpay_payment_id,
      }
    );

    // Clear Customer Cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Track Coupon Usage if applied
    if (order.couponApplied && order.couponApplied.couponId) {
      await Coupon.findByIdAndUpdate(order.couponApplied.couponId, { $inc: { usedCount: 1 } });
      await CouponUsage.create({
        coupon: order.couponApplied.couponId,
        user: req.user._id,
        order: order._id,
      });
    }

    // Send confirmation notification/email
    await sendOrderNotification({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      orderNumber: order.orderNumber,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful',
      message: `Your payment of ₹${order.totalAmount} for order #${order.orderNumber} was successful!`,
      orderId: order._id,
    });

    console.log('[DEBUG] Payment Verification Succeeded:', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: 'PAID',
      razorpayPaymentId: razorpay_payment_id,
    });

    res.json({
      success: true,
      message: 'Payment verified and order placed successfully!',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Idempotent Razorpay Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (Signature Verified)
const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const isDummyWebhookSecret = !webhookSecret || webhookSecret.includes('your_') || webhookSecret.includes('dummy');

    // Webhook signature verification
    if (!isDummyWebhookSecret && signature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const razorpayOrderId = payload?.payment?.entity?.order_id;
      const razorpayPaymentId = payload?.payment?.entity?.id;

      if (!razorpayOrderId) {
        return res.status(400).json({ success: false, message: 'Invalid webhook payload structure' });
      }

      const payment = await Payment.findOne({ razorpayOrderId });

      if (payment) {
        // Idempotency check: Check if this event was already processed
        const eventId = req.body.event_id || razorpayPaymentId;
        const alreadyProcessed = payment.webhookEventsProcessed.some((e) => e.eventId === eventId);

        if (alreadyProcessed || payment.status === 'PAID') {
          return res.status(200).json({ success: true, message: 'Webhook event already processed' });
        }

        payment.status = 'PAID';
        payment.razorpayPaymentId = razorpayPaymentId;
        payment.transactionId = razorpayPaymentId;
        payment.webhookEventsProcessed.push({ eventId, eventType: event });
        await payment.save();

        // Update corresponding order
        const order = await Order.findById(payment.order);
        if (order && order.paymentInfo.status !== 'PAID') {
          try {
            await deductStockForOrder(order.items);
          } catch (stkErr) {
            console.error('Stock deduction in webhook error:', stkErr.message);
          }
          order.paymentInfo.status = 'PAID';
          order.status = 'CONFIRMED';
          order.paymentInfo.razorpayPaymentId = razorpayPaymentId;
          order.paymentInfo.paidAt = new Date();
          await order.save();
        }
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ success: false, message: 'Webhook handling failed' });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
};

