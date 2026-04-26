const express = require('express');
const router  = express.Router();
const { getCart, addToCart, addToShopkeeperCart, updateCart, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/',                protect, getCart);

// Backward compatibility for existing frontend calls
router.post('/',                protect, addToCart);
router.post('/shopkeeper',      protect, addToShopkeeperCart);

// New route format
router.post('/add',             protect, addToCart);
router.post('/add-shopkeeper',  protect, addToShopkeeperCart);
router.put('/update',           protect, updateCart);
router.delete('/remove/:id',    protect, removeFromCart);
router.delete('/clear',         protect, clearCart);

module.exports = router;
