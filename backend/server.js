// =============================================
// AI PLANT DISEASE DETECTION - BACKEND SERVER
// Node.js + Express + MySQL
// =============================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initializeDatabase } = require('./initDb');
require('dotenv').config();

const app = express();

initializeDatabase().catch((err) => {
  console.error('❌ DB bootstrap failed:', err.message);
});

// =============================================
// MIDDLEWARE
// =============================================
const allowedOrigins = [
  'https://agripharma.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000'
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Enable pre-flight across-the-board
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================
// ROUTES
// =============================================
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/crops',       require('./routes/cropRoutes'));
app.use('/api/shop',        require('./routes/shopRoutes'));
app.use('/api/cart',        require('./routes/cartRoutes'));
app.use('/api/orders',      require('./routes/orderRoutes'));
app.use('/api/disease',     require('./routes/diseaseRoutes'));
app.use('/api/payments',    require('./routes/paymentRoutes'));
app.use('/api/shopkeeper',  require('./routes/shopkeeperRoutes'));
app.use('/api/admin',        require('./routes/adminRoutes'));

// =============================================
// ROOT ROUTE
// =============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌱 AI Plant Disease Detection API is running!',
    version: '1.0.0',
    endpoints: {
      auth:       '/api/auth',
      crops:      '/api/crops',
      shop:       '/api/shop',
      cart:       '/api/cart',
      orders:     '/api/orders',
      disease:    '/api/disease',
      payments:   '/api/payments',
      shopkeeper: '/api/shopkeeper'
    }
  });
});

// =============================================
// 404 HANDLER
// =============================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// =============================================
// ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
});

// =============================================
// START SERVER
// =============================================
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('========================================\n');
  });
}

module.exports = app;