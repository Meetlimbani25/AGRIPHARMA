const db = require('../config/db');

// GET shopkeeper profile
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, shop_name, mobile, email, address, city, district, pincode, gst_number, shop_image, is_approved, upi_id, upi_name, bank_name, bank_account_number, bank_ifsc, invoice_terms, created_at, profile_picture FROM shopkeepers WHERE id = ?',
      [req.shopkeeper.id]
    );
    res.json({ success: true, shopkeeper: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE profile picture
const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image provided.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    await db.query('UPDATE shopkeepers SET profile_picture = ? WHERE id = ?', [imageUrl, req.shopkeeper.id]);
    res.json({ success: true, message: 'Profile picture updated successfully!', profile_picture: imageUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADD product
const addProduct = async (req, res) => {
  try {
    const { seed_id, name, category, description, price, price_unit, quantity_value, quantity_unit, discount_price, unit, stock, hsn_sac, gst_rate } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!category || category.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category is required. Please select a valid category.' });
    }

    const [result] = await db.query(
      `INSERT INTO shopkeeper_products (shopkeeper_id, seed_id, name, category, description, price, price_unit, quantity_value, quantity_unit, discount_price, unit, stock, image_url, is_approved, is_active, hsn_sac, gst_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.shopkeeper.id, seed_id || null, name, category.trim().toLowerCase(), description, price, price_unit, quantity_value, quantity_unit, discount_price || null, unit, stock, imageUrl, 1, 1, hsn_sac || null, gst_rate || 0]
    );

    res.status(201).json({ success: true, message: 'Product added and approved for sale.', product_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// GET my products
const getMyProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT sp.*, s.variety_name FROM shopkeeper_products sp LEFT JOIN seeds s ON sp.seed_id = s.id WHERE sp.shopkeeper_id = ?';
    let params = [req.shopkeeper.id];
    if (category) { query += ' AND sp.category = ?'; params.push(category); }
    query += ' ORDER BY sp.created_at DESC';
    const [products] = await db.query(query, params);
    res.json({ success: true, total: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE product
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, price_unit, discount_price, stock, hsn_sac, gst_rate } = req.body;
    await db.query(
      'UPDATE shopkeeper_products SET name=?, description=?, price=?, price_unit=?, discount_price=?, stock=?, hsn_sac=?, gst_rate=? WHERE id=? AND shopkeeper_id=?',
      [name, description, price, price_unit, discount_price || null, stock, hsn_sac || null, gst_rate || 0, req.params.id, req.shopkeeper.id]
    );
    res.json({ success: true, message: 'Product updated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE product
const deleteProduct = async (req, res) => {
  try {
    await db.query('DELETE FROM shopkeeper_products WHERE id = ? AND shopkeeper_id = ?', [req.params.id, req.shopkeeper.id]);
    res.json({ success: true, message: 'Product deleted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET incoming orders
const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT so.*, f.name as farmer_name, f.mobile as farmer_mobile, f.village as farmer_village,
             s.shop_name, s.address as shop_address, s.city as shop_city, s.gst_number, s.bank_name, s.bank_account_number, s.bank_ifsc, s.invoice_terms
      FROM shopkeeper_orders so
      JOIN farmers f ON so.farmer_id = f.id
      JOIN shopkeepers s ON so.shopkeeper_id = s.id
      WHERE so.shopkeeper_id = ?`;
    let params = [req.shopkeeper.id];
    if (status) { query += ' AND so.order_status = ?'; params.push(status); }
    query += ' ORDER BY so.created_at DESC';
    const [orders] = await db.query(query, params);

    // Fetch items for each order
    for (let order of orders) {
      const [items] = await db.query('SELECT * FROM shopkeeper_order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json({ success: true, total: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    const [orders] = await db.query('SELECT order_status FROM shopkeeper_orders WHERE id = ? AND shopkeeper_id = ?', [req.params.id, req.shopkeeper.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });
    const oldStatus = orders[0].order_status;

    await db.query(
      'UPDATE shopkeeper_orders SET order_status = ? WHERE id = ? AND shopkeeper_id = ?',
      [status, req.params.id, req.shopkeeper.id]
    );

    // Deduct stock if moving from pending to confirmed/shipped/delivered
    if (oldStatus === 'pending' && ['confirmed', 'shipped', 'delivered'].includes(status)) {
      const [items] = await db.query('SELECT product_id, quantity FROM shopkeeper_order_items WHERE order_id = ?', [req.params.id]);
      for (const item of items) {
        await db.query('UPDATE shopkeeper_products SET stock = GREATEST(ifnull(stock, 0) - ?, 0) WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    // Restore stock if a committed order is cancelled
    if (status === 'cancelled' && ['confirmed', 'shipped', 'delivered'].includes(oldStatus)) {
      const [items] = await db.query('SELECT product_id, quantity FROM shopkeeper_order_items WHERE order_id = ?', [req.params.id]);
      for (const item of items) {
        await db.query('UPDATE shopkeeper_products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    res.json({ success: true, message: `Order marked as ${status}!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET payments received
const getPayments = async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT sp.*, f.name as farmer_name, so.total_amount
       FROM shopkeeper_payments sp
       JOIN farmers f ON sp.farmer_id = f.id
       JOIN shopkeeper_orders so ON sp.order_id = so.id
       WHERE sp.shopkeeper_id = ?
       ORDER BY sp.created_at DESC`,
      [req.shopkeeper.id]
    );
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET product reviews
const getReviews = async (req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT sr.*, f.name as farmer_name, sp.name as product_name
       FROM shopkeeper_reviews sr
       JOIN farmers f ON sr.farmer_id = f.id
       JOIN shopkeeper_products sp ON sr.product_id = sp.id
       WHERE sr.shopkeeper_id = ?
       ORDER BY sr.created_at DESC`,
      [req.shopkeeper.id]
    );
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADD review (farmer adds review)
const addReview = async (req, res) => {
  try {
    const { product_id, shopkeeper_id, rating, review_text } = req.body;
    await db.query(
      `INSERT INTO shopkeeper_reviews (product_id, farmer_id, shopkeeper_id, rating, review_text)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text)`,
      [product_id, req.farmer.id, shopkeeper_id, rating, review_text]
    );
    res.json({ success: true, message: 'Review submitted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE UPI settings
const updateUpi = async (req, res) => {
  try {
    const { upi_id, upi_name } = req.body;
    await db.query(
      'UPDATE shopkeepers SET upi_id = ?, upi_name = ? WHERE id = ?',
      [upi_id || null, upi_name || null, req.shopkeeper.id]
    );
    res.json({ success: true, message: 'UPI settings updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE invoice settings
const updateInvoiceSettings = async (req, res) => {
  try {
    const { bank_name, bank_account_number, bank_ifsc, invoice_terms, gst_number } = req.body;
    await db.query(
      'UPDATE shopkeepers SET bank_name = ?, bank_account_number = ?, bank_ifsc = ?, invoice_terms = ?, gst_number = ? WHERE id = ?',
      [bank_name || null, bank_account_number || null, bank_ifsc || null, invoice_terms || null, gst_number || null, req.shopkeeper.id]
    );
    res.json({ success: true, message: 'Invoice settings updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET cancelled orders for refunds
const getCancelledOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT so.*, f.name as farmer_name, f.mobile as farmer_mobile, f.email, f.village,
              sp.payment_status, sp.amount, sp.payment_method
       FROM shopkeeper_orders so
       JOIN farmers f ON so.farmer_id = f.id
       LEFT JOIN shopkeeper_payments sp ON so.id = sp.order_id
       WHERE so.shopkeeper_id = ? AND so.order_status = 'cancelled'
       ORDER BY so.created_at DESC`,
      [req.shopkeeper.id]
    );

    // Fetch items for each order
    for (let order of orders) {
      const [items] = await db.query('SELECT * FROM shopkeeper_order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json({ success: true, total: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PROCESS refund for cancelled order
const processRefund = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { refund_amount, refund_note } = req.body;

    // Check order exists
    const [orders] = await db.query(
      'SELECT id, total_amount FROM shopkeeper_orders WHERE id = ? AND shopkeeper_id = ?',
      [order_id, req.shopkeeper.id]
    );
    if (orders.length === 0)
      return res.status(404).json({ success: false, message: 'Order not found.' });

    const order = orders[0];
    const amount = refund_amount || order.total_amount;

    // Check if payment exists
    const [payments] = await db.query(
      'SELECT id, payment_status FROM shopkeeper_payments WHERE order_id = ?',
      [order_id]
    );

    if (payments.length === 0) {
      return res.status(400).json({ success: false, message: 'No payment found for this order.' });
    }

    // Update payment as refunded
    await db.query(
      'UPDATE shopkeeper_payments SET payment_status = ?, refund_amount = ?, refund_note = ?, refund_processed_at = NOW() WHERE order_id = ?',
      ['refunded', amount, refund_note || null, order_id]
    );

    res.json({ success: true, message: `Refund of ₹${amount} processed successfully!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



module.exports = { getProfile, updateProfilePicture, addProduct, getMyProducts, updateProduct, deleteProduct, getOrders, updateOrderStatus, getPayments, getReviews, addReview, updateUpi, updateInvoiceSettings, getCancelledOrders, processRefund };
