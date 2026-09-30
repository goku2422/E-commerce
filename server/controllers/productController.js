const Product = require('../models/Product');
const Category = require('../models/Category');
const slugify = require('slugify');

// @desc    Get public product listing with search, filters, sort, pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const { search, category, subcategory, minPrice, maxPrice, inStock, sort } = req.query;

    let query = { isEnabled: true };

    // Search term
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { SKU: { $regex: search, $options: 'i' } },
      ];
    }

    // Category filter
    if (category) {
      let categoryObj = await Category.findOne({
        $or: [{ _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null }, { slug: category }],
      });
      if (categoryObj) {
        query.category = categoryObj._id;
      }
    }

    // Subcategory filter
    if (subcategory) {
      query.subcategory = subcategory;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // In Stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_low') sortOptions = { price: 1 };
    if (sort === 'price_high') sortOptions = { price: -1 };
    if (sort === 'rating') sortOptions = { averageRating: -1 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        products,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin product listing (includes enabled AND disabled products)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAdminProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const { search, category, isEnabled } = req.query;

    let query = {};

    if (isEnabled === 'true') query.isEnabled = true;
    if (isEnabled === 'false') query.isEnabled = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { SKU: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: {
        products,
        page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID or Slug
// @route   GET /api/products/:identifier
// @access  Public
const getProductByIdentifier = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    const product = await Product.findOne(query).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      SKU,
      price,
      discountPrice,
      stock,
      category,
      subcategory,
      images,
      description,
      isEnabled,
      isFeatured,
    } = req.body;

    if (!name || !SKU || price === undefined || stock === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, SKU, price, stock quantity, and category are required.',
      });
    }

    const existingSKU = await Product.findOne({ SKU: SKU.toUpperCase() });
    if (existingSKU) {
      return res.status(400).json({ success: false, message: `Product with SKU ${SKU} already exists.` });
    }

    const slug = slugify(name, { lower: true });

    const product = await Product.create({
      name,
      slug,
      SKU: SKU.toUpperCase(),
      price,
      discountPrice: discountPrice || 0,
      stock,
      category,
      subcategory,
      images: Array.isArray(images) ? images : [images],
      description,
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.body.name) {
      product.name = req.body.name;
      product.slug = slugify(req.body.name, { lower: true });
    }

    if (req.body.SKU && req.body.SKU !== product.SKU) {
      const existing = await Product.findOne({ SKU: req.body.SKU.toUpperCase() });
      if (existing) {
        return res.status(400).json({ success: false, message: 'SKU already in use by another product' });
      }
      product.SKU = req.body.SKU.toUpperCase();
    }

    if (req.body.price !== undefined) product.price = req.body.price;
    if (req.body.discountPrice !== undefined) product.discountPrice = req.body.discountPrice;
    if (req.body.stock !== undefined) product.stock = req.body.stock;
    if (req.body.category) product.category = req.body.category;
    if (req.body.subcategory !== undefined) product.subcategory = req.body.subcategory;
    if (req.body.images) product.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    if (req.body.description !== undefined) product.description = req.body.description;
    if (req.body.isEnabled !== undefined) product.isEnabled = req.body.isEnabled;
    if (req.body.isFeatured !== undefined) product.isFeatured = req.body.isFeatured;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product enable/disable status
// @route   PATCH /api/products/:id/toggle-status
// @access  Private/Admin
const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isEnabled = !product.isEnabled;
    await product.save();

    res.json({
      success: true,
      message: `Product has been ${product.isEnabled ? 'enabled' : 'disabled'}`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getProductByIdentifier,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
};
