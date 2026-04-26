require('dotenv').config();
const db = require('./config/db');

async function updateDb() {
  try {
    await db.query("ALTER TABLE shopkeepers ADD COLUMN bank_name VARCHAR(100) NULL, ADD COLUMN bank_account_number VARCHAR(50) NULL, ADD COLUMN bank_ifsc VARCHAR(20) NULL, ADD COLUMN invoice_terms TEXT NULL");
    console.log("Added columns to shopkeepers");
  } catch (err) {
    console.log("Error or already exists:", err.message);
  }

  try {
    await db.query("ALTER TABLE shopkeeper_products ADD COLUMN hsn_sac VARCHAR(20) NULL, ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 0.00");
    console.log("Added columns to shopkeeper_products");
  } catch (err) {
    console.log("Error or already exists:", err.message);
  }

  try {
    await db.query("ALTER TABLE shopkeeper_order_items ADD COLUMN hsn_sac VARCHAR(20) NULL, ADD COLUMN gst_rate DECIMAL(5,2) DEFAULT 0.00");
    console.log("Added columns to shopkeeper_order_items");
  } catch (err) {
    console.log("Error or already exists:", err.message);
  }

  process.exit();
}

updateDb();
