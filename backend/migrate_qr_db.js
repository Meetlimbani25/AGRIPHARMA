// migrate_qr_db.js
// Adds UPI / QR-code columns to shopkeepers and shopkeeper_payments tables.
// Run: node migrate_qr_db.js

require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  console.log('Starting QR-code payment DB migration...');

  const alterations = [
    {
      label: 'shopkeepers.upi_id',
      sql: 'ALTER TABLE shopkeepers ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100)'
    },
    {
      label: 'shopkeepers.upi_name',
      sql: 'ALTER TABLE shopkeepers ADD COLUMN IF NOT EXISTS upi_name VARCHAR(100)'
    },
    {
      label: 'shopkeeper_payments.qr_code_data',
      sql: 'ALTER TABLE shopkeeper_payments ADD COLUMN IF NOT EXISTS qr_code_data TEXT'
    },
    {
      label: 'shopkeeper_payments.utr_number',
      sql: 'ALTER TABLE shopkeeper_payments ADD COLUMN IF NOT EXISTS utr_number VARCHAR(50)'
    },
    {
      label: 'shopkeeper_payments.payment_verified',
      sql: 'ALTER TABLE shopkeeper_payments ADD COLUMN IF NOT EXISTS payment_verified TINYINT(1) DEFAULT 0'
    },
  ];

  for (const { label, sql } of alterations) {
    try {
      await db.query(sql);
      console.log(`✅ ${label} added`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`ℹ️  ${label} already exists — skipped`);
      } else {
        console.warn(`⚠️  ${label}: ${e.message}`);
      }
    }
  }

  console.log('QR migration complete.');
  process.exit(0);
}

migrate();
