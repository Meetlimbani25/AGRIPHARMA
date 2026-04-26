const db = require('../config/db');

const getShopkeepers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, shop_name, mobile, email, address, city, district, pincode, gst_number, is_approved, created_at FROM shopkeepers ORDER BY created_at DESC'
    );
    res.json({ success: true, shopkeepers: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setShopkeeperApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approve } = req.body;
    console.log('admin approval request', { id, approve, body: req.body, user: req.admin });
    const is_approved = approve ? 1 : 0;
    const [result] = await db.query('UPDATE shopkeepers SET is_approved = ? WHERE id = ?', [is_approved, id]);
    if (result.affectedRows === 0) {
      console.log('shopkeeper not found', id);
      return res.status(404).json({ success: false, message: 'Shopkeeper not found.' });
    }
    console.log('shopkeeper approval updated', { id, is_approved });
    res.json({ success: true, message: `Shopkeeper ${approve ? 'approved' : 'rejected'} successfully.` });
  } catch (err) {
    console.error('admin approval error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getShopkeepers, setShopkeeperApproval };
