const Product = require('../models/Product');

/**
 * Atomically deduct stock for an order's items.
 * Uses atomic MongoDB findOneAndUpdate with condition { stock: { $gte: quantity } }.
 * If any item fails to satisfy stock availability, reverses previous deductions and throws error.
 */
const deductStockForOrder = async (items) => {
  const deducted = [];

  for (const item of items) {
    const productId = item.product._id || item.product;
    const qty = item.quantity;

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, isEnabled: true, stock: { $gte: qty } },
      { $inc: { stock: -qty } },
      { new: true }
    );

    if (!updatedProduct) {
      // Rollback previous deductions if concurrency check failed
      for (const prev of deducted) {
        await Product.findByIdAndUpdate(prev.productId, {
          $inc: { stock: prev.qty },
        });
      }
      throw new Error(
        `Insufficient stock or item updated concurrently for product: ${item.name || productId}`
      );
    }

    deducted.push({ productId, qty });
  }

  return true;
};

/**
 * Restores stock when an order is cancelled or refunded.
 */
const restoreStockForOrder = async (items) => {
  for (const item of items) {
    const productId = item.product._id || item.product;
    const qty = item.quantity;

    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: qty },
    });
  }
  return true;
};

module.exports = { deductStockForOrder, restoreStockForOrder };
