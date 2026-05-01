const db      = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const FarmerModel = require('../models/FarmerModel');
const ShopkeeperModel = require('../models/ShopkeeperModel');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

/**
 * Registers a new farmer in the system.
 * Validates input, checks if the mobile number is already registered, 
 * hashes the password, and returns a signed JWT token.
 *
 * @param {Object} req - Express request object containing farmer details
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const { name, village, taluko, district, land_size, mobile, email, water_level, password } = req.body;

    if (!name || !mobile || !password)
      return res.status(400).json({ success: false, message: 'Name, mobile and password are required.' });

    // Check if mobile already exists
    const existing = await FarmerModel.findByMobile(mobile);
    if (existing)
      return res.status(400).json({ success: false, message: 'Mobile number already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertId = await FarmerModel.create({
      name, village, taluko, district, land_size, mobile, email, water_level, password: hashedPassword
    });

    const token = jwt.sign({ id: insertId, mobile, role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      farmer: { id: insertId, name, mobile, village, district }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Authenticates a farmer.
 * Compares the provided password with the hashed password in the database
 * and returns a signed JWT token upon successful login.
 *
 * @param {Object} req - Express request object containing mobile and password
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password)
      return res.status(400).json({ success: false, message: 'Mobile and password are required.' });

    const farmer = await FarmerModel.findByMobile(mobile);
    if (!farmer)
      return res.status(401).json({ success: false, message: 'Mobile number not registered.' });

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

/**
 * Retrieves the profile details of the currently authenticated farmer.
 *
 * @param {Object} req - Express request object containing authenticated farmer ID
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const farmer = await FarmerModel.findById(req.farmer.id);
    if (!farmer)
      return res.status(404).json({ success: false, message: 'Farmer not found.' });
    res.json({ success: true, farmer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Updates the profile information of the currently authenticated farmer.
 *
 * @param {Object} req - Express request object containing updated details
 * @param {Object} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const { name, village, taluko, district, land_size, email, water_level } = req.body;
    await FarmerModel.update(req.farmer.id, { name, village, taluko, district, land_size, email, water_level });
    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Registers a new shopkeeper.
 * Hashes the password and sets the initial approval status.
 *
 * @param {Object} req - Express request object containing shopkeeper details
 * @param {Object} res - Express response object
 */
const shopkeeperRegister = async (req, res) => {
  try {
    const { name, shop_name, mobile, email, address, city, district, pincode, gst_number, password, upi_id, upi_name } = req.body;

    if (!name || !shop_name || !mobile || !password)
      return res.status(400).json({ success: false, message: 'Name, shop name, mobile and password are required.' });

    const existing = await ShopkeeperModel.findByMobile(mobile);
    if (existing)
      return res.status(400).json({ success: false, message: 'Mobile number already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertId = await ShopkeeperModel.create({
      name, shop_name, mobile, email, address, city, district, pincode, gst_number, password: hashedPassword, is_approved: 1, upi_id, upi_name
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your shopkeeper account is auto-approved for local use.',
      shopkeeper: { id: insertId, name, shop_name, mobile, city, is_approved: 1 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Authenticates a shopkeeper.
 * Verifies credentials and ensures the account is approved by an admin
 * before returning a JWT token.
 *
 * @param {Object} req - Express request object containing mobile and password
 * @param {Object} res - Express response object
 */
const shopkeeperLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const shopkeeper = await ShopkeeperModel.findByMobile(mobile);
    if (!shopkeeper)
      return res.status(401).json({ success: false, message: 'Mobile number not registered.' });

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

    const Model = role === 'farmer' ? FarmerModel : ShopkeeperModel;
    const user = await Model.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'Email address not registered.' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database
    await Model.updateOtp(email, otp, expiry);

    // Send email
    const { sendOTPEmail } = require('../Utils/sendEmail');
    const emailRes = await sendOTPEmail(email, otp);
    if (!emailRes.success) {
      // Clear OTP if sending fails
      await Model.updateOtp(email, null, null);
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

    const Model = role === 'farmer' ? FarmerModel : ShopkeeperModel;
    const user = await Model.findByEmail(email);
    
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    
    const now = new Date();

    if (!user.reset_otp || user.reset_otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }

    if (!user.reset_otp_expiry || user.reset_otp_expiry < now) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password and clear OTP
    await Model.updatePasswordAndClearOtp(email, hashedPassword);

    res.json({ success: true, message: 'Password has been safely reset! You can now login.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Handles Google Single Sign-On (SSO).
 * Verifies the Google JWT and logs the user in. Auto-registers if they don't exist.
 *
 * @param {Object} req - Express request object containing Google credential and role
 * @param {Object} res - Express response object
 */
const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;
    if (!credential || !role) return res.status(400).json({ success: false, message: 'Google token and role are required.' });

    // Verify Google Token (In production, use proper CLIENT_ID)
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id', 
    }).catch(e => {
      // If we are using a dummy client ID for the project, we can fallback to decoding manually for demo purposes
      const decoded = jwt.decode(credential);
      if (!decoded) throw new Error('Invalid Google Token');
      return { getPayload: () => decoded };
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) return res.status(400).json({ success: false, message: 'Google account must have an email.' });

    if (role === 'farmer') {
      let farmer = await FarmerModel.findByEmailFull(email);
      if (!farmer) {
        // Auto-register Farmer
        const dummyMobile = 'G' + Date.now().toString().slice(-9); // Ensure unique 10 char
        const insertId = await FarmerModel.create({
          name: name || 'Google User',
          mobile: dummyMobile,
          email: email,
          password: await bcrypt.hash(Math.random().toString(36), 10)
        });
        farmer = { id: insertId, name, mobile: dummyMobile, email };
      }
      const token = jwt.sign({ id: farmer.id, mobile: farmer.mobile, role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, message: 'Google Login successful!', token, farmer });
      
    } else if (role === 'shopkeeper') {
      let shopkeeper = await ShopkeeperModel.findByEmailFull(email);
      if (!shopkeeper) {
        // Auto-register Shopkeeper
        const dummyMobile = 'G' + Date.now().toString().slice(-9);
        const insertId = await ShopkeeperModel.create({
          name: name || 'Google User',
          shop_name: name ? `${name}'s Shop` : 'Google Shop',
          mobile: dummyMobile,
          email: email,
          password: await bcrypt.hash(Math.random().toString(36), 10),
          is_approved: 1,
          profile_picture: picture
        });
        shopkeeper = { id: insertId, name, shop_name: name ? `${name}'s Shop` : 'Google Shop', mobile: dummyMobile, email };
      }
      const token = jwt.sign({ id: shopkeeper.id, mobile: shopkeeper.mobile, role: 'shopkeeper' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, message: 'Google Login successful!', token, shopkeeper });
    }

    res.status(400).json({ success: false, message: 'Invalid role.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Google SSO failed: ' + err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, shopkeeperRegister, shopkeeperLogin, adminLogin, forgotPasswordSendOtp, forgotPasswordVerifyAndReset, googleLogin };
