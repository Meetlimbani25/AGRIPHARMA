const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const { detectDisease, getHistory, getScanById } = require('../controllers/diseaseController');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `scan_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    allowed.test(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new Error('Only image files allowed!'));
  }
});

router.post('/detect',      protect, upload.single('image'), detectDisease);
router.get('/history',      protect, getHistory);
router.get('/history/:id',  protect, getScanById);

module.exports = router;
