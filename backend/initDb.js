const db = require('./config/db');

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function tableExists(tableName) {
  const [rows] = await db.query(
    `SELECT 1
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
     LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

async function ensureColumn(tableName, columnName, columnDefSql) {
  const hasTable = await tableExists(tableName);
  if (!hasTable) {
    console.warn(`⚠️ Skipped ${tableName}.${columnName} (table missing)`);
    return;
  }
  const exists = await columnExists(tableName, columnName);
  if (exists) return;
  await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefSql}`);
  console.log(`✅ Added ${tableName}.${columnName}`);
}

async function ensureTable(tableName, createSql) {
  await db.query(createSql);
  console.log(`✅ Ensured table: ${tableName}`);
}

async function initializeDatabase() {
  console.log('🔧 Running automatic DB bootstrap...');

  // Core master tables
  await ensureTable(
    'farmers',
    `CREATE TABLE IF NOT EXISTS farmers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      village VARCHAR(120) NULL,
      taluko VARCHAR(120) NULL,
      district VARCHAR(120) NULL,
      land_size VARCHAR(50) NULL,
      mobile VARCHAR(20) UNIQUE,
      email VARCHAR(150) NULL,
      water_level VARCHAR(50) NULL,
      password VARCHAR(255) NOT NULL,
      reset_otp VARCHAR(10) NULL,
      reset_otp_expiry DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await ensureTable(
    'shopkeepers',
    `CREATE TABLE IF NOT EXISTS shopkeepers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      shop_name VARCHAR(150) NOT NULL,
      mobile VARCHAR(20) UNIQUE,
      email VARCHAR(150) NULL,
      address TEXT NULL,
      city VARCHAR(120) NULL,
      district VARCHAR(120) NULL,
      pincode VARCHAR(20) NULL,
      gst_number VARCHAR(40) NULL,
      password VARCHAR(255) NOT NULL,
      is_approved TINYINT(1) DEFAULT 1,
      upi_id VARCHAR(100) NULL,
      upi_name VARCHAR(100) NULL,
      profile_picture VARCHAR(255) DEFAULT NULL,
      bank_name VARCHAR(100) NULL,
      bank_account_number VARCHAR(50) NULL,
      bank_ifsc VARCHAR(20) NULL,
      invoice_terms TEXT NULL,
      reset_otp VARCHAR(10) NULL,
      reset_otp_expiry DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await ensureTable(
    'crops',
    `CREATE TABLE IF NOT EXISTS crops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      season VARCHAR(80) NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await ensureTable(
    'crop_weekly_schedule',
    `CREATE TABLE IF NOT EXISTS crop_weekly_schedule (
      id INT AUTO_INCREMENT PRIMARY KEY,
      crop_id INT NOT NULL,
      week_number INT NOT NULL,
      title VARCHAR(200) NULL,
      instructions TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_crop_week (crop_id, week_number)
    )`
  );

  await ensureTable(
    'seeds',
    `CREATE TABLE IF NOT EXISTS seeds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      crop_id INT NULL,
      variety_name VARCHAR(150) NOT NULL,
      description TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_seed_crop (crop_id)
    )`
  );

  await ensureTable(
    'admin_seed_stock',
    `CREATE TABLE IF NOT EXISTS admin_seed_stock (
      id INT AUTO_INCREMENT PRIMARY KEY,
      seed_id INT NOT NULL,
      price DECIMAL(10,2) DEFAULT 0.00,
      price_unit VARCHAR(30) DEFAULT 'unit',
      stock INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_admin_seed (seed_id)
    )`
  );

  await ensureTable(
    'products',
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      category VARCHAR(80) NULL,
      description TEXT NULL,
      price DECIMAL(10,2) DEFAULT 0.00,
      price_unit VARCHAR(30) DEFAULT 'unit',
      stock INT DEFAULT 0,
      image_url VARCHAR(255) NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await ensureTable(
    'shopkeeper_products',
    `CREATE TABLE IF NOT EXISTS shopkeeper_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shopkeeper_id INT NOT NULL,
      seed_id INT NULL,
      name VARCHAR(180) NOT NULL,
      category VARCHAR(80) NULL,
      description TEXT NULL,
      price DECIMAL(10,2) DEFAULT 0.00,
      price_unit VARCHAR(30) DEFAULT 'unit',
      quantity_value DECIMAL(10,2) NULL,
      quantity_unit VARCHAR(30) NULL,
      discount_price DECIMAL(10,2) NULL,
      unit VARCHAR(30) NULL,
      stock INT DEFAULT 0,
      image_url VARCHAR(255) NULL,
      is_approved TINYINT(1) DEFAULT 1,
      is_active TINYINT(1) DEFAULT 1,
      hsn_sac VARCHAR(20) NULL,
      gst_rate DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shopkeeper_products_shopkeeper (shopkeeper_id)
    )`
  );

  // Cart and order flow tables
  await ensureTable(
    'cart',
    `CREATE TABLE IF NOT EXISTS cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      item_type ENUM('product','seed') NOT NULL DEFAULT 'product',
      product_id INT NULL,
      seed_stock_id INT NULL,
      quantity INT DEFAULT 1,
      price_snapshot DECIMAL(10,2) DEFAULT 0.00,
      price_unit VARCHAR(30) DEFAULT 'unit',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cart_farmer (farmer_id)
    )`
  );

  await ensureTable(
    'shopkeeper_cart',
    `CREATE TABLE IF NOT EXISTS shopkeeper_cart (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      product_id INT NOT NULL,
      shopkeeper_id INT NOT NULL,
      quantity INT DEFAULT 1,
      price_snapshot DECIMAL(10,2) DEFAULT 0.00,
      price_unit VARCHAR(30) DEFAULT 'unit',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shopkeeper_cart_farmer (farmer_id),
      INDEX idx_shopkeeper_cart_shopkeeper (shopkeeper_id)
    )`
  );

  await ensureTable(
    'orders',
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      total_amount DECIMAL(10,2) DEFAULT 0.00,
      address TEXT NULL,
      status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_orders_farmer (farmer_id)
    )`
  );

  await ensureTable(
    'order_items',
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      item_type ENUM('product','seed') NOT NULL DEFAULT 'product',
      product_id INT NULL,
      seed_stock_id INT NULL,
      item_name VARCHAR(200) NULL,
      quantity INT DEFAULT 1,
      price_unit VARCHAR(30) DEFAULT 'unit',
      price_at_purchase DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_order_items_order (order_id)
    )`
  );

  await ensureTable(
    'payments',
    `CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      farmer_id INT NOT NULL,
      amount DECIMAL(10,2) DEFAULT 0.00,
      payment_method VARCHAR(30) DEFAULT 'upi',
      payment_status ENUM('pending','processing','completed','failed','cod_pending','refunded') DEFAULT 'pending',
      upi_id VARCHAR(100) NULL,
      upi_transaction_id VARCHAR(100) NULL,
      upi_screenshot_path VARCHAR(255) NULL,
      delivery_address TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_payments_order (order_id),
      INDEX idx_payments_farmer (farmer_id)
    )`
  );

  await ensureTable(
    'shopkeeper_orders',
    `CREATE TABLE IF NOT EXISTS shopkeeper_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      shopkeeper_id INT NOT NULL,
      total_amount DECIMAL(10,2) DEFAULT 0.00,
      delivery_address TEXT NULL,
      note TEXT NULL,
      order_status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shopkeeper_orders_farmer (farmer_id),
      INDEX idx_shopkeeper_orders_shopkeeper (shopkeeper_id)
    )`
  );

  await ensureTable(
    'shopkeeper_order_items',
    `CREATE TABLE IF NOT EXISTS shopkeeper_order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(200) NULL,
      quantity INT DEFAULT 1,
      price_unit VARCHAR(30) DEFAULT 'unit',
      price_at_purchase DECIMAL(10,2) DEFAULT 0.00,
      subtotal DECIMAL(10,2) DEFAULT 0.00,
      hsn_sac VARCHAR(20) NULL,
      gst_rate DECIMAL(5,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shopkeeper_order_items_order (order_id)
    )`
  );

  await ensureTable(
    'shopkeeper_payments',
    `CREATE TABLE IF NOT EXISTS shopkeeper_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      farmer_id INT NOT NULL,
      shopkeeper_id INT NOT NULL,
      amount DECIMAL(10,2) DEFAULT 0.00,
      payment_method VARCHAR(30) DEFAULT 'upi',
      payment_status ENUM('pending','processing','completed','failed','cod_pending','refunded') DEFAULT 'pending',
      upi_id VARCHAR(100) NULL,
      upi_transaction_id VARCHAR(100) NULL,
      upi_screenshot VARCHAR(255) NULL,
      qr_code_data TEXT NULL,
      utr_number VARCHAR(50) NULL,
      payment_verified TINYINT(1) DEFAULT 0,
      refund_amount DECIMAL(10,2) DEFAULT 0.00,
      refund_note TEXT NULL,
      refund_processed_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shopkeeper_payments_order (order_id),
      INDEX idx_shopkeeper_payments_farmer (farmer_id)
    )`
  );

  await ensureTable(
    'disease_history',
    `CREATE TABLE IF NOT EXISTS disease_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      image_path VARCHAR(255) NULL,
      disease_name VARCHAR(180) NULL,
      confidence DECIMAL(8,4) NULL,
      remedy TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_disease_history_farmer (farmer_id)
    )`
  );

  // Review tables
  await ensureTable(
    'product_reviews',
    `CREATE TABLE IF NOT EXISTS product_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      rating INT NOT NULL,
      review_text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_product_review (product_id, user_id),
      INDEX idx_product_id (product_id),
      INDEX idx_user_id (user_id)
    )`
  );

  await ensureTable(
    'shopkeeper_reviews',
    `CREATE TABLE IF NOT EXISTS shopkeeper_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      farmer_id INT NOT NULL,
      shopkeeper_id INT NOT NULL,
      rating INT NOT NULL,
      review_text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_review (product_id, farmer_id),
      INDEX idx_product_id (product_id),
      INDEX idx_farmer_id (farmer_id),
      INDEX idx_shopkeeper_id (shopkeeper_id)
    )`
  );

  await ensureTable(
    'shopkeeper_product_reviews',
    `CREATE TABLE IF NOT EXISTS shopkeeper_product_reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shopkeeper_product_id INT NOT NULL,
      user_id INT NOT NULL,
      rating INT NOT NULL,
      review_text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_shopkeeper_product_review (shopkeeper_product_id, user_id),
      INDEX idx_shopkeeper_product_id (shopkeeper_product_id),
      INDEX idx_user_id (user_id)
    )`
  );

  // OTP-related columns
  await ensureColumn('farmers', 'reset_otp', 'VARCHAR(10) NULL');
  await ensureColumn('farmers', 'reset_otp_expiry', 'DATETIME NULL');
  await ensureColumn('shopkeepers', 'reset_otp', 'VARCHAR(10) NULL');
  await ensureColumn('shopkeepers', 'reset_otp_expiry', 'DATETIME NULL');

  // Shopkeeper profile / invoice columns
  await ensureColumn('shopkeepers', 'profile_picture', 'VARCHAR(255) DEFAULT NULL');
  await ensureColumn('shopkeepers', 'bank_name', 'VARCHAR(100) NULL');
  await ensureColumn('shopkeepers', 'bank_account_number', 'VARCHAR(50) NULL');
  await ensureColumn('shopkeepers', 'bank_ifsc', 'VARCHAR(20) NULL');
  await ensureColumn('shopkeepers', 'invoice_terms', 'TEXT NULL');
  await ensureColumn('shopkeepers', 'upi_id', 'VARCHAR(100) NULL');
  await ensureColumn('shopkeepers', 'upi_name', 'VARCHAR(100) NULL');

  // Payment / product columns used in newer flows
  await ensureColumn('shopkeeper_payments', 'qr_code_data', 'TEXT NULL');
  await ensureColumn('shopkeeper_payments', 'utr_number', 'VARCHAR(50) NULL');
  await ensureColumn('shopkeeper_payments', 'payment_verified', 'TINYINT(1) DEFAULT 0');
  await ensureColumn('shopkeeper_payments', 'refund_amount', 'DECIMAL(10,2) DEFAULT 0.00');
  await ensureColumn('shopkeeper_payments', 'refund_note', 'TEXT NULL');
  await ensureColumn('shopkeeper_payments', 'refund_processed_at', 'DATETIME NULL');
  await ensureColumn('shopkeeper_products', 'hsn_sac', 'VARCHAR(20) NULL');
  await ensureColumn('shopkeeper_products', 'gst_rate', 'DECIMAL(5,2) DEFAULT 0.00');
  await ensureColumn('shopkeeper_order_items', 'hsn_sac', 'VARCHAR(20) NULL');
  await ensureColumn('shopkeeper_order_items', 'gst_rate', 'DECIMAL(5,2) DEFAULT 0.00');

  console.log('✅ DB bootstrap completed.');
}

module.exports = { initializeDatabase };
