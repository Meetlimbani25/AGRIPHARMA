const db = require('../config/db');

const placeOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { address } = req.body;
    const farmerId = req.farmer.id;

    const [cartItems] = await conn.query(
      `SELECT c.*, 
              p.price as current_price, p.name as pname, p.stock as pstock,
              a.price as seed_price, a.price_unit, a.stock as sstock
       FROM cart c
       LEFT JOIN products p ON c.product_id = p.id
       LEFT JOIN admin_seed_stock a ON c.seed_stock_id = a.id
       WHERE c.farmer_id = ?`, [farmerId]
    );

    if (cartItems.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const total = cartItems.reduce((sum, i) => sum + (i.price_snapshot * i.quantity), 0);

    const [order] = await conn.query(
      'INSERT INTO orders (farmer_id, total_amount, address) VALUES (?, ?, ?)',
      [farmerId, total, address]
    );
    const orderId = order.insertId;

    for (const item of cartItems) {
      const itemName = item.item_type === 'product' ? item.pname : 'Seed';
      await conn.query(
        `INSERT INTO order_items (order_id, item_type, product_id, seed_stock_id, item_name, quantity, price_unit, price_at_purchase)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.item_type, item.product_id, item.seed_stock_id, itemName, item.quantity, item.price_unit, item.price_snapshot]
      );

      // Deduct stock for admin products and seeds
      if (item.item_type === 'product' && item.product_id) {
        await conn.query(
          `UPDATE products SET stock = GREATEST(ifnull(stock, 0) - ?, 0) WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      } else if (item.item_type === 'seed' && item.seed_stock_id) {
        await conn.query(
          `UPDATE admin_seed_stock SET stock = GREATEST(ifnull(stock, 0) - ?, 0) WHERE id = ?`,
          [item.quantity, item.seed_stock_id]
        );
      }
    }

    await conn.query('DELETE FROM cart WHERE farmer_id = ?', [farmerId]);
    await conn.commit();

    res.status(201).json({ success: true, message: 'Order placed successfully!', order_id: orderId, total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// GET my orders
const getMyOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.farmer_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.farmer.id]
    );

    for (let o of orders) {
      const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      o.items = items;
    }

    res.json({ success: true, total: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET order detail
const getOrderById = async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND farmer_id = ?', [req.params.id, req.farmer.id]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    const [payment] = await db.query('SELECT * FROM payments WHERE order_id = ?', [req.params.id]);

    res.json({ success: true, order: orders[0], items, payment: payment[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PLACE SHOPKEEPER ORDER
const placeShopkeeperOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { shopkeeper_id, address, note } = req.body;
    const farmerId = req.farmer.id;

    const [cartItems] = await conn.query(
      `SELECT sc.*, sp.name, sp.price, sp.discount_price, sp.price_unit, sp.hsn_sac, sp.gst_rate
       FROM shopkeeper_cart sc
       JOIN shopkeeper_products sp ON sc.product_id = sp.id
       WHERE sc.farmer_id = ? AND sc.shopkeeper_id = ?`,
      [farmerId, shopkeeper_id]
    );

    if (cartItems.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'No items for this shopkeeper in cart.' });
    }

    const total = cartItems.reduce((sum, i) => sum + (i.price_snapshot * i.quantity), 0);

    const [order] = await conn.query(
      'INSERT INTO shopkeeper_orders (farmer_id, shopkeeper_id, total_amount, delivery_address, note) VALUES (?, ?, ?, ?, ?)',
      [farmerId, shopkeeper_id, total, address, note]
    );
    const orderId = order.insertId;

    for (const item of cartItems) {
      await conn.query(
        `INSERT INTO shopkeeper_order_items (order_id, product_id, product_name, quantity, price_unit, price_at_purchase, subtotal, hsn_sac, gst_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.quantity, item.price_unit, item.price_snapshot, item.price_snapshot * item.quantity, item.hsn_sac, item.gst_rate]
      );
    }

    await conn.query('DELETE FROM shopkeeper_cart WHERE farmer_id = ? AND shopkeeper_id = ?', [farmerId, shopkeeper_id]);
    await conn.commit();

    res.status(201).json({ success: true, message: 'Order placed!', order_id: orderId, total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// GET shopkeeper orders (farmer side)
const getMyShopkeeperOrders = async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT so.*, s.shop_name, s.city, s.mobile as shop_mobile, s.address as shop_address, s.gst_number, s.bank_name, s.bank_account_number, s.bank_ifsc, s.invoice_terms, f.name as farmer_name, f.village as farmer_village
       FROM shopkeeper_orders so
       JOIN shopkeepers s ON so.shopkeeper_id = s.id
       JOIN farmers f ON so.farmer_id = f.id
       WHERE so.farmer_id = ?
       ORDER BY so.created_at DESC`,
      [req.farmer.id]
    );

    for (let o of orders) {
      const [items] = await db.query('SELECT * FROM shopkeeper_order_items WHERE order_id = ?', [o.id]);
      o.items = items;
    }

    res.json({ success: true, total: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CANCEL my official order (and process refund)
const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const farmerId = req.farmer.id;
    const [orders] = await db.query('SELECT status FROM orders WHERE id = ? AND farmer_id = ?', [orderId, farmerId]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (orders[0].status === 'delivered') return res.status(400).json({ success: false, message: 'Cannot cancel a delivered order.' });
    if (orders[0].status === 'cancelled') return res.status(400).json({ success: false, message: 'Order is already cancelled.' });

    // Mark order as cancelled
    await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [orderId]);
    
    // Restore stock
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    for (const item of items) {
      if (item.item_type === 'product' && item.product_id) {
        await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      } else if (item.item_type === 'seed' && item.seed_stock_id) {
        await db.query('UPDATE admin_seed_stock SET stock = stock + ? WHERE id = ?', [item.quantity, item.seed_stock_id]);
      }
    }

    // Mark payment as refunded if money was paid
    await db.query("UPDATE payments SET payment_status = 'refunded' WHERE order_id = ? AND payment_status != 'failed'", [orderId]);

    res.json({ success: true, message: 'Order cancelled successfully. Refund has been processed to your original payment method.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CANCEL my shopkeeper (local) order (and process refund)
const deleteShopkeeperOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const farmerId = req.farmer.id;
    const [orders] = await db.query('SELECT order_status FROM shopkeeper_orders WHERE id = ? AND farmer_id = ?', [orderId, farmerId]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });
    const oldStatus = orders[0].order_status;
    if (oldStatus === 'delivered') return res.status(400).json({ success: false, message: 'Cannot cancel an order that has already been delivered.' });
    if (oldStatus === 'cancelled') return res.status(400).json({ success: false, message: 'Order is already cancelled.' });

    // Mark order as cancelled
    await db.query("UPDATE shopkeeper_orders SET order_status = 'cancelled' WHERE id = ?", [orderId]);

    // Restore stock if it was deducted
    if (['confirmed', 'shipped'].includes(oldStatus)) {
      const [items] = await db.query('SELECT product_id, quantity FROM shopkeeper_order_items WHERE order_id = ?', [orderId]);
      for (const item of items) {
        await db.query('UPDATE shopkeeper_products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }
    
    // Mark payment as refunded if money was paid
    await db.query("UPDATE shopkeeper_payments SET payment_status = 'refunded' WHERE order_id = ? AND payment_status != 'failed'", [orderId]);

    res.json({ success: true, message: 'Order cancelled successfully. Refund has been processed to your original payment method.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, placeShopkeeperOrder, getMyShopkeeperOrders, deleteOrder, deleteShopkeeperOrder };
