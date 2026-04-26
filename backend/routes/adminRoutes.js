const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/auth');
const { getShopkeepers, setShopkeeperApproval } = require('../controllers/adminController');

router.get('/shopkeepers', protectAdmin, getShopkeepers);
router.put('/shopkeepers/:id/approval', protectAdmin, setShopkeeperApproval);


module.exports = router;
