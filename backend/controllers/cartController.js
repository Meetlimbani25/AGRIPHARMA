const db = require('../config/db');

// GET farmer cart
const getCart = async (req, res) => {
  try {
    const farmerId = req.farmer.id;

    // Admin products/seeds cart
    const [adminCart] = await db.query(
      `SELECT c.*, 
              p.name as product_name, p.image_url as product_image, p.id as product_id,
              s.variety_name as seed_name, cr.name as crop_name, cr.id as crop_id, a.id as seed_stock_id
       FROM cart c
       LEFT JOIN products p         ON c.product_id = p.id AND c.item_type = 'product'
       LEFT JOIN admin_seed_stock a ON c.seed_stock_id = a.id AND c.item_type = 'seed'
       LEFT JOIN seeds s            ON a.seed_id = s.id
       LEFT JOIN crops cr           ON s.crop_id = cr.id
       WHERE c.farmer_id = ?`, [farmerId]
    );

    // Shopkeeper cart
    const [shopCart] = await db.query(
      `SELECT sc.*, sp.name as product_name, sp.category, sp.id as product_id,
              sp.image_url, sh.shop_name, sh.city, sh.upi_id, sh.upi_name
       FROM shopkeeper_cart sc
       JOIN shopkeeper_products sp ON sc.product_id = sp.id
       JOIN shopkeepers sh         ON sc.shopkeeper_id = sh.id
       WHERE sc.farmer_id = ?`, [farmerId]
    );

    const adminTotal = adminCart.reduce((sum, i) => sum + (i.price_snapshot * i.quantity), 0);
    const shopTotal  = shopCart.reduce((sum, i) => sum + (i.price_snapshot * i.quantity), 0);

    res.json({
      success: true,
      admin_cart:    { items: adminCart,  total: adminTotal },
      shopkeeper_cart: { items: shopCart, total: shopTotal },
      grand_total:   adminTotal + shopTotal
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADD to admin cart
const addToCart = async (req, res) => {
  try {
    const { item_type, product_id, seed_stock_id, quantity = 1 } = req.body;
    const farmerId = req.farmer.id;

    let price = 0;
    let price_unit = '';

    if (item_type === 'product') {
      const [rows] = await db.query('SELECT price, price_unit FROM products WHERE id = ?', [product_id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
      price = rows[0].price;
      price_unit = rows[0].price_unit;
    } else {
      const [rows] = await db.query('SELECT price, price_unit FROM admin_seed_stock WHERE id = ?', [seed_stock_id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'Seed not found.' });
      price = rows[0].price;
      price_unit = rows[0].price_unit;
    }

    // Check if already in cart - update quantity
    const [existing] = await db.query(
      `SELECT id FROM cart WHERE farmer_id = ? AND item_type = ? AND 
       ${item_type === 'product' ? 'product_id = ?' : 'seed_stock_id = ?'}`,
      [farmerId, item_type, item_type === 'product' ? product_id : seed_stock_id]
    );

    if (existing.length > 0) {
      await db.query(
        'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
        [quantity, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO cart (farmer_id, item_type, product_id, seed_stock_id, quantity, price_snapshot, price_unit)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [farmerId, item_type, product_id || null, seed_stock_id || null, quantity, price, price_unit]
      );
    }

    res.json({ success: true, message: 'Added to cart successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ADD to shopkeeper cart
const addToShopkeeperCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const farmerId = req.farmer.id;

    const [rows] = await db.query(
      'SELECT sp.*, s.id as shopkeeper_id FROM shopkeeper_products sp JOIN shopkeepers s ON sp.shopkeeper_id = s.id WHERE sp.id = ?',
      [product_id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

    const product = rows[0];
    const price   = product.discount_price || product.price;

    const [existing] = await db.query(
      'SELECT id FROM shopkeeper_cart WHERE farmer_id = ? AND product_id = ?',
      [farmerId, product_id]
    );

    if (existing.length > 0) {
      await db.query('UPDATE shopkeeper_cart SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
    } else {
      await db.query(
        `INSERT INTO shopkeeper_cart (farmer_id, product_id, shopkeeper_id, quantity, price_snapshot, price_unit)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [farmerId, product_id, product.shopkeeper_id, quantity, price, product.price_unit]
      );
    }

    res.json({ success: true, message: 'Added to cart!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE cart quantity
const updateCart = async (req, res) => {
  try {
    const { cart_id, quantity, cart_type = 'admin' } = req.body;
    if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    const table = cart_type === 'shopkeeper' ? 'shopkeeper_cart' : 'cart';
    await db.query(`UPDATE ${table} SET quantity = ? WHERE id = ? AND farmer_id = ?`, [quantity, cart_id, req.farmer.id]);
    res.json({ success: true, message: 'Cart updated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REMOVE from cart
const removeFromCart = async (req, res) => {
  try {
    const { cart_type = 'admin' } = req.query;
    const table = cart_type === 'shopkeeper' ? 'shopkeeper_cart' : 'cart';
    await db.query(`DELETE FROM ${table} WHERE id = ? AND farmer_id = ?`, [req.params.id, req.farmer.id]);
    res.json({ success: true, message: 'Removed from cart!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CLEAR cart
const clearCart = async (req, res) => {
  try {
    const { cart_type = 'admin' } = req.query;
    const table = cart_type === 'shopkeeper' ? 'shopkeeper_cart' : 'cart';
    await db.query(`DELETE FROM ${table} WHERE farmer_id = ?`, [req.farmer.id]);
    res.json({ success: true, message: 'Cart cleared!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCart, addToCart, addToShopkeeperCart, updateCart, removeFromCart, clearCart };

