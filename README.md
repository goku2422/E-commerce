# ApexCart - Single Vendor E-Commerce Platform (MERN Stack)

ApexCart is a production-grade, full-stack Single Vendor E-Commerce Application built with Node.js, Express, MongoDB, React (Vite), Tailwind CSS, and Razorpay Test/Sandbox Payment Gateway integration.

---

## Key Platform Features

* **Authentication & User Management:**
  * JWT-Based Authentication with HTTP status codes and middleware security.
  * bcrypt password hashing (10 salt rounds).
  * Password Reset Flow (Token-based forgot & reset password).
  * Customer Profile Management & Saved Address Book (Multiple delivery addresses per customer).
  * Role-Based Access Control (`customer` vs `admin`).

* **Product & Category Catalog:**
  * Full product CRUD for Admin (Name, Description, SKU, Price, Discount Price, Stock, Category, Subcategory, Images, Enable/Disable status).
  * Customer Catalog with Search, Category filtering, Price filtering, Sorting, and Pagination.
  * Stock Status Indicators (In Stock, Low Stock ≤ 5 units, Out of Stock).

* **Shopping Cart & Strict Backend Price Calculation:**
  * Real-time item quantity update, item removal, cart clear.
  * **CRITICAL SECURITY ENFORCEMENT:** Frontend prices, subtotals, delivery fees, and discounts are NOT trusted. The backend recalculates all values directly from database records.

* **Checkout & Payment Integration:**
  * Multi-step checkout (Address -> Shipping -> Order Summary -> Razorpay Gateway).
  * **Razorpay Sandbox Integration:** HMAC-SHA256 signature verification on backend.
  * **Idempotent Webhooks:** Handles `payment.captured` and `order.paid` safely without duplicating stock deductions or orders.

* **Atomic Stock & Inventory Management:**
  * Atomic stock operations (`$inc: { stock: -qty }` with condition `stock: { $gte: qty }`) preventing race conditions and overselling.
  * Automatic stock restoration upon order cancellation or refund.

* **Order & Delivery Tracking:**
  * Order Status History Timeline (`PLACED` -> `CONFIRMED` -> `PACKED` -> `SHIPPED` -> `OUT FOR DELIVERY` -> `DELIVERED`).
  * Strict Customer Isolation (Customers can ONLY view and manage their own orders; unauthorized requests return 403 Forbidden).

* **Professional Admin Control Panel:**
  * KPI Metric Cards (Total Revenue, Total Orders, Today's Orders, Total Customers, Low Stock Alerts).
  * Product Inventory Manager, Category Manager, Order Lifecycle Manager, Coupon Code Creator, Customer Account Manager (Block/Unblock).

---

## Tech Stack

* **Frontend:** React.js, Vite, React Router v6, Axios, Tailwind CSS, Lucide Icons, React Hot Toast
* **Backend:** Node.js, Express.js, MongoDB (Mongoose ODM), JWT, bcryptjs, Razorpay Node SDK, Helmet, CORS, Express Rate Limit
* **Documentation:** OpenAPI / Markdown, Mermaid ER Diagram, Postman Collection JSON

---

## Project Structure

```
E-Commerce/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # Navbar, Footer, AdminSidebar, ProductCard, OrderTracker, Modal
│   │   ├── context/        # AuthContext, CartContext
│   │   ├── pages/
│   │   │   ├── customer/   # Home, Catalog, Detail, Cart, Checkout, Confirmation, Orders, Profile
│   │   │   └── admin/      # Dashboard, Products, Categories, Orders, Coupons, Users
│   │   ├── services/       # Axios API client with interceptors
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                 # Express REST API Backend
│   ├── config/             # DB & Razorpay credentials setup
│   ├── controllers/        # Auth, Address, Product, Cart, Coupon, Payment, Order, Admin
│   ├── middleware/         # Auth, AdminRole, ErrorHandler, Validation
│   ├── models/             # User, Address, Category, Product, Cart, Order, Payment, Coupon
│   ├── routes/             # REST API Express routers
│   ├── services/           # Cart calculation, Stock atomic operations, Notification
│   ├── scripts/            # Seed script for instant test data
│   └── server.js
├── docs/                   # Documentation Artifacts
│   ├── API-DOCUMENTATION.md
│   ├── ER-DIAGRAM.md
│   ├── POSTMAN-COLLECTION.json
│   └── TESTING-CHECKLIST.md
├── .env.example
├── README.md
└── package.json
```

---

## Test Credentials Format

After running the database seed script (`npm run seed`), use these credentials:

| Account Type | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@apexcart.com` | `Admin@123456` |
| **Demo Customer** | `customer@apexcart.com` | `Customer@123456` |

---

## Quick Setup Instructions

### 1. Prerequisites
* **Node.js**: v18.x or higher
* **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017/ecommerce_db` or MongoDB Atlas URI

### 2. Installation
Run setup command from root to install server and client dependencies:
```bash
npm run setup
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory (or use root `.env.example` as reference):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce_db
JWT_SECRET=super_secret_jwt_key_change_in_production_12345
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### 4. Database Seeding
Seed the database with sample categories, products, admin account, customer account, and discount coupons:
```bash
npm run seed
```

### 5. Running Application in Development
Start backend server and frontend client concurrently:
* Terminal 1 (Server): `npm run server`
* Terminal 2 (Client): `npm run client`

Access the web application at: `http://localhost:5173`

---

## Payment Sandbox Configuration (Razorpay)

1. Sign up for a Razorpay Test Account at [dashboard.razorpay.com](https://dashboard.razorpay.com/).
2. Navigate to **Account & Settings** -> **API Keys** -> **Generate Test Key**.
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to your `server/.env` file.
4. During frontend checkout, use Razorpay Sandbox Test Cards or UPI details:
   * **Test Card:** `4111 1111 1111 1111`, Expiry: `12/30`, CVV: `123`, OTP: `123456`
   * **Test UPI:** `success@razorpay`

---

## Deployment Guide

### Deployment to Render / Vercel
1. **Backend (Render / Railway):**
   * Build command: `cd server && npm install`
   * Start command: `node server/server.js`
   * Set Environment Variables: `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CLIENT_URL`.
2. **Frontend (Vercel / Netlify):**
   * Root directory: `client`
   * Build command: `npm run build`
   * Output directory: `dist`

---

## Verification & Test Scenarios

Refer to [`docs/TESTING-CHECKLIST.md`](./docs/TESTING-CHECKLIST.md) for full detailed code implementations handling all 15 critical test scenarios (concurrency overselling, price tampering, expired coupons, webhook idempotency, customer data isolation).
