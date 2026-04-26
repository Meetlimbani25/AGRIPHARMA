const db = require('../config/db');

// GET all products (fertilizer + medicine)
const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY category, name';
    const [products] = await db.query(query, params);
    res.json({ success: true, total: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single product
const getProductById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all seeds with stock info
const getSeeds = async (req, res) => {
  try {
    const { crop_id, search } = req.query;
    let query = `
      SELECT s.*, c.name as crop_name, c.season,
             a.id as stock_id, a.price, a.price_unit,
             a.quantity_value, a.quantity_unit, a.stock
      FROM seeds s
      JOIN crops c ON s.crop_id = c.id
      LEFT JOIN admin_seed_stock a ON s.id = a.seed_id AND a.is_active = 1
      WHERE 1=1`;
    let params = [];
    if (crop_id) { query += ' AND s.crop_id = ?'; params.push(crop_id); }
    if (search) { query += ' AND s.variety_name LIKE ?'; params.push(`%${search}%`); }
    const [seeds] = await db.query(query, params);
    res.json({ success: true, total: seeds.length, seeds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET shopkeeper products (for farmers to browse)
const getShopkeeperProducts = async (req, res) => {
  try {
    const { category, city, search } = req.query;
    let query = `
      SELECT sp.*, s.shop_name, s.city, s.mobile,
             sd.variety_name, sd.days_to_harvest, sd.company
      FROM shopkeeper_products sp
      JOIN shopkeepers s ON sp.shopkeeper_id = s.id
      LEFT JOIN seeds sd ON sp.seed_id = sd.id
      WHERE s.is_approved = 1 AND sp.is_active = 1`;
    let params = [];
    if (category) { query += ' AND sp.category = ?'; params.push(category); }
    if (city) { query += ' AND s.city LIKE ?'; params.push(`%${city}%`); }
    if (search) { query += ' AND sp.name LIKE ?'; params.push(`%${search}%`); }
    query += ' ORDER BY sp.category, sp.name';
    const [products] = await db.query(query, params);
    res.json({ success: true, total: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const [reviews] = await db.query(`
      SELECT r.*, f.name as user_name
      FROM product_reviews r
      JOIN farmers f ON r.user_id = f.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `, [id]);
    res.json({ success: true, total: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADD a review for a product
const addProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review_text } = req.body;
    const user_id = req.user.id; // Assuming auth middleware sets req.user

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Check if user already reviewed this product
    const [existing] = await db.query(
      'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?',
      [id, user_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    await db.query(
      'INSERT INTO product_reviews (product_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [id, user_id, rating, review_text || '']
    );

    res.json({ success: true, message: 'Review added successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single shopkeeper product
const getShopkeeperProductById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT sp.*, s.shop_name, s.city, s.mobile, sd.variety_name, sd.days_to_harvest, sd.company
      FROM shopkeeper_products sp
      JOIN shopkeepers s ON sp.shopkeeper_id = s.id
      LEFT JOIN seeds sd ON sp.seed_id = sd.id
      WHERE sp.id = ?
    `, [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'Shopkeeper product not found.' });
    res.json({ success: true, product: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET reviews for a shopkeeper product
const getShopkeeperProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const [reviews] = await db.query(`
      SELECT r.*, f.name as user_name
      FROM shopkeeper_product_reviews r
      JOIN farmers f ON r.user_id = f.id
      WHERE r.shopkeeper_product_id = ?
      ORDER BY r.created_at DESC
    `, [id]);
    res.json({ success: true, total: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADD a review for a shopkeeper product
const addShopkeeperProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review_text } = req.body;
    const user_id = req.user.id;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }
    // Check if user already reviewed this product
    const [existing] = await db.query(
      'SELECT id FROM shopkeeper_product_reviews WHERE shopkeeper_product_id = ? AND user_id = ?',
      [id, user_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }
    await db.query(
      'INSERT INTO shopkeeper_product_reviews (shopkeeper_product_id, user_id, rating, review_text) VALUES (?, ?, ?, ?)',
      [id, user_id, rating, review_text || '']
    );
    res.json({ success: true, message: 'Review added successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getProducts, getProductById, getSeeds, getShopkeeperProducts, getProductReviews, addProductReview,
  getShopkeeperProductById, getShopkeeperProductReviews, addShopkeeperProductReview
};
