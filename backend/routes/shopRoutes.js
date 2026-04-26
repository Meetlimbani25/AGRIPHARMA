const express = require('express');
const router  = express.Router();
const { getProducts, getProductById, getSeeds, getShopkeeperProducts, getProductReviews, addProductReview, getShopkeeperProductById, getShopkeeperProductReviews, addShopkeeperProductReview } = require('../controllers/shopController');
const { protect, protectShopkeeper } = require('../middleware/auth');

router.get('/products',              getProducts);
router.get('/products/:id',          getProductById);
router.get('/products/:id/reviews',  getProductReviews);
router.post('/products/:id/reviews', protect, addProductReview);
router.get('/seeds',                 getSeeds);
router.get('/shopkeeper-products',   getShopkeeperProducts);
router.get('/shopkeeper-products/:id', getShopkeeperProductById);
router.get('/shopkeeper-products/:id/reviews', getShopkeeperProductReviews);
router.post('/shopkeeper-products/:id/reviews', protectShopkeeper, addShopkeeperProductReview);

module.exports = router;
