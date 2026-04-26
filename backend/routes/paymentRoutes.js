const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const { makePayment, makeShopkeeperPayment, getPaymentHistory, getShopkeeperQr, confirmShopkeeperPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `upi_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/pay',                                protect, upload.single('screenshot'), makePayment);
router.post('/pay-shopkeeper',                     protect, upload.single('screenshot'), makeShopkeeperPayment);
router.get('/history',                             protect, getPaymentHistory);

router.get('/shopkeeper-qr/:order_id',             protect, getShopkeeperQr);
router.post('/confirm-shopkeeper-payment',         protect, upload.single('screenshot'), confirmShopkeeperPayment);

module.exports = router;
