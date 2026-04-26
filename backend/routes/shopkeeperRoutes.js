const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/shopkeeperController');
const { protect, protectShopkeeper } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `product_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `shopkeeper_${Date.now()}${path.extname(file.originalname)}`)
});
const uploadProfilePic = multer({ storage: profilePicStorage });

// Shopkeeper routes (shopkeeper auth)
router.get('/profile', protectShopkeeper, ctrl.getProfile);
router.put('/profile-picture', protectShopkeeper, uploadProfilePic.single('image'), ctrl.updateProfilePicture);
router.put('/update-upi', protectShopkeeper, ctrl.updateUpi);
router.put('/invoice-settings', protectShopkeeper, ctrl.updateInvoiceSettings);
router.post('/products', protectShopkeeper, upload.single('image'), ctrl.addProduct);
router.get('/products', protectShopkeeper, ctrl.getMyProducts);
router.put('/products/:id', protectShopkeeper, ctrl.updateProduct);
router.delete('/products/:id', protectShopkeeper, ctrl.deleteProduct);
router.get('/orders', protectShopkeeper, ctrl.getOrders);
router.put('/orders/:id/status', protectShopkeeper, ctrl.updateOrderStatus);

router.get('/cancelled-orders', protectShopkeeper, ctrl.getCancelledOrders);
router.post('/orders/:order_id/refund', protectShopkeeper, ctrl.processRefund);
router.get('/payments', protectShopkeeper, ctrl.getPayments);
router.get('/reviews', protectShopkeeper, ctrl.getReviews);

// Farmer adds review (farmer auth)
router.post('/reviews', protect, ctrl.addReview);

module.exports = router;
