const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const DeliveryConfig = require('../models/DeliveryConfig');
const slugify = require('slugify');

dotenv.config();

const seedDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce_db';
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      console.log('Connected to MongoDB for seeding...');
    } catch (connErr) {
      console.warn('Local MongoDB unavailable. Using MongoDB Memory Server for seeding...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
    }

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await DeliveryConfig.deleteMany({});

    console.log('Cleared existing collection data...');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@apexcart.com',
      mobile: '9876543210',
      password: 'Admin@123456',
      role: 'admin',
    });

    const customerUser = await User.create({
      name: 'John Customer',
      email: 'customer@apexcart.com',
      mobile: '9123456789',
      password: 'Customer@123456',
      role: 'customer',
    });

    console.log('Created Users (Admin & Customer)...');

    // 2. Create Delivery Config
    await DeliveryConfig.create({
      minAmountForFreeDelivery: 999,
      defaultDeliveryFee: 50,
      expressDeliveryFee: 100,
      estimatedDays: '3-5 Business Days',
      isActive: true,
    });
    console.log('Created Delivery Configuration (Free Threshold: ₹999, Standard: ₹50, Express: ₹100)...');

    // 3. Create Categories
    const electronics = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets, devices, smartphones & premium accessories',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80',
      subcategories: [
        { name: 'Smartphones', slug: 'smartphones' },
        { name: 'Audio', slug: 'audio' },
        { name: 'Wearables', slug: 'wearables' },
      ],
    });

    const fashion = await Category.create({
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Trendy clothing, luxury wear and accessories',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
      subcategories: [
        { name: 'Men Wear', slug: 'men-wear' },
        { name: 'Women Wear', slug: 'women-wear' },
      ],
    });

    const homeLiving = await Category.create({
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Modern home decor, kitchenware and ergonomics',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
      subcategories: [{ name: 'Decor', slug: 'decor' }],
    });

    console.log('Created Categories...');

    // 4. Create Clean Products (Realistic Pricing)
    const productsData = [
      {
        name: 'Apex Wireless Noise Cancelling Headphones',
        description: 'Immersive sound quality with active noise cancellation, 40-hour battery life, and ultra-comfortable memory foam earcups.',
        price: 4999,
        discountPrice: 3999,
        SKU: 'APX-HEAD-001',
        stock: 25,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
        ],
        category: electronics._id,
        subcategory: 'Audio',
        isFeatured: true,
      },
      {
        name: 'Apex Ultra Smartwatch Pro',
        description: 'AMOLED display, heart-rate monitoring, SPO2 sensor, multi-sport tracking, and 7-day battery stamina.',
        price: 6999,
        discountPrice: 5499,
        SKU: 'APX-WATCH-002',
        stock: 15,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        ],
        category: electronics._id,
        subcategory: 'Wearables',
        isFeatured: true,
      },
      {
        name: 'Ergonomic Executive Office Chair',
        description: 'High-back mesh ergonomic office chair with lumbar support, adjustable headrest, and 3D armrests.',
        price: 12999,
        discountPrice: 9999,
        SKU: 'APX-CHAIR-003',
        stock: 8,
        images: [
          'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=800&auto=format&fit=crop&q=80',
        ],
        category: homeLiving._id,
        subcategory: 'Decor',
        isFeatured: true,
      },
      {
        name: 'Premium Cotton Minimalist T-Shirt',
        description: '100% organic combed cotton t-shirt with breathable fabric and tailored modern fit.',
        price: 1499,
        discountPrice: 999,
        SKU: 'APX-TSHIRT-004',
        stock: 50,
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        ],
        category: fashion._id,
        subcategory: 'Men Wear',
        isFeatured: false,
      },
    ];

    for (const p of productsData) {
      const slug = slugify(p.name, { lower: true });
      await Product.create({ ...p, slug });
    }

    console.log('Created Products...');

    // 5. Create Coupons
    await Coupon.create({
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 999,
      maxDiscount: 500,
      expiryDate: new Date('2030-12-31'),
      usageLimit: 500,
      isActive: true,
    });

    console.log('Created Coupons (WELCOME10)...');
    console.log('==================================================');
    console.log('Database Seeding Completed Successfully!');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDB();
