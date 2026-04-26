// migrate_otp.js
// Adds reset_otp and reset_otp_expiry columns to farmers and shopkeepers tables.
// Run: node migrate_otp.js

require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  console.log('Starting OTP column migration...');

  const alterations = [
    {
      table: 'farmers',
      sql: 'ALTER TABLE farmers ADD COLUMN reset_otp VARCHAR(10) NULL, ADD COLUMN reset_otp_expiry DATETIME NULL'
    },
    {
      table: 'shopkeepers',
      sql: 'ALTER TABLE shopkeepers ADD COLUMN reset_otp VARCHAR(10) NULL, ADD COLUMN reset_otp_expiry DATETIME NULL'
    },
  ];

  for (const { table, sql } of alterations) {
    try {
      await db.query(sql);
      console.log(`✅ reset_otp columns added to ${table}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`ℹ️  Columns already exist in ${table} — skipped`);
      } else {
        console.error(`❌ Failed for ${table}:`, e.message);
        process.exit(1);
      }
    }
  }

  console.log('OTP migration complete.');
  process.exit(0);
}

migrate();
