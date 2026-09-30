const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const DeliveryConfig = require('../models/DeliveryConfig');

/**
 * Calculates complete cart & checkout breakdown strictly using current database records.
 * NEVER trust frontend prices, subtotals, delivery charges or discounts.
 */
const calculateCartTotals = async ({ items, userId, couponCode = null }) => {
  let subtotal = 0;
  const processedItems = [];
  const errors = [];

  // Fetch or create dynamic delivery config from DB
  let deliveryConfig = await DeliveryConfig.findOne({ isActive: true });
  if (!deliveryConfig) {
    deliveryConfig = await DeliveryConfig.create({
      minAmountForFreeDelivery: 999,
      defaultDeliveryFee: 50,
      expressDeliveryFee: 100,
      estimatedDays: '3-5 Business Days',
      isActive: true,
    });
  }

  const defaultDeliveryFee = Number(deliveryConfig.defaultDeliveryFee) || 50;
  const expressDeliveryFee = Number(deliveryConfig.expressDeliveryFee) || 100;
  const minAmountForFreeDelivery = Number(deliveryConfig.minAmountForFreeDelivery) || 999;

  if (!items || items.length === 0) {
    return {
      items: [],
      subtotal: 0,
      discount: 0,
      deliveryFee: 0,
      standardDeliveryFee: defaultDeliveryFee,
      expressDeliveryFee: expressDeliveryFee,
      minAmountForFreeDelivery: minAmountForFreeDelivery,
      isFreeDelivery: false,
      totalPayable: 0,
      couponApplied: null,
      errors: ['Cart is empty'],
    };
  }

  for (const item of items) {
    const productId = item.product._id || item.product;
    const product = await Product.findById(productId);

    if (!product) {
      errors.push(`Product with ID ${productId} no longer exists.`);
      continue;
    }

    if (!product.isEnabled) {
      errors.push(`Product "${product.name}" is currently disabled/unavailable.`);
      continue;
    }

    if (item.quantity > product.stock) {
      errors.push(
        `Requested quantity (${item.quantity}) for "${product.name}" exceeds available stock (${product.stock}).`
      );
    }

    // Determine actual active unit price
    const effectivePrice = product.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

    const itemTotal = effectivePrice * item.quantity;
    subtotal += itemTotal;

    processedItems.push({
      product: {
        _id: product._id,
        name: product.name,
        SKU: product.SKU,
        price: product.price,
        discountPrice: product.discountPrice,
        effectivePrice,
        images: product.images,
        stock: product.stock,
        isEnabled: product.isEnabled,
      },
      quantity: item.quantity,
      itemTotal,
    });
  }

  const isFreeDelivery = subtotal >= minAmountForFreeDelivery || subtotal === 0;
  const deliveryFee = isFreeDelivery ? 0 : defaultDeliveryFee;

  let couponDiscount = 0;
  let couponDetails = null;

  // Coupon validation on backend
  if (couponCode && subtotal > 0) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });

    if (!coupon) {
      errors.push(`Coupon code "${couponCode}" is invalid.`);
    } else if (!coupon.isActive) {
      errors.push(`Coupon code "${couponCode}" is inactive.`);
    } else if (new Date() > new Date(coupon.expiryDate)) {
      errors.push(`Coupon code "${couponCode}" has expired.`);
    } else if (coupon.usedCount >= coupon.usageLimit) {
      errors.push(`Coupon code "${couponCode}" usage limit reached.`);
    } else if (subtotal < coupon.minOrderValue) {
      errors.push(
        `Minimum order value of ₹${coupon.minOrderValue} required for coupon "${couponCode}".`
      );
    } else {
      // Calculate discount amount safely
      if (coupon.discountType === 'percentage') {
        couponDiscount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'fixed') {
        couponDiscount = coupon.discountValue;
      }

      // Ensure discount doesn't exceed subtotal
      if (couponDiscount > subtotal) {
        couponDiscount = subtotal;
      }

      couponDetails = {
        code: coupon.code,
        couponId: coupon._id,
        discountAmount: couponDiscount,
      };
    }
  }

  const totalPayable = Math.max(0, subtotal - couponDiscount + deliveryFee);

  return {
    items: processedItems,
    subtotal,
    discount: couponDiscount,
    deliveryFee,
    standardDeliveryFee: defaultDeliveryFee,
    expressDeliveryFee: expressDeliveryFee,
    minAmountForFreeDelivery: minAmountForFreeDelivery,
    isFreeDelivery,
    totalPayable,
    couponApplied: couponDetails,
    errors,
  };
};

module.exports = { calculateCartTotals };
