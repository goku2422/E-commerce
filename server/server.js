const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables with absolute path resolution
const serverEnvPath = path.resolve(__dirname, '.env');
const rootEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

// Safe Razorpay Environment Diagnostic (Requirement 6: NEVER print secrets)
const rzpKeyId = process.env.RAZORPAY_KEY_ID || '';
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
const isKeyIdValid = Boolean(rzpKeyId && !rzpKeyId.includes('your_'));
const isKeySecretValid = Boolean(rzpKeySecret && !rzpKeySecret.includes('your_'));
const rzpPrefix = rzpKeyId.startsWith('rzp_test_')
  ? 'rzp_test_...'
  : rzpKeyId.startsWith('rzp_live_')
  ? 'rzp_live_...'
  : 'unrecognized';

console.log('[ENV DIAGNOSTIC] Razorpay Config Check:', {
  RAZORPAY_KEY_ID_configured: isKeyIdValid,
  RAZORPAY_KEY_SECRET_configured: isKeySecretValid,
  RAZORPAY_KEY_ID_prefix: rzpPrefix,
});

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Connect to MongoDB Database
connectDB();

const app = express();

// Security Headers
app.use(helmet());

// Logging in dev mode
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS Configuration (Requirement 9 & Test Case 14)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('CORS Policy: Request from origin ' + origin + ' blocked'));
      }
    },
    credentials: true,
  })
);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter for Authentication Endpoints (Requirement 11)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 500, // Reasonable limit for dev/testing
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ApexCart Single Vendor E-Commerce REST API is healthy and operational!',
    timestamp: new Date().toISOString(),
  });
});

// API Routes Registration
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/users', require('./routes/authRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 & Global Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`ApexCart Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});
