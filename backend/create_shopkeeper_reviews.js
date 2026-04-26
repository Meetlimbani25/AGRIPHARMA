// create_shopkeeper_reviews.js
// Creates the shopkeeper_reviews table used by the shopkeeper controller.
// Run: node create_shopkeeper_reviews.js

require('dotenv').config();
const db = require('./config/db');

async function createTable() {
  console.log('Creating shopkeeper_reviews table...');
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS shopkeeper_reviews (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        product_id    INT NOT NULL,
        farmer_id     INT NOT NULL,
        shopkeeper_id INT NOT NULL,
        rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text   TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_review (product_id, farmer_id),
        FOREIGN KEY (product_id)    REFERENCES shopkeeper_products(id) ON DELETE CASCADE,
        FOREIGN KEY (farmer_id)     REFERENCES farmers(id)             ON DELETE CASCADE,
        FOREIGN KEY (shopkeeper_id) REFERENCES shopkeepers(id)         ON DELETE CASCADE,
        INDEX idx_product_id    (product_id),
        INDEX idx_farmer_id     (farmer_id),
        INDEX idx_shopkeeper_id (shopkeeper_id)
      )
    `);
    console.log('✅ shopkeeper_reviews table created (or already exists)');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createTable();