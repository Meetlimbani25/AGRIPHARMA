// query_db.js
// Quick diagnostic — prints recent rows from key tables.
// Run: node query_db.js

require('dotenv').config();
const db = require('./config/db');

async function queryDB() {
  try {
    const [products] = await db.query(
      'SELECT id, name, category, shopkeeper_id, is_approved FROM shopkeeper_products ORDER BY id DESC LIMIT 5'
    );
    console.log('Latest Shopkeeper Products:', products);

    const [farmers] = await db.query(
      'SELECT id, name, email FROM farmers ORDER BY id DESC LIMIT 5'
    );
    console.log('Latest Farmers:', farmers);

    const [shopkeepers] = await db.query(
      'SELECT id, name, shop_name, is_approved FROM shopkeepers ORDER BY id DESC LIMIT 5'
    );
    console.log('Latest Shopkeepers:', shopkeepers);

  } catch (err) {
    console.error('❌ Query error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

queryDB();
