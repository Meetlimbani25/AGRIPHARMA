const express = require('express');
const router  = express.Router();
const { register, login, getProfile, updateProfile, shopkeeperRegister, shopkeeperLogin, adminLogin, forgotPasswordSendOtp, forgotPasswordVerifyAndReset, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',              register);
router.post('/login',                 login);
router.get('/profile',                protect, getProfile);
router.put('/profile',                protect, updateProfile);
router.post('/shopkeeper/register',   shopkeeperRegister);
router.post('/shopkeeper/login',      shopkeeperLogin);
router.post('/admin/login',           adminLogin);
router.post('/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/forgot-password/verify-reset', forgotPasswordVerifyAndReset);
router.post('/google',                googleLogin);

module.exports = router;
