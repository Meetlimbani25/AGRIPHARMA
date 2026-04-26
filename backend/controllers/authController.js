const db      = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

// =============================================
// FARMER REGISTER
// POST /api/auth/register
// =============================================
const register = async (req, res) => {
  try {
    const { name, village, taluko, district, land_size, mobile, email, water_level, password } = req.body;

    if (!name || !mobile || !password)
      return res.status(400).json({ success: false, message: 'Name, mobile and password are required.' });

    // Check if mobile already exists
    const [existing] = await db.query('SELECT id FROM farmers WHERE mobile = ?', [mobile]);
    if (existing.length > 0)
      return res.status(400).json({ success: false, message: 'Mobile number already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO farmers (name, village, taluko, district, land_size, mobile, email, water_level, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, village, taluko, district, land_size, mobile, email, water_level, hashedPassword]
    );

    const token = jwt.sign({ id: result.insertId, mobile, role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      farmer: { id: result.insertId, name, mobile, village, district }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================
// FARMER LOGIN
// POST /api/auth/login
// =============================================
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password)
      return res.status(400).json({ success: false, message: 'Mobile and password are required.' });

    const [farmers] = await db.query('SELECT * FROM farmers WHERE mobile = ?', [mobile]);
    if (farmers.length === 0)
      return res.status(401).json({ success: false, message: 'Mobile number not registered.' });

    const farmer = farmers[0];
    const isMatch = await bcrypt.compare(password, farmer.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Wrong password. Please try again.' });

    const token = jwt.sign({ id: farmer.id, mobile: farmer.mobile, role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      farmer: { id: farmer.id, name: farmer.name, mobile: farmer.mobile, village: farmer.village, district: farmer.district }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================
// GET FARMER PROFILE
// GET /api/auth/profile (protected)
// =============================================
const getProfile = async (req, res) => {
  try {
    const [farmers] = await db.query('SELECT id, name, village, taluko, district, land_size, mobile, email, water_level, created_at FROM farmers WHERE id = ?', [req.farmer.id]);
    if (farmers.length === 0)
      return res.status(404).json({ success: false, message: 'Farmer not found.' });
    res.json({ success: true, farmer: farmers[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================
// UPDATE FARMER PROFILE
// PUT /api/auth/profile (protected)
// =============================================
const updateProfile = async (req, res) => {
  try {
    const { name, village, taluko, district, land_size, email, water_level } = req.body;
    await db.query(
      `UPDATE farmers SET name=?, village=?, taluko=?, district=?, land_size=?, email=?, water_level=? WHERE id=?`,
      [name, village, taluko, district, land_size, email, water_level, req.farmer.id]
    );
    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================
// SHOPKEEPER REGISTER
// POST /api/auth/shopkeeper/register
// =============================================
const shopkeeperRegister = async (req, res) => {
  try {
    const { name, shop_name, mobile, email, address, city, district, pincode, gst_number, password, upi_id, upi_name } = req.body;

    if (!name || !shop_name || !mobile || !password)
      return res.status(400).json({ success: false, message: 'Name, shop name, mobile and password are required.' });

    const [existing] = await db.query('SELECT id FROM shopkeepers WHERE mobile = ?', [mobile]);
    if (existing.length > 0)
      return res.status(400).json({ success: false, message: 'Mobile number already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO shopkeepers (name, shop_name, mobile, email, address, city, district, pincode, gst_number, password, is_approved, upi_id, upi_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, shop_name, mobile, email, address, city, district, pincode, gst_number, hashedPassword, 1, upi_id || null, upi_name || null]
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your shopkeeper account is auto-approved for local use.',
      shopkeeper: { id: result.insertId, name, shop_name, mobile, city, is_approved: 1 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================
// SHOPKEEPER LOGIN
// POST /api/auth/shopkeeper/login
// =============================================
const shopkeeperLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const [shopkeepers] = await db.query('SELECT * FROM shopkeepers WHERE mobile = ?', [mobile]);
    if (shopkeepers.length === 0)
      return res.status(401).json({ success: false, message: 'Mobile number not registered.' });

    const shopkeeper = shopkeepers[0];

    const shopkeeperAutoApprove = process.env.SHOPKEEPER_AUTO_APPROVE === 'true';
    if (!shopkeeper.is_approved && !shopkeeperAutoApprove)
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval.' });

    const isMatch = await bcrypt.compare(password, shopkeeper.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Wrong password.' });

    const token = jwt.sign({ id: shopkeeper.id, mobile: shopkeeper.mobile, role: 'shopkeeper' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      shopkeeper: { id: shopkeeper.id, name: shopkeeper.name, shop_name: shopkeeper.shop_name, mobile: shopkeeper.mobile, city: shopkeeper.city, profile_picture: shopkeeper.profile_picture }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================
// ADMIN LOGIN
// POST /api/auth/admin/login
// =============================================
const adminLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const ADMIN_MOBILE = process.env.ADMIN_MOBILE || '9054101116';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (!mobile || !password) return res.status(400).json({ success: false, message: 'Mobile and password are required.' });

    // allow option for password==mobile if no env set, for quick local testing
    const validAdmin =
      (mobile === ADMIN_MOBILE && password === ADMIN_PASSWORD) ||
      (process.env.ADMIN_MOBILE === undefined && process.env.ADMIN_PASSWORD === undefined && password === mobile);

    if (!validAdmin) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

    const token = jwt.sign({ id: 0, mobile, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'Admin login successful!', token, admin: { mobile } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// =============================================
// FORGOT PASSWORD - SEND OTP VIA EMAIL
// POST /api/auth/forgot-password/send-otp
// =============================================
const forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ success: false, message: 'Email and role are required.' });

    const table = role === 'farmer' ? 'farmers' : 'shopkeepers';
    const [users] = await db.query(`SELECT id FROM ${table} WHERE email = ?`, [email]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'Email address not registered.' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database
    await db.query(`UPDATE ${table} SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?`, [otp, expiry, email]);

    // Send email
    const { sendOTPEmail } = require('../Utils/sendEmail');
    const emailRes = await sendOTPEmail(email, otp);
    if (!emailRes.success) {
      // Clear OTP if sending fails
      await db.query(`UPDATE ${table} SET reset_otp = NULL, reset_otp_expiry = NULL WHERE email = ?`, [email]);
      return res.status(500).json({ success: false, message: 'Failed to send OTP via Email: ' + emailRes.error });
    }

    res.json({ success: true, message: 'OTP sent successfully to your email!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =============================================
// FORGOT PASSWORD - VERIFY AND RESET
// POST /api/auth/forgot-password/verify-reset
// =============================================
const forgotPasswordVerifyAndReset = async (req, res) => {
  try {
    const { email, role, otp, newPassword } = req.body;
    if (!email || !role || !otp || !newPassword) return res.status(400).json({ success: false, message: 'All fields are required.' });

    const table = role === 'farmer' ? 'farmers' : 'shopkeepers';
    const [users] = await db.query(`SELECT reset_otp, reset_otp_expiry FROM ${table} WHERE email = ?`, [email]);
    
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    
    const user = users[0];
    const now = new Date();

    if (!user.reset_otp || user.reset_otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (!user.reset_otp_expiry || user.reset_otp_expiry < now) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password and clear OTP
    await db.query(`UPDATE ${table} SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE email = ?`, [hashedPassword, email]);

    res.json({ success: true, message: 'Password has been safely reset! You can now login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, shopkeeperRegister, shopkeeperLogin, adminLogin, forgotPasswordSendOtp, forgotPasswordVerifyAndReset };
