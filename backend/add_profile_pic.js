require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  console.log('Adding profile_picture column to shopkeepers...');

  try {
    await db.query(
      "ALTER TABLE shopkeepers ADD COLUMN profile_picture VARCHAR(255) DEFAULT NULL"
    );
    console.log('✅ shopkeepers.profile_picture added');
  } catch (e) {
    console.warn('⚠️  shopkeepers.profile_picture:', e.message);
  }

  process.exit(0);
}

migrate();
