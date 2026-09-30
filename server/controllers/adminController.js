const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Payment = require('../models/Payment');
const DeliveryConfig = require('../models/DeliveryConfig');

// @desc    Get admin dashboard metrics & stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT FOR DELIVERY'] },
    });
    const deliveredOrders = await Order.countDocuments({ status: 'DELIVERED' });
    const cancelledOrders = await Order.countDocuments({ status: 'CANCELLED' });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaysOrders = await Order.countDocuments({ createdAt: { $gte: startOfToday } });

    const revenueAgg = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'PAID', status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();

    const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
      .populate('category', 'name')
      .limit(10);

    const recentOrders = await Order.find()
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalOrders,
        todaysOrders,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        totalCustomers,
        totalProducts,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({ role: 'customer' });
    const users = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        users,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle customer blocked status
// @route   PATCH /api/admin/users/:id/toggle-block
// @access  Private/Admin
const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block an admin account' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: `User has been ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get delivery charge configuration (Admin / Public)
// @route   GET /api/admin/delivery-config
// @access  Public / Admin
const getDeliveryConfig = async (req, res, next) => {
  try {
    let config = await DeliveryConfig.findOne({ isActive: true });
    if (!config) {
      config = await DeliveryConfig.create({
        minAmountForFreeDelivery: 999,
        defaultDeliveryFee: 50,
        expressDeliveryFee: 100,
        estimatedDays: '3-5 Business Days',
        isActive: true,
      });
    }
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery charge configuration (Admin)
// @route   PUT /api/admin/delivery-config
// @access  Private/Admin
const updateDeliveryConfig = async (req, res, next) => {
  try {
    const { minAmountForFreeDelivery, defaultDeliveryFee, expressDeliveryFee, estimatedDays } = req.body;

    let config = await DeliveryConfig.findOne({ isActive: true });
    if (!config) {
      config = new DeliveryConfig();
    }

    if (minAmountForFreeDelivery !== undefined) config.minAmountForFreeDelivery = Number(minAmountForFreeDelivery);
    if (defaultDeliveryFee !== undefined) config.defaultDeliveryFee = Number(defaultDeliveryFee);
    if (expressDeliveryFee !== undefined) config.expressDeliveryFee = Number(expressDeliveryFee);
    if (estimatedDays) config.estimatedDays = estimatedDays;

    await config.save();

    res.json({
      success: true,
      message: 'Delivery charges and rules updated successfully!',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payment transactions (Admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { razorpayOrderId: { $regex: search, $options: 'i' } },
        { razorpayPaymentId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('user', 'name email mobile')
      .populate('order', 'orderNumber status totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        payments,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserBlock,
  getDeliveryConfig,
  updateDeliveryConfig,
  getAllPayments,
};
