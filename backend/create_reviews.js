// create_reviews.js
// Creates the product_reviews table for admin-product reviews by farmers.
// Run: node create_reviews.js

require('dotenv').config();
const db = require('./config/db');

async function createTable() {
  console.log('Creating product_reviews table...');
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        product_id  INT NOT NULL,
        user_id     INT NOT NULL,
        rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id)    REFERENCES farmers(id)  ON DELETE CASCADE,
        INDEX idx_product_id (product_id),
        INDEX idx_user_id    (user_id)
      )
    `);
    console.log('✅ product_reviews table created (or already exists)');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createTable();