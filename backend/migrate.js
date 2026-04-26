// migrate.js
// Updates ENUM columns on orders, payments, and shopkeeper_payments tables.
// Run: node migrate.js

require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  console.log('Starting schema migration...');

  try {
    await db.query(
      "ALTER TABLE orders MODIFY status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending'"
    );
    console.log('✅ orders.status updated');
  } catch (e) {
    console.warn('⚠️  orders.status:', e.message);
  }

  try {
    await db.query(
      "ALTER TABLE payments MODIFY payment_status ENUM('pending','processing','completed','failed','cod_pending','refunded') DEFAULT 'pending'"
    );
    console.log('✅ payments.payment_status updated');
  } catch (e) {
    console.warn('⚠️  payments.payment_status:', e.message);
  }

  try {
    await db.query(
      "ALTER TABLE shopkeeper_payments MODIFY payment_status ENUM('pending','processing','completed','failed','cod_pending','refunded') DEFAULT 'pending'"
    );
    console.log('✅ shopkeeper_payments.payment_status updated');
  } catch (e) {
    console.warn('⚠️  shopkeeper_payments.payment_status:', e.message);
  }

  console.log('Migration complete.');
  process.exit(0);
}

migrate();
