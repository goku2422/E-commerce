# ApexCart Verification & Test Case Scenarios Checklist

This document details how the ApexCart platform explicitly handles each mandatory test case scenario described in Requirement #17.

---

### Scenario 1: Two customers attempting to purchase the last available product
* **Implementation Mechanism:** Implemented in `server/services/stockService.js` using atomic MongoDB queries (`Product.findOneAndUpdate({ _id: productId, stock: { $gte: qty } }, { $inc: { stock: -qty } })`).
* **Expected Result:** The first transaction succeeds and decrements stock to 0. The second concurrent transaction fails the query condition (`stock >= qty`), triggering an automatic rollback of any partial reservations and throwing a clean 400 error: `"Insufficient stock or item updated concurrently"`.

---

### Scenario 2 & 10: Customer modifying product/cart price in the frontend request
* **Implementation Mechanism:** Implemented in `server/services/cartService.js` and `server/controllers/paymentController.js`.
* **Expected Result:** Frontend price/subtotal parameters are completely ignored. The backend retrieves original product price and discountPrice directly from the database and recalculates `subtotal`, `deliveryFee`, `discount`, and `totalPayable`.

---

### Scenario 3: Customer applying an expired coupon
* **Implementation Mechanism:** Implemented in `server/services/cartService.js` and `server/controllers/couponController.js`.
* **Expected Result:** The backend checks `new Date() > new Date(coupon.expiryDate)`. Returns 400 error: `"Coupon code 'EXPIRED20' has expired."`

---

### Scenario 4: Customer applying a coupon below the minimum order value
* **Implementation Mechanism:** Implemented in `server/services/cartService.js`.
* **Expected Result:** Checks `subtotal < coupon.minOrderValue`. Returns 400 error: `"Minimum order value of ₹X required for coupon."`

---

### Scenario 5: Payment succeeds but frontend callback is interrupted
* **Implementation Mechanism:** Implemented in `server/controllers/paymentController.js` and Webhook listener (`/api/payments/webhook`).
* **Expected Result:** Razorpay server-to-server webhook captures event `payment.captured` / `order.paid` independently of browser status, verifying signature, updating order status to `PAID`, and reserving stock.

---

### Scenario 6: Payment webhook is received more than once (Idempotency)
* **Implementation Mechanism:** Implemented in `server/controllers/paymentController.js` in `handleWebhook()`.
* **Expected Result:** Checks `webhookEventsProcessed` array for `eventId` and verifies payment status. If already processed, returns HTTP 200: `"Webhook event already processed"` without duplicate stock deductions.

---

### Scenario 7: Customer attempting to access another customer's order
* **Implementation Mechanism:** Implemented in `server/controllers/orderController.js` (`getOrderById`).
* **Expected Result:** Validates `req.user.role !== 'admin' && order.customer._id !== req.user._id`. Returns HTTP 403 Forbidden: `"Authorization error: You do not have permission to view another customer's order details."`

---

### Scenario 8: Customer attempting to access an Admin API
* **Implementation Mechanism:** Implemented in `server/middleware/authMiddleware.js` (`adminOnly`).
* **Expected Result:** Rejects non-admin users with HTTP 403 Forbidden: `"Access denied. Admin privileges required."`

---

### Scenario 9: Customer ordering more quantity than available stock
* **Implementation Mechanism:** Implemented in `server/controllers/cartController.js` and `server/services/cartService.js`.
* **Expected Result:** Checks `newQuantity > product.stock`. Rejects cart addition with HTTP 400: `"Cannot add requested quantity. Only X units available in stock."`

---

### Scenario 11: Customer refreshing the page during payment
* **Implementation Mechanism:** Implemented in `server/controllers/paymentController.js`.
* **Expected Result:** Initial order is stored in DB with `paymentInfo.status = "PENDING"`. On page reload, customer can re-initiate payment or retry checkout without corrupted cart or state.

---

### Scenario 12: Cancelled order and refund handling
* **Implementation Mechanism:** Implemented in `server/services/stockService.js` (`restoreStockForOrder`).
* **Expected Result:** Updates order status to `CANCELLED`, payment info to `REFUNDED`, and atomically increments inventory stock back (`$inc: { stock: qty }`).

---

### Scenario 13: Invalid or expired JWT token
* **Implementation Mechanism:** Implemented in `server/middleware/authMiddleware.js`.
* **Expected Result:** Returns HTTP 401 Unauthorized: `"Not authorized, token failed or expired"`. Axios interceptor handles automatically clearing localStorage.

---

### Scenario 14: Duplicate registration using same email or mobile
* **Implementation Mechanism:** Implemented in `server/controllers/authController.js` (`registerUser`).
* **Expected Result:** Rejects request with HTTP 400 Bad Request: `"User with this email/mobile number already exists."`

---

### Scenario 15: Invalid product ID or deleted product during checkout
* **Implementation Mechanism:** Implemented in `server/services/cartService.js`.
* **Expected Result:** Checks if product exists and `product.isEnabled === true`. If missing or deleted, flags error: `"Product with ID X no longer exists"` and halts order creation.
