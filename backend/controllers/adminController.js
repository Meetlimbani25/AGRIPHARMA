const db = require('../config/db');

/**
 * Retrieves a list of all shopkeepers for the admin dashboard.
 * Orders them by newest registrations first.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
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

/**
 * Updates the approval status of a shopkeeper.
 * Allows an admin to approve or reject a shopkeeper's registration.
 *
 * @param {Object} req - Express request object containing shopkeeper id in params and approval status in body
 * @param {Object} res - Express response object
 */
const setShopkeeperApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approve } = req.body;
    
    const is_approved = approve ? 1 : 0;
    const [result] = await db.query('UPDATE shopkeepers SET is_approved = ? WHERE id = ?', [is_approved, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Shopkeeper not found.' });
    }
    
    res.json({ success: true, message: `Shopkeeper ${approve ? 'approved' : 'rejected'} successfully.` });
  } catch (err) {
    console.error('admin approval error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getShopkeepers, setShopkeeperApproval };
