const db = require('../config/db');

// PAY for admin order
const makePayment = async (req, res) => {
  try {
    const { order_id, payment_method, upi_id, upi_transaction_id, delivery_address } = req.body;
    const farmerId = req.farmer.id;
    const screenshotPath = req.file ? req.file.path : null;

    const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND farmer_id = ?', [order_id, farmerId]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [existing] = await db.query('SELECT id FROM payments WHERE order_id = ?', [order_id]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Payment already exists for this order.' });

    const status = payment_method === 'cod' ? 'cod_pending' : 'processing';

    await db.query(
      `INSERT INTO payments (order_id, farmer_id, amount, payment_method, payment_status, upi_id, upi_transaction_id, upi_screenshot_path, delivery_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, farmerId, orders[0].total_amount, payment_method, status, upi_id, upi_transaction_id, screenshotPath, delivery_address]
    );

    res.json({ success: true, message: payment_method === 'cod' ? 'COD order confirmed!' : 'Payment submitted! Admin will verify your UPI payment.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PAY for shopkeeper order
const makeShopkeeperPayment = async (req, res) => {
  try {
    const { order_id, payment_method, upi_id, upi_transaction_id } = req.body;
    const farmerId = req.farmer.id;
    const screenshotPath = req.file ? req.file.path : null;

    const [orders] = await db.query('SELECT * FROM shopkeeper_orders WHERE id = ? AND farmer_id = ?', [order_id, farmerId]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const status = payment_method === 'cod' ? 'cod_pending' : 'processing';

    await db.query(
      `INSERT INTO shopkeeper_payments (order_id, farmer_id, shopkeeper_id, amount, payment_method, payment_status, upi_id, upi_transaction_id, upi_screenshot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, farmerId, orders[0].shopkeeper_id, orders[0].total_amount, payment_method, status, upi_id, upi_transaction_id, screenshotPath]
    );

    res.json({ success: true, message: 'Payment submitted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET payment history
const getPaymentHistory = async (req, res) => {
  try {
    const [payments] = await db.query(
      'SELECT p.*, o.status as order_status FROM payments p JOIN orders o ON p.order_id = o.id WHERE p.farmer_id = ? ORDER BY p.created_at DESC',
      [req.farmer.id]
    );
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET Shopkeeper QR Code Data
const getShopkeeperQr = async (req, res) => {
  try {
    const orderId = req.params.order_id;
    const farmerId = req.farmer.id;
    const [orders] = await db.query(
      `SELECT so.*, s.upi_id, s.upi_name, s.shop_name 
       FROM shopkeeper_orders so
       JOIN shopkeepers s ON so.shopkeeper_id = s.id
       WHERE so.id = ? AND so.farmer_id = ?`, [orderId, farmerId]
    );

    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const order = orders[0];
    if (!order.upi_id) return res.status(400).json({ success: false, message: 'Shopkeeper has not set up UPI ID.' });

    const upiLink = `upi://pay?pa=${order.upi_id}&pn=${encodeURIComponent(order.upi_name || order.shop_name)}&am=${order.total_amount}&tn=${encodeURIComponent('KrishiSeva Order #' + order.id)}&cu=INR`;

    res.json({
      success: true,
      qr_data: upiLink,
      shopkeeper_upi: order.upi_id,
      amount: order.total_amount,
      order_id: order.id,
      shop_name: order.shop_name
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CONFIRM Shopkeeper Payment via QR
const confirmShopkeeperPayment = async (req, res) => {
  try {
    const { order_id, utr_number } = req.body;
    const farmerId = req.farmer.id;
    const screenshotPath = req.file ? req.file.path : null;

    if (!order_id || !utr_number) return res.status(400).json({ success: false, message: 'Order ID and UTR Number are required.' });

    const [orders] = await db.query('SELECT * FROM shopkeeper_orders WHERE id = ? AND farmer_id = ?', [order_id, farmerId]);
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [existing] = await db.query('SELECT id FROM shopkeeper_payments WHERE order_id = ?', [order_id]);

    if (existing.length > 0) {
      await db.query(
        `UPDATE shopkeeper_payments SET utr_number = ?, payment_status = 'processing', upi_screenshot = COALESCE(?, upi_screenshot) WHERE order_id = ?`,
        [utr_number, screenshotPath, order_id]
      );
    } else {
      await db.query(
        `INSERT INTO shopkeeper_payments (order_id, farmer_id, shopkeeper_id, amount, payment_method, payment_status, utr_number, upi_screenshot)
         VALUES (?, ?, ?, ?, 'upi', 'processing', ?, ?)`,
        [order_id, farmerId, orders[0].shopkeeper_id, orders[0].total_amount, utr_number, screenshotPath]
      );
    }

    res.json({ success: true, message: 'Payment confirmed successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { makePayment, makeShopkeeperPayment, getPaymentHistory, getShopkeeperQr, confirmShopkeeperPayment };
