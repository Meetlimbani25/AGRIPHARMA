const express = require('express');
const router  = express.Router();
const { placeOrder, getMyOrders, getOrderById, placeShopkeeperOrder, getMyShopkeeperOrders, deleteOrder, deleteShopkeeperOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/',                      protect, placeOrder);
router.get('/my',                     protect, getMyOrders);
router.get('/:id',                    protect, getOrderById);
router.post('/shopkeeper',            protect, placeShopkeeperOrder);
router.get('/shopkeeper/my',          protect, getMyShopkeeperOrders);
router.delete('/:id',                 protect, deleteOrder);
router.delete('/shopkeeper/:id',      protect, deleteShopkeeperOrder);

module.exports = router;
