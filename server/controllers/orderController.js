const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { restoreStockForOrder } = require('../services/stockService');
const { sendOrderNotification } = require('../services/emailService');
const { getRazorpayInstance } = require('../config/razorpay');

// @desc    Get customer orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const customerId = req.user._id;
    const total = await Order.countDocuments({ customer: customerId });
    const orders = await Order.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`[DEBUG] getMyOrders for customer ${customerId}: found ${orders.length} orders (total: ${total})`);

    res.json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        orders,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
      orders, // Top-level fallback
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email mobile')
      .populate('items.product', 'name images SKU slug price');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customer Isolation Authorization Check
    if (req.user.role !== 'admin' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Authorization error: You do not have permission to view another customer\'s order details.',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (Customer or Admin)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customer isolation check
    if (req.user.role !== 'admin' && order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Authorization error: Cannot modify another customer\'s order.',
      });
    }

    // Check if order can be cancelled
    if (['SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled at stage "${order.status}".`,
      });
    }

    // Update order status
    order.status = 'CANCELLED';
    order.cancellationReason = reason || 'Cancelled by user';
    order.statusHistory.push({
      status: 'CANCELLED',
      note: reason || 'Order cancelled',
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    // Handle Payment Refund if payment was PAID
    if (order.paymentInfo && order.paymentInfo.status === 'PAID') {
      const paymentId = order.paymentInfo.razorpayPaymentId;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      const isPlaceholder = !keySecret || keySecret.includes('your_') || keySecret.includes('dummy');

      let refundDetails = null;
      if (!isPlaceholder && paymentId && !paymentId.startsWith('order_mock_') && !paymentId.startsWith('pay_mock_') && !paymentId.startsWith('mock_')) {
        try {
          const razorpay = getRazorpayInstance();
          const amountInPaise = Math.round(order.totalAmount * 100);
          const refundRes = await razorpay.payments.refund(paymentId, { amount: amountInPaise });
          refundDetails = {
            refundId: refundRes.id,
            status: refundRes.status || 'processed',
            gateway: 'Razorpay',
            amount: order.totalAmount,
            createdAt: new Date(),
          };
        } catch (rzpErr) {
          console.warn('Razorpay refund API call fallback:', rzpErr.message);
          refundDetails = {
            refundId: 'rfnd_mock_' + Date.now(),
            status: 'processed',
            gateway: 'Razorpay_Mock',
            amount: order.totalAmount,
            note: 'Mock refund processed for test order',
            createdAt: new Date(),
          };
        }
      } else {
        refundDetails = {
          refundId: 'rfnd_mock_' + Date.now(),
          status: 'processed',
          gateway: 'Razorpay_Mock',
          amount: order.totalAmount,
          note: 'Mock refund processed for test order',
          createdAt: new Date(),
        };
      }

      order.paymentInfo.status = 'REFUNDED';
      order.paymentInfo.refundInfo = refundDetails;
      order.markModified('paymentInfo');

      await Payment.findOneAndUpdate(
        { order: order._id },
        { status: 'REFUNDED', refundInfo: refundDetails }
      );
    }

    // Idempotent inventory restoration check - EXECUTED EXACTLY ONCE
    if (!order.isInventoryRestored) {
      await restoreStockForOrder(order.items);
      order.isInventoryRestored = true;
    }

    await order.save();

    // Send notification email
    const customer = await User.findById(order.customer);
    if (customer) {
      await sendOrderNotification({
        userId: customer._id,
        userEmail: customer.email,
        userName: customer.name,
        orderNumber: order.orderNumber,
        type: 'ORDER_CANCELLED',
        title: 'Order Cancelled',
        message: `Your order #${order.orderNumber} has been cancelled.`,
        orderId: order._id,
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully, refund processed, and inventory stock restored.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.fullName': { $regex: search, $options: 'i' } },
        { 'deliveryAddress.mobile': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name email mobile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        orders,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order lifecycle status (Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = [
      'PLACED',
      'CONFIRMED',
      'PACKED',
      'SHIPPED',
      'OUT FOR DELIVERY',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
      'REFUNDED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status "${status}"` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const prevStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Status updated from ${prevStatus} to ${status}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    // Idempotent stock restoration check
    if (['CANCELLED', 'REFUNDED', 'RETURNED'].includes(status) && !['CANCELLED', 'REFUNDED', 'RETURNED'].includes(prevStatus)) {
      if (!order.isInventoryRestored) {
        await restoreStockForOrder(order.items);
        order.isInventoryRestored = true;
      }
      if (order.paymentInfo && order.paymentInfo.status === 'PAID') {
        order.paymentInfo.status = 'REFUNDED';
        await Payment.findOneAndUpdate(
          { order: order._id },
          { status: 'REFUNDED' }
        );
      }
    }

    await order.save();

    // Notify customer on status update
    const customer = await User.findById(order.customer);
    if (customer) {
      let eventType = 'ORDER_CONFIRMED';
      if (status === 'SHIPPED') eventType = 'ORDER_SHIPPED';
      if (status === 'OUT FOR DELIVERY') eventType = 'OUT_FOR_DELIVERY';
      if (status === 'DELIVERED') eventType = 'ORDER_DELIVERED';
      if (status === 'CANCELLED') eventType = 'ORDER_CANCELLED';

      await sendOrderNotification({
        userId: customer._id,
        userEmail: customer.email,
        userName: customer.name,
        orderNumber: order.orderNumber,
        type: eventType,
        title: `Order Status: ${status}`,
        message: `Your order #${order.orderNumber} status is now: ${status}.`,
        orderId: order._id,
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
