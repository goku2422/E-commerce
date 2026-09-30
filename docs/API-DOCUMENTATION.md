# ApexCart REST API Documentation

Base URL: `http://localhost:5000/api`

---

## Response Structure Standard

### Success Response Format (HTTP 200/201)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response Format (HTTP 400/401/403/404/500)
```json
{
  "success": false,
  "message": "Error description message",
  "errors": []
}
```

---

## API Endpoints Overview

### 1. Authentication (`/api/auth`)
* `POST /api/auth/register` - Register customer account (Body: `name`, `email`, `mobile`, `password`)
* `POST /api/auth/login` - User login (Body: `email`, `password`)
* `GET /api/auth/me` - Get current authenticated user profile (Protected)
* `GET /api/auth/profile` - Get profile details (Protected)
* `PUT /api/auth/profile` - Update profile details (Protected)
* `PUT /api/auth/change-password` - Change account password (Protected)
* `POST /api/auth/forgot-password` - Generate password reset token (Body: `email`)
* `PUT /api/auth/reset-password/:resetToken` - Reset password (Body: `password`)

### 2. Addresses (`/api/addresses`)
* `GET /api/addresses` - List customer addresses (Protected)
* `POST /api/addresses` - Add delivery address (Protected)
* `PUT /api/addresses/:id` - Update address (Protected)
* `DELETE /api/addresses/:id` - Remove address (Protected)
* `PATCH /api/addresses/:id/default` - Set default address (Protected)

### 3. Categories (`/api/categories`)
* `GET /api/categories` - List categories with subcategories (Public)
* `GET /api/categories/:slug` - Get category by slug (Public)
* `POST /api/categories` - Create category & subcategories (Admin Only)
* `PUT /api/categories/:id` - Update category & subcategories (Admin Only)
* `DELETE /api/categories/:id` - Delete category (Admin Only)

### 4. Products (`/api/products`)
* `GET /api/products` - Public filterable catalog (Query: `search`, `category`, `minPrice`, `maxPrice`, `sort`, `inStock`, `page`, `limit`)
* `GET /api/products/:identifier` - Get product details by ID or Slug (Public)
* `POST /api/products` - Create new product (Admin Only)
* `PUT /api/products/:id` - Update product details (Admin Only)
* `PATCH /api/products/:id/toggle-status` - Enable/Disable product (Admin Only)
* `DELETE /api/products/:id` - Delete product (Admin Only)

### 5. Shopping Cart (`/api/cart`)
* `GET /api/cart` - Get active cart with backend recalculation (Protected)
* `POST /api/cart/items` - Add item to cart with stock validation (Protected)
* `PUT /api/cart/items/:productId` - Update item quantity (Protected)
* `DELETE /api/cart/items/:productId` - Remove item (Protected)
* `DELETE /api/cart` - Clear cart (Protected)

### 6. Coupons & Promotions (`/api/coupons`)
* `GET /api/coupons` - List coupons (Admin Only)
* `POST /api/coupons` - Create coupon with limits and expiry (Admin Only)
* `PUT /api/coupons/:id` - Update coupon details (Admin Only)
* `DELETE /api/coupons/:id` - Delete coupon (Admin Only)

### 7. Checkout & Payments (`/api/checkout` & `/api/payments`)
* `POST /api/checkout/summary` - Recalculate verified order summary & shipping fees (Protected)
* `POST /api/payments/create-order` - Create Razorpay order & pending DB order (Protected)
* `POST /api/payments/verify` - Verify Razorpay HMAC signature & deduct stock (Protected)
* `POST /api/payments/webhook` - Idempotent Razorpay Webhook listener (Public / Signature Verified)

### 8. Order Management (`/api/orders`)
* `GET /api/orders/my-orders` - List customer order history (Protected)
* `GET /api/orders/:id` - View order details & tracking history (Protected - Customer Isolated)
* `PUT /api/orders/:id/cancel` - Cancel order & restore stock (Protected)
* `GET /api/orders/admin/all` - List all store orders (Admin Only)
* `PUT /api/orders/admin/:id/status` - Update order lifecycle status (Admin Only)

### 9. Admin Control (`/api/admin`)
* `GET /api/admin/dashboard` - Real-time statistics, revenue metrics & low stock alerts (Admin Only)
* `GET /api/admin/products` - List all products including disabled items (Admin Only)
* `GET /api/admin/users` - Customer accounts management list (Admin Only)
* `PATCH /api/admin/users/:id/toggle-block` - Block/unblock user account (Admin Only)
* `GET /api/admin/delivery-config` - Fetch active shipping rates & free threshold (Public / Admin)
* `PUT /api/admin/delivery-config` - Update standard fee, express fee, free threshold (Admin Only)
* `GET /api/admin/payments` - Transaction audit logs & gateway status (Admin Only)
