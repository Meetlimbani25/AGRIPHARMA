const express = require('express');
const router  = express.Router();
const { getAllCrops, getCropById, getWeeklySchedule } = require('../controllers/cropController');

router.get('/',               getAllCrops);
router.get('/:id',            getCropById);
router.get('/:id/schedule',   getWeeklySchedule);

module.exports = router;
